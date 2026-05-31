import { NextRequest, NextResponse } from "next/server";
import { getStory, updateStory } from "@/lib/stories";
import { ensureDb } from "@/lib/db";
import type { Story } from "@/types/story";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  await ensureDb();
  const { code } = await params;
  const story = await getStory(code);
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  return NextResponse.json(story);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  await ensureDb();
  const { code } = await params;
  const body = (await request.json()) as Partial<
    Pick<Story, "character" | "world" | "inventory" | "stations">
  >;

  const updated = await updateStory(code, {
    character: body.character,
    world: body.world,
    inventory: body.inventory,
    stations: body.stations,
  });

  if (!updated) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}