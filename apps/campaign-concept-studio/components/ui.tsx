'use client'

import { useState } from 'react'

/**
 * Small shared UI primitives. No app logic here — just presentation, so the
 * feature components stay readable.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
    return parts.filter(Boolean).join(' ')
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={cx(
                'rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]',
                className
            )}
        >
            {children}
        </section>
    )
}

export function SectionHeading({
    eyebrow,
    title,
    action,
}: {
    eyebrow: string
    title: string
    action?: React.ReactNode
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{eyebrow}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">{title}</h2>
            </div>
            {action}
        </div>
    )
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' }) {
    return (
        <span
            className={cx(
                'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium',
                tone === 'accent'
                    ? 'bg-accent-soft text-accent-ink'
                    : 'border border-line bg-surface-muted text-ink-muted'
            )}
        >
            {children}
        </span>
    )
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

export function Button({
    children,
    variant = 'primary',
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
    const variants = {
        primary: 'bg-accent text-white hover:bg-accent-hover disabled:hover:bg-accent',
        secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
        ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
    } as const

    return (
        <button
            className={cx(
                'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-55',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}

/** Copy-to-clipboard button with inline confirmation. */
export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            // Clipboard access can be denied (insecure origin, permissions).
            // Nothing useful to recover — leave the label unchanged.
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
        >
            {copied ? (
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="m3.5 8.5 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="5.5" y="5.5" width="8" height="8" rx="1.75" />
                    <path d="M10.5 3.5A1.5 1.5 0 0 0 9 2H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 10" />
                </svg>
            )}
            <span>{copied ? 'Copied' : label}</span>
        </button>
    )
}

export function Spinner({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 16 16" className={cx('size-4 animate-spin', className)} aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path
                d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}

/* -------------------------------------------------------------------------- */
/* States: error, empty, loading                                               */
/* -------------------------------------------------------------------------- */

export function ErrorBanner({
    title,
    detail,
    onRetry,
}: {
    title: string
    detail?: string
    onRetry?: () => void
}) {
    return (
        <div
            role="alert"
            className="animate-rise rounded-xl border border-danger/30 bg-danger-soft px-4 py-3.5 text-sm"
        >
            <div className="flex gap-3">
                <svg
                    viewBox="0 0 20 20"
                    className="mt-0.5 size-4 shrink-0 text-danger"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                >
                    <circle cx="10" cy="10" r="7.5" />
                    <path d="M10 6.25v4.5" strokeLinecap="round" />
                    <circle cx="10" cy="13.6" r="0.85" fill="currentColor" stroke="none" />
                </svg>
                <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{title}</p>
                    {detail ? <p className="mt-1 text-ink-muted">{detail}</p> : null}
                    {onRetry ? (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-2.5 text-xs font-semibold text-accent-ink underline underline-offset-4 hover:no-underline"
                        >
                            Try again
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export function EmptyState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
                <svg
                    viewBox="0 0 24 24"
                    className="size-6 text-ink-faint"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 3.5 13.9 8.6 19 10.5 13.9 12.4 12 17.5 10.1 12.4 5 10.5 10.1 8.6z" />
                    <path d="M18.5 16.5v3M17 18h3" />
                </svg>
            </div>
            <h2 className="mt-5 text-base font-semibold text-ink">No campaign yet</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                Fill in the brief and generate a concept. You&rsquo;ll get a positioning idea, three copy variants, a
                launch checklist, and key visuals.
            </p>
        </div>
    )
}

function SkeletonLine({ className }: { className?: string }) {
    return <div className={cx('skeleton h-3.5 rounded-full', className)} />
}

/** Shown while the written concept is generating. */
export function PlanSkeleton() {
    return (
        <div className="space-y-5" aria-hidden="true">
            <Card>
                <div className="space-y-4 p-5 sm:p-6">
                    <SkeletonLine className="h-6 w-2/5 rounded-lg" />
                    <SkeletonLine className="w-full" />
                    <SkeletonLine className="w-[85%]" />
                    <div className="grid gap-3 pt-2 sm:grid-cols-3">
                        <SkeletonLine className="h-14 rounded-xl" />
                        <SkeletonLine className="h-14 rounded-xl" />
                        <SkeletonLine className="h-14 rounded-xl" />
                    </div>
                </div>
            </Card>
            <Card>
                <div className="space-y-4 p-5 sm:p-6">
                    <SkeletonLine className="h-5 w-1/3 rounded-lg" />
                    <SkeletonLine className="w-full" />
                    <SkeletonLine className="w-[70%]" />
                    <SkeletonLine className="w-[90%]" />
                </div>
            </Card>
        </div>
    )
}

/** Placeholder tiles shown while images render. */
export function ImageSkeletonGrid({ count }: { count: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="skeleton aspect-square rounded-xl" />
            ))}
        </div>
    )
}
