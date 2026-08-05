import { Studio } from '@/components/Studio'

/**
 * Server component. It renders the shell and mounts <Studio />, the single
 * client component that owns interaction state.
 *
 * Nothing on this page reads an API key or imports the OpenAI SDK — all model
 * calls happen inside the route handlers under app/api/**.
 */
export default function Page() {
    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <header className="mb-8 lg:mb-10">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-white">
                        <svg
                            viewBox="0 0 24 24"
                            className="size-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 3.5 13.9 8.6 19 10.5 13.9 12.4 12 17.5 10.1 12.4 5 10.5 10.1 8.6z" />
                        </svg>
                    </span>
                    <span className="text-[13px] font-semibold tracking-tight text-ink">Campaign Concept Studio</span>
                </div>

                <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
                    From a rough brief to a campaign you can brief in
                </h1>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-pretty text-ink-muted">
                    Describe what you&rsquo;re launching. Get a concept, three copy variants written for your channels,
                    a sequenced launch checklist, and key visuals for the creative direction.
                </p>
            </header>

            <Studio />

            <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-faint">
                <p>
                    Generated with the OpenAI Responses API and gpt-image-2. Review everything before it ships &mdash;
                    treat model output as a first draft, not final copy.
                </p>
            </footer>
        </main>
    )
}
