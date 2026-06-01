import { NextRequest, NextResponse } from "next/server";
import { listStories } from "@/lib/stories";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stories = await listStories();
  return NextResponse.json(stories);
}
