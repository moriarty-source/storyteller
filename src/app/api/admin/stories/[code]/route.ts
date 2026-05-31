import { NextRequest, NextResponse } from "next/server";
import { updateStory } from "@/lib/stories";
import { getAdminPassword } from "@/lib/config";
import { ensureDb } from "@/lib/db";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const pw = req.headers.get("x-admin-password");
  const expected = await getAdminPassword();
  return pw === expected;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  await ensureDb();
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { code } = await params;
  const story = await updateStory(code.toUpperCase(), { status: "completed" });
  
  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  return NextResponse.json(story);
}