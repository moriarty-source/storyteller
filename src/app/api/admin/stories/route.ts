import { NextRequest, NextResponse } from "next/server";
import { listStories } from "@/lib/stories";
import { getAdminPassword } from "@/lib/config";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const pw = req.headers.get("x-admin-password");
  const expected = await getAdminPassword();
  return pw === expected;
}

export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stories = await listStories();
  return NextResponse.json(stories);
}