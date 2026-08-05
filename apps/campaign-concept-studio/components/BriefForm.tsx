'use client'

import { useState } from 'react'

import { CHANNELS, TONES, type CampaignBrief } from '@/lib/types'
import { Button, Card, Spinner, cx } from './ui'

const EXAMPLE: CampaignBrief = {
    brief: 'Launch our new reusable insulated bottle in time for back-to-school. We need to win shelf consideration against cheaper supermarket own-brands without competing on price.',
    audience: 'Parents aged 30-45 buying for kids in primary school. Budget-conscious but will pay more for something that survives the school year.',
    product: 'A 500ml stainless steel insulated bottle with a leak-proof lid, dishwasher safe, lifetime warranty, in six colours.',
    tone: 'Warm and human',
    channels: ['Instagram', 'Email', 'Landing page'],
}

const EMPTY: CampaignBrief = { brief: '', audience: '', product: '', tone: TONES[1], channels: ['Instagram'] }

const labelClass = 'block text-sm font-medium text-ink'
const hintClass = 'mt-1 text-xs text-ink-faint'
const fieldClass =
    'mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'

export function BriefForm({
    onSubmit,
    onReset,
    isLoading,
    hasResult,
}: {
    onSubmit: (brief: CampaignBrief) => void
    onReset: () => void
    isLoading: boolean
    hasResult: boolean
}) {
    const [form, setForm] = useState<CampaignBrief>(EMPTY)
    const [touched, setTouched] = useState(false)

    // Mirrors the server-side rules in lib/schemas.ts so the user gets feedback
    // before a round trip. The server remains the authority — this is UX only.
    const errors = {
        brief: form.brief.trim().length < 20 ? 'Add at least a sentence of context.' : null,
        audience: form.audience.trim().length < 3 ? 'Describe who this is for.' : null,
        product: form.product.trim().length < 3 ? 'Describe the product.' : null,
        channels: form.channels.length === 0 ? 'Pick at least one channel.' : null,
    }

    const isValid = Object.values(errors).every((error) => error === null)

    function update<K extends keyof CampaignBrief>(key: K, value: CampaignBrief[K]) {
        setForm((previous) => ({ ...previous, [key]: value }))
    }

    function toggleChannel(channel: string) {
        setForm((previous) => ({
            ...previous,
            channels: previous.channels.includes(channel)
                ? previous.channels.filter((item) => item !== channel)
                : [...previous.channels, channel],
        }))
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setTouched(true)

        if (isValid && !isLoading) {
            onSubmit({
                ...form,
                brief: form.brief.trim(),
                audience: form.audience.trim(),
                product: form.product.trim(),
            })
        }
    }

    const showError = (key: keyof typeof errors) => (touched && errors[key] ? errors[key] : null)

    return (
        <Card className="overflow-hidden">
            <form onSubmit={handleSubmit} noValidate>
                <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Step 1</p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">The brief</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setForm(EXAMPLE)
                            setTouched(false)
                        }}
                        disabled={isLoading}
                        className="rounded-md px-2 py-1 text-xs font-medium text-accent-ink underline underline-offset-4 transition-colors hover:no-underline disabled:opacity-50"
                    >
                        Load example
                    </button>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                    <div>
                        <label htmlFor="brief" className={labelClass}>
                            Campaign brief
                        </label>
                        <p className={hintClass}>What are you launching, and what does success look like?</p>
                        <textarea
                            id="brief"
                            rows={4}
                            value={form.brief}
                            onChange={(event) => update('brief', event.target.value)}
                            placeholder="We're launching..."
                            className={cx(fieldClass, 'resize-y', showError('brief') && 'border-danger')}
                            aria-invalid={showError('brief') ? true : undefined}
                            aria-describedby={showError('brief') ? 'brief-error' : undefined}
                        />
                        {showError('brief') ? (
                            <p id="brief-error" className="mt-1.5 text-xs text-danger">
                                {errors.brief}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="audience" className={labelClass}>
                            Target audience
                        </label>
                        <textarea
                            id="audience"
                            rows={2}
                            value={form.audience}
                            onChange={(event) => update('audience', event.target.value)}
                            placeholder="Who are we talking to, and what do they care about?"
                            className={cx(fieldClass, 'resize-y', showError('audience') && 'border-danger')}
                            aria-invalid={showError('audience') ? true : undefined}
                        />
                        {showError('audience') ? <p className="mt-1.5 text-xs text-danger">{errors.audience}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="product" className={labelClass}>
                            Product details
                        </label>
                        <textarea
                            id="product"
                            rows={2}
                            value={form.product}
                            onChange={(event) => update('product', event.target.value)}
                            placeholder="What it is, what it does, what makes it different."
                            className={cx(fieldClass, 'resize-y', showError('product') && 'border-danger')}
                            aria-invalid={showError('product') ? true : undefined}
                        />
                        {showError('product') ? <p className="mt-1.5 text-xs text-danger">{errors.product}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="tone" className={labelClass}>
                            Tone
                        </label>
                        <select
                            id="tone"
                            value={form.tone}
                            onChange={(event) => update('tone', event.target.value)}
                            className={cx(fieldClass, 'cursor-pointer appearance-none')}
                        >
                            {TONES.map((tone) => (
                                <option key={tone} value={tone}>
                                    {tone}
                                </option>
                            ))}
                        </select>
                    </div>

                    <fieldset>
                        <legend className={labelClass}>Channels</legend>
                        <p className={hintClass}>Copy variants get written for these.</p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                            {CHANNELS.map((channel) => {
                                const selected = form.channels.includes(channel)

                                return (
                                    <button
                                        key={channel}
                                        type="button"
                                        onClick={() => toggleChannel(channel)}
                                        aria-pressed={selected}
                                        className={cx(
                                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                            selected
                                                ? 'border-accent bg-accent text-white'
                                                : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
                                        )}
                                    >
                                        {channel}
                                    </button>
                                )
                            })}
                        </div>
                        {showError('channels') ? <p className="mt-2 text-xs text-danger">{errors.channels}</p> : null}
                    </fieldset>
                </div>

                <div className="flex items-center gap-3 border-t border-line bg-surface-muted px-5 py-4 sm:px-6">
                    <Button type="submit" disabled={isLoading || (touched && !isValid)}>
                        {isLoading ? (
                            <>
                                <Spinner />
                                Generating&hellip;
                            </>
                        ) : (
                            'Generate campaign'
                        )}
                    </Button>
                    {hasResult && !isLoading ? (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setForm(EMPTY)
                                setTouched(false)
                                onReset()
                            }}
                        >
                            Clear
                        </Button>
                    ) : null}
                </div>
            </form>
        </Card>
    )
}
