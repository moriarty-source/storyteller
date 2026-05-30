import { NextRequest, NextResponse } from "next/server";
import { getStory } from "@/lib/stories";
import { compileToInk } from "@/lib/inkCompiler";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const story = getStory(code);
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  const ink = compileToInk(story);
  return NextResponse.json({ ink });
}
