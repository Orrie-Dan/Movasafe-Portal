// Single source of truth for Transactions service base URL
// If the app is served over HTTPS and the browser blocks HTTP calls, the backend must either:
// 1. Expose HTTPS endpoints, or
// 2. Be proxied through a Next.js API route to avoid mixed-content errors

// IMPORTANT:
// Transactions are proxied through Next.js API routes to avoid mixed-content issues (HTTPS portal -> HTTP backend).
// This base is still used for diagnostics/logging and any direct server-side calls.
const getTransactionBase = (): string => {
  const envBase = process.env.NEXT_PUBLIC_TRANSACTION_API_BASE
  
  // Default to HTTP, but allow HTTPS if specified in environment
  // (If you serve the portal over HTTPS and do direct browser calls to HTTP, it will be blocked. Use the proxy.)
  const defaultBase = "http://movasafe-transaction-env-2.eba-ydyugcws.eu-north-1.elasticbeanstalk.com"
  
  return envBase ?? defaultBase
}

export const TRANSACTION_BASE = getTransactionBase()

// Helper to check if server is reachable (for debugging)
export async function checkTransactionServerHealth(): Promise<{ reachable: boolean; error?: string }> {
  try {
    // Try a simple HEAD request to check connectivity
    const response = await fetch(`${TRANSACTION_BASE}/api/transactions/all?page=0&limit=1`, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/json',
      },
    })
    return { reachable: response.ok || response.status < 500 }
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
