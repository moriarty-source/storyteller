import { NextRequest, NextResponse } from "next/server";
import { createStory, storyExists } from "@/lib/stories";
import { ensureDb } from "@/lib/db";
import { generateCode } from "@/lib/codeGenerator";

export async function POST(_request: NextRequest) {
  // Ensure database is initialized
  await ensureDb();
  
  // Generate a unique code, retrying on collision
  let code = generateCode();
  let attempts = 0;
  while (await storyExists(code) && attempts < 10) {
    code = generateCode();
    attempts++;
  }

  const story = await createStory(code);
  return NextResponse.json({ code, story }, { status: 201 });
}
