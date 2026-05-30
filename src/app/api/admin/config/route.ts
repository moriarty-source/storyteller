import { NextRequest, NextResponse } from "next/server";
import { getWordLimits, setWordLimits } from "@/lib/config";
import { checkAdminAuth } from "@/lib/adminAuth";
import type { WordLimits } from "@/types/story";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wordLimits = getWordLimits();
  return NextResponse.json({ wordLimits });
}

export async function PUT(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { wordLimits: WordLimits };
  setWordLimits(body.wordLimits);
  return NextResponse.json({ wordLimits: body.wordLimits });
}
