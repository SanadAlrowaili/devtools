'use client'

import type { CampaignPlan, GeneratedImage } from '@/lib/types'
import { Badge, Card, CopyButton, ErrorBanner, ImageSkeletonGrid, SectionHeading } from './ui'

/** Turns the whole plan into something a user can paste into a doc or Slack. */
function planToText(plan: CampaignPlan): string {
    const lines = [
        `CAMPAIGN: ${plan.concept.name}`,
        '',
        `Big idea: ${plan.concept.big_idea}`,
        `Positioning: ${plan.concept.positioning_statement}`,
        `Audience insight: ${plan.concept.audience_insight}`,
        '',
        'Key messages:',
        ...plan.concept.key_messages.map((message) => `  - ${message}`),
        '',
        'COPY VARIANTS',
        ...plan.variants.flatMap((variant) => [
            '',
            `[${variant.label} - ${variant.channel}]`,
            variant.headline,
            variant.subheadline,
            variant.body,
            `CTA: ${variant.cta}`,
        ]),
        '',
        'LAUNCH CHECKLIST',
        ...plan.launch_checklist.map((item) => `  [ ] ${item.timing} - ${item.task} (${item.phase} / ${item.owner})`),
        '',
        'IMAGE PROMPTS',
        ...plan.image_prompts.flatMap((item) => ['', `[${item.label}] ${item.art_direction}`, item.prompt]),
    ]

    return lines.join('\n')
}

function ConceptCard({ concept }: { concept: CampaignPlan['concept'] }) {
    return (
        <Card className="animate-rise overflow-hidden">
            <div className="border-b border-line bg-linear-to-b from-accent-soft/60 to-transparent px-5 py-6 sm:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">Campaign concept</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
                    {concept.name}
                </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-pretty text-ink-muted">
                    {concept.big_idea}
                </p>
            </div>

            <dl className="divide-y divide-line">
                <div className="px-5 py-4 sm:px-6">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Positioning</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-pretty text-ink">
                        {concept.positioning_statement}
                    </dd>
                </div>
                <div className="px-5 py-4 sm:px-6">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Audience insight</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-pretty text-ink">{concept.audience_insight}</dd>
                </div>
                <div className="px-5 py-4 sm:px-6">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Key messages</dt>
                    <dd className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                        {concept.key_messages.map((message, index) => (
                            <div key={index} className="rounded-xl border border-line bg-surface-muted p-3.5">
                                <span className="text-xs font-semibold text-accent-ink">{index + 1}</span>
                                <p className="mt-1 text-sm leading-relaxed text-pretty text-ink">{message}</p>
                            </div>
                        ))}
                    </dd>
                </div>
            </dl>
        </Card>
    )
}

function VariantsCard({ variants }: { variants: CampaignPlan['variants'] }) {
    return (
        <Card className="animate-rise overflow-hidden">
            <SectionHeading eyebrow="Step 2" title="Copy variants" />
            <ul className="divide-y divide-line">
                {variants.map((variant, index) => (
                    <li key={index} className="px-5 py-5 sm:px-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="accent">{variant.label}</Badge>
                            <Badge>{variant.channel}</Badge>
                            <div className="ml-auto">
                                <CopyButton
                                    value={`${variant.headline}\n${variant.subheadline}\n\n${variant.body}\n\nCTA: ${variant.cta}`}
                                />
                            </div>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold leading-snug text-balance text-ink">
                            {variant.headline}
                        </h3>
                        <p className="mt-1.5 text-sm font-medium text-pretty text-ink-muted">{variant.subheadline}</p>
                        <p className="mt-3 text-sm leading-relaxed text-pretty text-ink">{variant.body}</p>
                        <p className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
                            {variant.cta}
                            <svg
                                viewBox="0 0 16 16"
                                className="size-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 8h9m-3.5-3.5L12.5 8 8.5 11.5" />
                            </svg>
                        </p>
                    </li>
                ))}
            </ul>
        </Card>
    )
}

