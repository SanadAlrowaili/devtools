import 'server-only'

/**
 * ---------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for model + generation settings.
 * ---------------------------------------------------------------------------
 * This is the file to edit when you want to change which model runs, how hard
 * it thinks, or what the generated images look like. Every value can also be
 * overridden per-environment with an env var (see .env.example) so you don't
 * have to ship a code change to try a different model in staging.
 *
 * This module is imported only by server code. It reads process.env, which is
 * empty in the browser.
 */

/** Reasoning effort levels accepted by the GPT-5.6 family. */
export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/** Quality tiers accepted by the gpt-image models. */
export type ImageQuality = 'low' | 'medium' | 'high'

/** Output encodings accepted by the gpt-image models. */
export type ImageFormat = 'png' | 'webp' | 'jpeg'

export const config = {
    text: {
        /**
         * Text model for the campaign concept.
         *
         * Current OpenAI lineup (see https://developers.openai.com/api/docs/models):
         *   - `gpt-5.6-sol`   flagship; deepest reasoning, highest cost
         *   - `gpt-5.6-terra` balanced quality/cost — our default for production
         *   - `gpt-5.6-luna`  cheapest; good for high-volume or draft passes
         *
         * Swap tiers by changing this line or setting OPENAI_TEXT_MODEL.
         */
        model: process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.6-terra',

        /**
         * Concepting is a creative, low-lookup task, so a light reasoning pass
         * keeps latency down without hurting quality. Raise to 'medium' or
         * 'high' if you want more rigorous strategic reasoning and can afford
         * the extra output tokens and seconds.
         */
        reasoningEffort: (process.env.OPENAI_REASONING_EFFORT ?? 'low') as ReasoningEffort,

        /**
         * Ceiling on generated tokens (including reasoning tokens). The full
         * concept payload lands around 1.5-2.5k tokens; this leaves headroom.
         * If you ever see truncated JSON, raise this first.
         */
        maxOutputTokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? 6000),
    },

    image: {
        /**
         * Image model. `gpt-image-2` is OpenAI's current image generation and
         * editing model.
         */
        model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2',

        /**
         * Size as "WIDTHxHEIGHT". gpt-image-2 accepts arbitrary sizes as long
         * as both dimensions are divisible by 16 and the aspect ratio sits
         * between 1:3 and 3:1. Handy presets:
         *   1024x1024  square       (social post)
         *   1536x1024  landscape    (hero banner, 3:2)
         *   1024x1536  portrait     (story, 2:3)
         */
        size: process.env.OPENAI_IMAGE_SIZE ?? '1024x1024',

        /** 'low' is a fast draft, 'high' is the hero-asset setting. */
        quality: (process.env.OPENAI_IMAGE_QUALITY ?? 'medium') as ImageQuality,

        /** webp keeps the base64 payload small; use png for lossless assets. */
        format: (process.env.OPENAI_IMAGE_FORMAT ?? 'webp') as ImageFormat,

        /** How many image prompts we ask the model for, and render, per run. */
        count: 3,
    },

    /** Hard ceiling on a single OpenAI request, in milliseconds. */
    requestTimeoutMs: Number(process.env.OPENAI_TIMEOUT_MS ?? 120_000),
} as const
