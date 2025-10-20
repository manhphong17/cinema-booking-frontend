/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true, // Giữ nguyên nếu mày muốn bỏ optimize
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'd28ic9z7shvx92.cloudfront.net', // Whitelist domain CloudFront của mày
                port: '',
                pathname: '/**', // Cho phép tất cả path
            },
            // Nếu có domain khác (ví dụ backend), thêm vào đây
        ],
    },
}

export default nextConfig;