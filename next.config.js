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
            },
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
            },
            {
                protocol: 'https',
                hostname: 'huggingface.co',
            },
            {
                protocol: 'https',
                hostname: 'images.crunchbase.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 'www.google.com',
            },
            {
                protocol: 'https',
                hostname: 'www.gstatic.com',
            }
        ],
    },
    async redirects() {
        return [
            {
                source: '/jobs',
                destination: '/',
                permanent: true,
            },
            {
                source: '/jobs/:path*',
                destination: '/',
                permanent: true,
            },
        ]
    },
}

module.exports = nextConfig
