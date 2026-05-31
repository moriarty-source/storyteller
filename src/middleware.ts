import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { initDatabase } from "@/lib/db";

let dbInitialized = false;

export async function middleware(request: NextRequest) {
  // Initialize database on first request
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error("Database initialization failed:", error);
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};