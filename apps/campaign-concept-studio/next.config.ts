import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Image generation responses are returned as base64 data URLs from our own
    // route handlers, so no remote image hosts need to be allowlisted here.
}

export default nextConfig
