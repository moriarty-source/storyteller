import { NextRequest, NextResponse } from "next/server";
import { createStory, storyExists } from "@/lib/stories";
import { generateCode } from "@/lib/codeGenerator";

export async function POST(_request: NextRequest) {
  let code = generateCode();
  let attempts = 0;
  while (storyExists(code) && attempts < 10) {
    code = generateCode();
    attempts++;
  }
  const story = createStory(code);
  return NextResponse.json({ code, story }, { status: 201 });
}
