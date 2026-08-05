import { z } from 'zod'

import { config } from './config'

/**
 * Two different kinds of schema live here:
 *
 *  1. `briefSchema` / `imageRequestSchema` — zod schemas that validate the
 *     UNTRUSTED request bodies arriving at our route handlers.
 *  2. `campaignJsonSchema` — a JSON Schema handed to the Responses API so the
 *     model's output is guaranteed to match the shape our UI renders.
 *
 * The JSON Schema is written by hand rather than generated, because OpenAI
 * Structured Outputs in `strict` mode has rules a generic converter tends to
 * get wrong: every property must appear in `required`, and every object must
 * set `additionalProperties: false`.
 */

// ---------------------------------------------------------------------------
// 1. Inbound request validation
// ---------------------------------------------------------------------------

export const briefSchema = z.object({
    brief: z
        .string()
        .trim()
        .min(20, 'Give the brief at least a sentence (20+ characters) to work with.')
        .max(2000, 'Brief is too long — keep it under 2000 characters.'),
    audience: z
        .string()
        .trim()
        .min(3, 'Describe the target audience.')
        .max(500, 'Audience description is too long — keep it under 500 characters.'),
    product: z
        .string()
        .trim()
        .min(3, 'Describe the product.')
        .max(1000, 'Product description is too long — keep it under 1000 characters.'),
    tone: z.string().trim().min(2, 'Pick or describe a tone.').max(200),
    channels: z
        .array(z.string().trim().min(1).max(60))
        .min(1, 'Select at least one channel.')
        .max(10, 'Select at most 10 channels.'),
})

export type BriefInput = z.infer<typeof briefSchema>

export const imageRequestSchema = z.object({
    prompts: z
        .array(
            z.object({
                label: z.string().trim().min(1).max(120),
                prompt: z.string().trim().min(10).max(4000),
            })
        )
        .min(1, 'Provide at least one image prompt.')
        .max(config.image.count, `Provide at most ${config.image.count} image prompts.`),
})

export type ImageRequestInput = z.infer<typeof imageRequestSchema>

// ---------------------------------------------------------------------------
// 2. Structured output contract for the Responses API
// ---------------------------------------------------------------------------

const stringField = (description: string) => ({ type: 'string' as const, description })

/**
 * The exact shape we require back from the model.
 *
 * To change WHAT gets generated (extra copy variants, a different checklist
 * shape, more image prompts), edit this schema and the matching interfaces in
 * lib/types.ts, then adjust the wording in lib/prompts.ts to match.
 */
export const campaignJsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['concept', 'variants', 'launch_checklist', 'image_prompts'],
    properties: {
        concept: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'big_idea', 'positioning_statement', 'audience_insight', 'key_messages'],
            properties: {
                name: stringField('A short, memorable campaign name. 2-5 words, title case.'),
                big_idea: stringField('The single creative idea in 1-2 sentences.'),
                positioning_statement: stringField(
                    'One sentence: for [audience] who [need], [product] is the [category] that [benefit].'
                ),
                audience_insight: stringField(
                    'The non-obvious human truth about the audience this campaign leans on. 1-2 sentences.'
                ),
                key_messages: {
                    type: 'array',
                    description: 'Exactly 3 supporting message pillars, one short sentence each.',
                    items: { type: 'string' },
                },
            },
        },
        variants: {
            type: 'array',
            description: 'Exactly 3 distinct headline + body copy variants, each taking a different angle.',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['label', 'channel', 'headline', 'subheadline', 'body', 'cta'],
                properties: {
                    label: stringField('Short name for the angle, e.g. "Problem-first" or "Status play".'),
                    channel: stringField('The channel from the brief this variant is written for.'),
                    headline: stringField('Under 12 words. No trailing period.'),
                    subheadline: stringField('One supporting line, under 20 words.'),
                    body: stringField('2-4 sentences of body copy sized for the channel.'),
                    cta: stringField('Call to action, 2-5 words.'),
                },
            },
        },
        launch_checklist: {
            type: 'array',
            description: '6-10 concrete pre-launch and launch tasks in execution order.',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['phase', 'task', 'owner', 'timing'],
                properties: {
                    phase: stringField('One of: Prep, Build, Launch, Measure.'),
                    task: stringField('A single concrete, actionable task.'),
                    owner: stringField('The role that owns it, e.g. "Content lead". Never a person name.'),
                    timing: stringField('Relative timing, e.g. "T-14 days" or "Launch day".'),
                },
            },
        },
        image_prompts: {
            type: 'array',
            description: `Exactly ${config.image.count} image prompts for key visuals expressing the campaign direction.`,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['label', 'art_direction', 'prompt'],
                properties: {
                    label: stringField('Short name for the visual, e.g. "Hero shot".'),
                    art_direction: stringField('One line on why this visual fits the concept.'),
                    prompt: stringField(
                        'A self-contained image generation prompt: subject, composition, lighting, colour palette, mood, and medium. Describe no text, logos, or wordmarks in the image.'
                    ),
                },
            },
        },
    },
} as const
