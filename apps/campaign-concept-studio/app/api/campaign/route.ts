import { NextResponse } from 'next/server'

import { config } from '@/lib/config'
import { toApiError } from '@/lib/errors.server'
import { getOpenAIClient } from '@/lib/openai.server'
import { buildBriefInput, systemInstructions } from '@/lib/prompts'
import { briefSchema, campaignJsonSchema } from '@/lib/schemas'
import type { CampaignPlan } from '@/lib/types'

/**
 * POST /api/campaign
 *
 * Server-side half of the app. Takes a validated brief and returns a fully
 * structured campaign plan. The OpenAI key never leaves this process.
 *
 * Uses the **Responses API** (`client.responses.create`) — the current OpenAI
 * text generation surface. Not Chat Completions, not the legacy Completions
 * endpoint.
 */

// Route handlers are server-only by default. Pinned explicitly because the
// OpenAI SDK expects a Node runtime, and this route must never be statically
// evaluated at build time (it reads env + calls out to a provider).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    let payload: unknown

    try {
        payload = await request.json()
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }

    const parsed = briefSchema.safeParse(payload)

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: 'Please check the brief and try again.',
                detail: parsed.error.issues.map((issue) => issue.message).join(' '),
            },
            { status: 400 }
        )
    }

    try {
        const client = getOpenAIClient()

        const response = await client.responses.create({
            model: config.text.model,

            // Persona and standing rules — see lib/prompts.ts.
            instructions: systemInstructions,

            // The per-request brief.
            input: buildBriefInput(parsed.data),

            // GPT-5.6 reasoning control. See lib/config.ts to tune.
            reasoning: { effort: config.text.reasoningEffort },

            max_output_tokens: config.text.maxOutputTokens,

            // Structured Outputs on the Responses API live under `text.format`
            // (on Chat Completions this was `response_format`). `strict: true`
            // guarantees the payload matches campaignJsonSchema exactly, so the
            // UI can render it without defensive checks on every field.
            text: {
                format: {
                    type: 'json_schema',
                    name: 'campaign_plan',
                    strict: true,
                    schema: campaignJsonSchema as unknown as Record<string, unknown>,
                },
            },

            // We only need the final answer; don't persist it on OpenAI's side.
            store: false,
        })

        // A run can stop early if it hits the token ceiling. Surface that as a
        // real error instead of trying to parse half a JSON document.
        if (response.status === 'incomplete') {
            return NextResponse.json(
                {
                    error: 'The model ran out of room before finishing the concept.',
                    detail: 'Raise text.maxOutputTokens in lib/config.ts, or shorten the brief.',
                },
                { status: 502 }
            )
        }

        // The model can decline instead of answering (safety refusal).
        const refusal = response.output
            .flatMap((item) => (item.type === 'message' ? item.content : []))
            .find((part) => part.type === 'refusal')

        if (refusal && refusal.type === 'refusal') {
            return NextResponse.json(
                { error: 'The model declined this brief.', detail: refusal.refusal },
                { status: 422 }
            )
        }

        const text = response.output_text

        if (!text) {
            return NextResponse.json(
                { error: 'The model returned an empty response.', detail: 'Try generating again.' },
                { status: 502 }
            )
        }

        // Safe to cast: `strict: true` structured outputs are schema-guaranteed.
        const plan = JSON.parse(text) as CampaignPlan

        return NextResponse.json(plan, {
            status: 200,
            headers: { 'cache-control': 'no-store' },
        })
    } catch (error) {
        const { status, body } = toApiError(error)

        return NextResponse.json(body, { status })
    }
}
