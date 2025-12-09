/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'toolify.ai',
            },
            {
                protocol: 'https',
                hostname: 'assets.toolify.ai',
            },
            {
                protocol: 'https',
                hostname: 'images.toolify.ai',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            }
        ],
    },
}

module.exports = nextConfig
