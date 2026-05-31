import { NextResponse, NextRequest } from "next/server";
import { getStory } from "@/lib/stories";
import { compileToInk } from "@/lib/inkCompiler";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const story = getStory(code.toUpperCase());

  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const ink = compileToInk(story);
  return NextResponse.json({ ink });
}