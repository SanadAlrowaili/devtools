import type { ApiError, CampaignBrief, CampaignPlan, GeneratedImage, ImagePrompt } from './types'

/**
 * ---------------------------------------------------------------------------
 * THE CLIENT SIDE OF THE BOUNDARY.
 * ---------------------------------------------------------------------------
 * Everything the browser is allowed to do with OpenAI goes through these two
 * functions, and neither of them knows anything about OpenAI. They talk to our
 * own same-origin route handlers, which hold the API key.
 *
 * This module must never import `openai`, `lib/config.ts`, or any `*.server.ts`
 * module. Those imports are guarded by `server-only` and would break the build.
 */

/** An error carrying the human-readable detail line from the API. */
export class ApiRequestError extends Error {
    readonly detail?: string

    constructor(message: string, detail?: string) {
        super(message)
        this.name = 'ApiRequestError'
        this.detail = detail
    }
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
    let response: Response

    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
            signal,
        })
    } catch (error) {
        // Re-throw aborts untouched so callers can distinguish cancellation
        // from a genuine network failure.
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw error
        }

        throw new ApiRequestError('Could not reach the server.', 'Check your connection and try again.')
    }

    if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as ApiError | null

        throw new ApiRequestError(problem?.error ?? `Request failed (${response.status}).`, problem?.detail)
    }

    return (await response.json()) as T
}

/** Generate the written campaign plan. */
export function generateCampaign(brief: CampaignBrief, signal?: AbortSignal): Promise<CampaignPlan> {
    return postJson<CampaignPlan>('/api/campaign', brief, signal)
}

/** Render the campaign key visuals from the model-authored image prompts. */
export function generateImages(
    prompts: ImagePrompt[],
    signal?: AbortSignal
): Promise<{ images: GeneratedImage[]; failedCount: number }> {
    return postJson<{ images: GeneratedImage[]; failedCount: number }>(
        '/api/campaign/images',
        { prompts: prompts.map(({ label, prompt }) => ({ label, prompt })) },
        signal
    )
}
