import { NextRequest, NextResponse } from "next/server";
import { getStory, updateStory } from "@/lib/stories";
import type { Story } from "@/types/story";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const story = getStory(code.toUpperCase());
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  return NextResponse.json(story);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const body = (await request.json()) as Partial<
    Pick<Story, "character" | "world" | "inventory" | "stations" | "status">
  >;
  const updated = updateStory(code.toUpperCase(), body);
  if (!updated) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
