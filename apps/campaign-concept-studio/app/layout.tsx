import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
    title: 'Campaign Concept Studio',
    description:
        'Turn a short marketing brief into a campaign concept, copy variants, a launch checklist, and key visuals.',
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fbfbfd' },
        { media: '(prefers-color-scheme: dark)', color: '#16171d' },
    ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-dvh antialiased">{children}</body>
        </html>
    )
}
