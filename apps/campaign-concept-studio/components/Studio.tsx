'use client'

import { useCallback, useRef, useState } from 'react'

import { ApiRequestError, generateCampaign, generateImages } from '@/lib/api-client'
import type { CampaignBrief, CampaignPlan, GeneratedImage } from '@/lib/types'
import { BriefForm } from './BriefForm'
import { CampaignResult } from './CampaignResult'
import { EmptyState, ErrorBanner, PlanSkeleton } from './ui'

interface UiError {
    title: string
    detail?: string
}

function toUiError(error: unknown): UiError {
    if (error instanceof ApiRequestError) {
        return { title: error.message, detail: error.detail }
    }

    return { title: 'Something went wrong.', detail: 'Try again in a moment.' }
}

function isAbort(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * The one stateful client component.
 *
 * Runs the flow in two phases so the written concept appears as soon as it is
 * ready, while the slower image render fills in behind it:
 *
 *   1. POST /api/campaign        -> concept, copy, checklist, image prompts
 *   2. POST /api/campaign/images -> rendered visuals for those prompts
 *
 * Phase 2 failing never discards phase 1 — the copy stays on screen with a
 * retry affordance on the visuals panel alone.
 */
export function Studio() {
    const [plan, setPlan] = useState<CampaignPlan | null>(null)
    const [planLoading, setPlanLoading] = useState(false)
    const [planError, setPlanError] = useState<UiError | null>(null)

    const [images, setImages] = useState<GeneratedImage[]>([])
    const [imagesLoading, setImagesLoading] = useState(false)
    const [imagesError, setImagesError] = useState<UiError | null>(null)
    const [failedCount, setFailedCount] = useState(0)

    // Cancels in-flight work when the user submits again or clears, so a slow
    // earlier run can never overwrite a newer result.
    const abortRef = useRef<AbortController | null>(null)
    const lastBriefRef = useRef<CampaignBrief | null>(null)

    const renderImages = useCallback(async (target: CampaignPlan, signal: AbortSignal) => {
        setImagesLoading(true)
        setImagesError(null)
        setImages([])
        setFailedCount(0)

        try {
            const result = await generateImages(target.image_prompts, signal)

            setImages(result.images)
            setFailedCount(result.failedCount)
        } catch (error) {
            if (isAbort(error)) {
                return
            }

            setImagesError(toUiError(error))
        } finally {
            setImagesLoading(false)
        }
    }, [])

    const run = useCallback(
        async (brief: CampaignBrief) => {
            abortRef.current?.abort()

            const controller = new AbortController()

            abortRef.current = controller
            lastBriefRef.current = brief

            setPlanLoading(true)
            setPlanError(null)
            setPlan(null)
            setImages([])
            setImagesError(null)
            setFailedCount(0)

            let generated: CampaignPlan

            try {
                generated = await generateCampaign(brief, controller.signal)
                setPlan(generated)
            } catch (error) {
                if (!isAbort(error)) {
                    setPlanError(toUiError(error))
                }

                return
            } finally {
                setPlanLoading(false)
            }

            // Phase 2 — independent of phase 1's success being final.
            await renderImages(generated, controller.signal)
        },
        [renderImages]
    )

    const retryImages = useCallback(() => {
        if (!plan) {
            return
        }

        const controller = new AbortController()

        abortRef.current?.abort()
        abortRef.current = controller

        void renderImages(plan, controller.signal)
    }, [plan, renderImages])

    const reset = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        lastBriefRef.current = null
        setPlan(null)
        setPlanError(null)
        setPlanLoading(false)
        setImages([])
        setImagesError(null)
        setImagesLoading(false)
        setFailedCount(0)
    }, [])

    const retryPlan = useCallback(() => {
        if (lastBriefRef.current) {
            void run(lastBriefRef.current)
        }
    }, [run])

    return (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:gap-8">
            <div className="lg:sticky lg:top-8">
                <BriefForm
                    onSubmit={(brief) => void run(brief)}
                    onReset={reset}
                    isLoading={planLoading || imagesLoading}
                    hasResult={plan !== null || planError !== null}
                />
            </div>

            <div className="min-w-0">
                {planError ? (
                    <ErrorBanner title={planError.title} detail={planError.detail} onRetry={retryPlan} />
                ) : planLoading ? (
                    <PlanSkeleton />
                ) : plan ? (
                    <CampaignResult
                        plan={plan}
                        images={images}
                        imagesLoading={imagesLoading}
                        imagesError={imagesError}
                        failedCount={failedCount}
                        onRetryImages={retryImages}
                    />
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    )
}
