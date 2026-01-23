import { NextRequest } from "next/server";

// Use environment variable or fallback to correct backend URL
const BACKEND_BASE =
  process.env.NEXT_PUBLIC_TRANSACTION_API_URL ||
  process.env.NEXT_PUBLIC_TRANSACTION_API_BASE ||
  "https://transaction.movasafe.com";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_BASE}/api/transactions/all${url.search}`;

    // Forward the Authorization header from the client request
    const auth = req.headers.get("authorization") || "";

    // Forward other relevant headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (auth) {
      headers.Authorization = auth;
    }

    const res = await fetch(backendUrl, {
      method: "GET",
      headers,
    });

    // Get response body
    const body = await res.text();

    // Build response headers with CORS support
    const origin = req.headers.get("origin");
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", res.headers.get("Content-Type") || "application/json");
    
    // Add CORS headers to allow frontend access
    if (origin) {
      responseHeaders.set("Access-Control-Allow-Origin", origin);
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
    } else {
      responseHeaders.set("Access-Control-Allow-Origin", "*");
    }
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Transactions Proxy] Error:", error);
    
    // Build error response with CORS headers
    const origin = req.headers.get("origin");
    const errorHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    };
    if (origin) {
      errorHeaders["Access-Control-Allow-Credentials"] = "true";
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Proxy error",
      }),
      {
        status: 500,
        headers: errorHeaders,
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "3600",
    },
  });
}
