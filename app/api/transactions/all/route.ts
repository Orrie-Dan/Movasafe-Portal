import { NextRequest } from "next/server";

const BACKEND_BASE =
  "http://movasafe-transaction-env-2.eba-ydyugcws.eu-north-1.elasticbeanstalk.com";

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

    // Forward response headers (excluding those that shouldn't be forwarded)
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

    return new Response(body, {
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
