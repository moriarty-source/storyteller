import { NextRequest, NextResponse } from "next/server";
import { updateStory, deleteStory } from "@/lib/stories";
import { checkAdminAuth } from "@/lib/adminAuth";
import type { Story } from "@/types/story";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const body = (await request.json()) as Partial<
    Pick<Story, "character" | "world" | "inventory" | "stations" | "status">
  >;

  const updated = updateStory(code, {
    character: body.character,
    world: body.world,
    inventory: body.inventory,
    stations: body.stations,
    status: body.status,
  });

  if (!updated) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const deleted = deleteStory(code);

  if (!deleted) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
