// Server component wrapper for static export
// Exports generateStaticParams required for static export with dynamic routes

import UserDetailClient from './UserDetailClient'

export async function generateStaticParams(): Promise<{ id: string }[]> {
  // Return a placeholder - actual routes will be handled client-side via SPA routing
  // CloudFront will redirect 404s to index.html, which will handle the routing
  // This satisfies Next.js static export requirement for dynamic routes
  return [{ id: '_' }]
}

export default function UserDetailPage() {
  return <UserDetailClient />
}
