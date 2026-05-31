import { NextRequest, NextResponse } from "next/server";
import { updateStory, deleteStory } from "@/lib/stories";
import { getAdminPassword } from "@/lib/config";

interface RouteContext {
  params: Promise<{ code: string }>;
}

function isAuthorized(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === getAdminPassword();
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code } = await params;
  const story = updateStory(code.toUpperCase(), { status: "completed" });
  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(story);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code } = await params;
  const deleted = deleteStory(code.toUpperCase());
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
