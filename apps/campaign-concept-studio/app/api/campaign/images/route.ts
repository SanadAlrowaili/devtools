import { NextResponse } from 'next/server'

import { config } from '@/lib/config'
import { toApiError } from '@/lib/errors.server'
import { getOpenAIClient } from '@/lib/openai.server'
import { buildImagePrompt } from '@/lib/prompts'
import { imageRequestSchema } from '@/lib/schemas'
import type { GeneratedImage } from '@/lib/types'

/**
 * POST /api/campaign/images
 *
 * Renders the campaign key visuals with `gpt-image-2`, OpenAI's current image
 * generation model.
 *
 * This is a separate endpoint from /api/campaign on purpose: text comes back in
 * seconds and images take considerably longer, so the client renders the
 * written concept immediately and streams the visuals in behind it. One slow
 * call never blocks the whole result.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Image generation is slow; give the platform permission to wait for it.
export const maxDuration = 300

export async function POST(request: Request) {
    let payload: unknown

    try {
        payload = await request.json()
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }

    const parsed = imageRequestSchema.safeParse(payload)

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: 'Invalid image request.',
                detail: parsed.error.issues.map((issue) => issue.message).join(' '),
            },
            { status: 400 }
        )
    }

    try {
        const client = getOpenAIClient()

        // Render in parallel, but tolerate partial failure: one blocked prompt
        // shouldn't cost the user the other visuals.
        const results = await Promise.allSettled(
            parsed.data.prompts.map(async (item): Promise<GeneratedImage> => {
                const result = await client.images.generate({
                    model: config.image.model,
                    prompt: buildImagePrompt(item.prompt),
                    // Sizing, quality and encoding are all tunable in lib/config.ts.
                    size: config.image.size as 'auto',
                    quality: config.image.quality,
                    output_format: config.image.format,
                    n: 1,
                })

                const b64 = result.data?.[0]?.b64_json

                if (!b64) {
                    throw new Error(`No image data returned for "${item.label}"`)
                }

                return {
                    label: item.label,
                    prompt: item.prompt,
                    // gpt-image models return base64, never a URL. Handing back a
                    // data URL keeps the asset on our origin — no third-party
                    // image host, and nothing expires out from under the user.
                    dataUrl: `data:image/${config.image.format};base64,${b64}`,
                }
            })
        )

        const images = results
            .filter((result): result is PromiseFulfilledResult<GeneratedImage> => result.status === 'fulfilled')
            .map((result) => result.value)

        const failed = results.filter((result) => result.status === 'rejected')

        failed.forEach((result) => {
            console.error('[campaign-studio] image generation failed', (result as PromiseRejectedResult).reason)
        })

        // Every single one failed — report it as an error rather than an
        // empty-but-successful response.
        if (images.length === 0) {
            const [first] = results

            throw first?.status === 'rejected' ? first.reason : new Error('Image generation returned no images.')
        }

        return NextResponse.json(
            {
                images,
                // Lets the UI say "2 of 3 rendered" instead of silently dropping one.
                failedCount: failed.length,
            },
            { status: 200, headers: { 'cache-control': 'no-store' } }
        )
    } catch (error) {
        const { status, body } = toApiError(error)

        return NextResponse.json(body, { status })
    }
}