function ChecklistCard({ items }: { items: CampaignPlan['launch_checklist'] }) {
    return (
        <Card className="animate-rise overflow-hidden">
            <SectionHeading eyebrow="Step 3" title="Launch checklist" />
            <ol className="divide-y divide-line">
                {items.map((item, index) => (
                    <li key={index} className="flex gap-3.5 px-5 py-3.5 sm:px-6">
                        <span
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 rounded-[5px] border border-line-strong bg-surface-muted"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed text-pretty text-ink">{item.task}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                                <span className="font-medium text-accent-ink">{item.timing}</span>
                                <span>{item.phase}</span>
                                <span>{item.owner}</span>
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </Card>
    )
}

function VisualsCard({
    prompts,
    images,
    isLoading,
    error,
    failedCount,
    onRetry,
}: {
    prompts: CampaignPlan['image_prompts']
    images: GeneratedImage[]
    isLoading: boolean
    error: { title: string; detail?: string } | null
    failedCount: number
    onRetry: () => void
}) {
    return (
        <Card className="animate-rise overflow-hidden">
            <SectionHeading
                eyebrow="Step 4"
                title="Campaign direction"
                action={
                    !isLoading && images.length > 0 ? (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="rounded-md px-2 py-1 text-xs font-medium text-accent-ink underline underline-offset-4 transition-colors hover:no-underline"
                        >
                            Regenerate
                        </button>
                    ) : null
                }
            />

            <div className="p-5 sm:p-6">
                {error ? (
                    <ErrorBanner title={error.title} detail={error.detail} onRetry={onRetry} />
                ) : isLoading ? (
                    <>
                        <p className="mb-4 text-sm text-ink-muted">
                            Rendering {prompts.length} key visuals. This usually takes 15&ndash;40 seconds.
                        </p>
                        <ImageSkeletonGrid count={prompts.length} />
                    </>
                ) : (
                    <>
                        {failedCount > 0 ? (
                            <p className="mb-4 text-sm text-ink-muted">
                                {images.length} of {images.length + failedCount} visuals rendered. The rest were
                                skipped &mdash; try regenerating.
                            </p>
                        ) : null}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {images.map((image, index) => (
                                <figure key={index} className="group">
                                    <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-muted">
                                        {/*
                                          A plain <img> rather than next/image: the source is an
                                          inline base64 data URL that is already the exact size we
                                          asked for, so there is nothing for the image optimizer to
                                          fetch, cache, or resize.
                                        */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={image.dataUrl}
                                            alt={image.label}
                                            loading="lazy"
                                            className="size-full object-cover"
                                        />
                                    </div>
                                    <figcaption className="mt-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-ink">{image.label}</span>
                                            <a
                                                href={image.dataUrl}
                                                download={`${image.label.toLowerCase().replace(/\s+/g, '-')}.webp`}
                                                className="text-xs font-medium text-ink-faint underline underline-offset-4 transition-colors hover:text-ink"
                                            >
                                                Download
                                            </a>
                                        </div>
                                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-faint">
                                            {image.prompt}
                                        </p>
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </>
                )}

                <details className="mt-6 rounded-xl border border-line bg-surface-muted">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink select-none">
                        Image prompts ({prompts.length})
                    </summary>
                    <div className="space-y-4 border-t border-line px-4 py-4">
                        {prompts.map((prompt, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-ink">{prompt.label}</span>
                                    <CopyButton value={prompt.prompt} />
                                </div>
                                <p className="mt-0.5 text-xs italic text-ink-faint">{prompt.art_direction}</p>
                                <p className="mt-1.5 font-mono text-xs leading-relaxed text-ink-muted">
                                    {prompt.prompt}
                                </p>
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        </Card>
    )
}

export function CampaignResult({
    plan,
    images,
    imagesLoading,
    imagesError,
    failedCount,
    onRetryImages,
}: {
    plan: CampaignPlan
    images: GeneratedImage[]
    imagesLoading: boolean
    imagesError: { title: string; detail?: string } | null
    failedCount: number
    onRetryImages: () => void
}) {
    return (
        <div className="space-y-5">
            <div className="flex justify-end">
                <CopyButton value={planToText(plan)} label="Copy full campaign" />
            </div>
            <ConceptCard concept={plan.concept} />
            <VariantsCard variants={plan.variants} />
            <ChecklistCard items={plan.launch_checklist} />
            <VisualsCard
                prompts={plan.image_prompts}
                images={images}
                isLoading={imagesLoading}
                error={imagesError}
                failedCount={failedCount}
                onRetry={onRetryImages}
            />
        </div>
    )
}
