import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Note: Database initialization is handled lazily in each API route
// Middleware cannot be async, so we just pass requests through

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};