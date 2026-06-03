import { NextRequest, NextResponse } from "next/server";
import { listStories } from "@/lib/stories";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  try {
    if (!(await checkAdminAuth(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const stories = await listStories();
    return NextResponse.json(stories);
  } catch (err) {
    console.error("GET /api/admin/stories error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
