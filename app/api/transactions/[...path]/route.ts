import { NextRequest } from "next/server";

const BACKEND_BASE =
  "http://movasafe-transaction-env-2.eba-ydyugcws.eu-north-1.elasticbeanstalk.com";

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

    // Forward response headers
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", res.headers.get("Content-Type") || "application/json");
    
    // Forward CORS headers if present
    const corsHeaders = [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
    ];
    corsHeaders.forEach((header) => {
      const value = res.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    return new Response(responseBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Transactions Proxy] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Proxy error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
