import { NextRequest, NextResponse } from "next/server";
import { listStories } from "@/lib/stories";
import { getAdminPassword } from "@/lib/config";

function isAuthorized(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === getAdminPassword();
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stories = listStories();
  return NextResponse.json(stories);
}
