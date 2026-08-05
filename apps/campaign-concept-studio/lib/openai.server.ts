import 'server-only'

import OpenAI from 'openai'

import { config } from './config'

/**
 * ---------------------------------------------------------------------------
 * SERVER-ONLY OpenAI client.
 * ---------------------------------------------------------------------------
 * The `server-only` import above is a build-time guard: if any client
 * component (anything with "use client") ever imports this module — directly
 * or transitively — the Next.js build FAILS instead of quietly shipping your
 * API key to the browser.
 *
 * `OPENAI_API_KEY` has no NEXT_PUBLIC_ prefix, so Next.js will not inline it
 * into client bundles either. Two independent guards, on purpose.
 */

let client: OpenAI | null = null

/** Thrown when the server is missing its OpenAI credentials. */
export class MissingApiKeyError extends Error {
    constructor() {
        super('OPENAI_API_KEY is not set. Copy .env.example to .env.local and add your key.')
        this.name = 'MissingApiKeyError'
    }
}

/**
 * Lazily construct the shared OpenAI client.
 *
 * Lazy rather than module-scope so that importing this file (during a build,
 * or in a test) doesn't explode when the key is absent — it only throws when
 * a request actually needs to talk to OpenAI.
 */
export function getOpenAIClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new MissingApiKeyError()
    }

    if (client === null) {
        client = new OpenAI({
            apiKey,
            organization: process.env.OPENAI_ORG_ID,
            project: process.env.OPENAI_PROJECT_ID,
            timeout: config.requestTimeoutMs,
            maxRetries: 2,
        })
    }

    return client
}
