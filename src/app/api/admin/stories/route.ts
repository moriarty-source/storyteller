import { NextRequest, NextResponse } from "next/server";
import { listStories } from "@/lib/stories";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stories = listStories();
  return NextResponse.json(stories);
}
