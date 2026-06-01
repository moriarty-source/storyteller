import { NextRequest, NextResponse } from "next/server";
import { updateStory, deleteStory } from "@/lib/stories";
import { checkAdminAuth } from "@/lib/adminAuth";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code } = await params;
  const story = await updateStory(code.toUpperCase(), { status: "completed" });
  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(story);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code } = await params;
  const deleted = await deleteStory(code.toUpperCase());
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
