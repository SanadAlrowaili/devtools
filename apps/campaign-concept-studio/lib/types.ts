/**
 * Shared types for the campaign payloads.
 *
 * Safe to import from BOTH server and client code — this module contains types
 * and plain constants only, no secrets and no SDK imports.
 */

export const CHANNELS = [
    'Instagram',
    'TikTok',
    'LinkedIn',
    'X',
    'YouTube',
    'Email',
    'Paid search',
    'Display / OOH',
    'Landing page',
    'PR / earned',
] as const

export type Channel = (typeof CHANNELS)[number]

export const TONES = [
    'Bold and playful',
    'Warm and human',
    'Premium and understated',
    'Technical and credible',
    'Urgent and direct',
    'Witty and irreverent',
] as const

export type Tone = (typeof TONES)[number]

/** The form payload the browser POSTs to /api/campaign. */
export interface CampaignBrief {
    brief: string
    audience: string
    product: string
    tone: string
    channels: string[]
}

export interface CampaignConcept {
    name: string
    big_idea: string
    positioning_statement: string
    audience_insight: string
    key_messages: string[]
}

export interface CopyVariant {
    label: string
    channel: string
    headline: string
    subheadline: string
    body: string
    cta: string
}

export interface ChecklistItem {
    phase: string
    task: string
    owner: string
    timing: string
}

export interface ImagePrompt {
    label: string
    art_direction: string
    prompt: string
}

/** The structured payload returned by /api/campaign. */
export interface CampaignPlan {
    concept: CampaignConcept
    variants: CopyVariant[]
    launch_checklist: ChecklistItem[]
    image_prompts: ImagePrompt[]
}

/** A single rendered image returned by /api/campaign/images. */
export interface GeneratedImage {
    label: string
    prompt: string
    /** `data:image/webp;base64,...` — ready to drop straight into an <img src>. */
    dataUrl: string
}

/** Uniform error body for both route handlers. */
export interface ApiError {
    error: string
    detail?: string
}
