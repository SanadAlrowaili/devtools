import 'server-only'

import OpenAI from 'openai'

import { MissingApiKeyError } from './openai.server'
import type { ApiError } from './types'

/**
 * Translate a thrown error into a safe status + client-facing message.
 *
 * Two rules here matter:
 *  - We never forward raw provider errors to the browser; they can contain
 *    request IDs, org identifiers, and prompt fragments.
 *  - Every branch returns something a marketer can act on ("try again in a
 *    moment"), not a stack trace.
 */
export function toApiError(error: unknown): { status: number; body: ApiError } {
    if (error instanceof MissingApiKeyError) {
        return {
            status: 500,
            body: {
                error: 'The server is not configured with an OpenAI API key.',
                detail: 'Set OPENAI_API_KEY in .env.local and restart the server.',
            },
        }
    }

    if (error instanceof OpenAI.APIError) {
        switch (error.status) {
            case 401:
                return {
                    status: 500,
                    body: {
                        error: 'The configured OpenAI API key was rejected.',
                        detail: 'Check that OPENAI_API_KEY is valid and has not been revoked.',
                    },
                }
            case 403:
                return {
                    status: 500,
                    body: {
                        error: 'This OpenAI account is not allowed to use the configured model.',
                        detail: 'Check model access for your project, or pick a different model in lib/config.ts.',
                    },
                }
            case 404:
                return {
                    status: 500,
                    body: {
                        error: 'The configured model does not exist.',
                        detail: 'Check the model name in lib/config.ts against developers.openai.com/api/docs/models.',
                    },
                }
            case 429:
                return {
                    status: 429,
                    body: {
                        error: 'Rate limit or quota reached.',
                        detail: 'Wait a few seconds and generate again, or check your billing limits.',
                    },
                }
            case 400:
                return {
                    status: 400,
                    body: {
                        error: 'OpenAI rejected the request.',
                        detail: 'This is usually a content-policy block on the brief. Try rephrasing it.',
                    },
                }
            default:
                return {
                    status: 502,
                    body: {
                        error: 'OpenAI could not complete the request.',
                        detail: 'This is usually temporary. Try again in a moment.',
                    },
                }
        }
    }

    if (error instanceof OpenAI.APIConnectionTimeoutError) {
        return {
            status: 504,
            body: {
                error: 'The request to OpenAI timed out.',
                detail: 'Try again, or lower the reasoning effort / image quality in lib/config.ts.',
            },
        }
    }

    // Log the full error server-side; return a generic message to the client.
    console.error('[campaign-studio] unhandled error', error)

    return {
        status: 500,
        body: { error: 'Something went wrong generating your campaign.', detail: 'Try again in a moment.' },
    }
}
