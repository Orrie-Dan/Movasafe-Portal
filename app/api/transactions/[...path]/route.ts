import { NextRequest } from "next/server";

// Use environment variable or fallback to correct backend URL
const BACKEND_BASE =
  process.env.NEXT_PUBLIC_TRANSACTION_API_URL ||
  process.env.NEXT_PUBLIC_TRANSACTION_API_BASE ||
  "https://transaction.movasafe.com";

/**
 * Proxy route for all transaction API endpoints
 * Handles: /api/transactions/* (except /all which has its own route)
 * 
 * Examples:
 * - /api/transactions/by-user/{userId} -> /api/transactions/by-user/{userId}
 * - /api/transactions/{id} -> /api/transactions/{id}
 * - /api/transactions/transfer -> /api/transactions/transfer
 * - /api/transactions/escrow/pay-vendor -> /api/transactions/escrow/pay-vendor
 * - /api/transactions/wallets/* -> /api/transactions/wallets/*
 */
export async function GET(req: NextRequest) {
  return handleRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  return handleRequest(req, "POST");
}

export async function PUT(req: NextRequest) {
  return handleRequest(req, "PUT");
}

export async function DELETE(req: NextRequest) {
  return handleRequest(req, "DELETE");
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

async function handleRequest(req: NextRequest, method: string) {
  try {
    const url = new URL(req.url);
    
    // Extract the path after /api/transactions/
    // e.g., /api/transactions/by-user/123 -> /api/transactions/by-user/123
    const pathMatch = url.pathname.match(/^\/api\/transactions\/(.+)$/);
    const backendPath = pathMatch ? pathMatch[1] : "";
    
    const backendUrl = `${BACKEND_BASE}/api/transactions/${backendPath}${url.search}`;

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

    // Get request body for POST/PUT requests
    let body: string | undefined;
    if (method === "POST" || method === "PUT") {
      try {
        body = await req.text();
      } catch {
        // No body or error reading body
      }
    }

    const res = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    // Get response body
    const responseBody = await res.text();

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

    return new Response(responseBody, {
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
