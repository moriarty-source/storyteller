import { NextResponse } from "next/server";
import { createStory, storyExists } from "@/lib/stories";
import { generateCode } from "@/lib/codeGenerator";

export async function POST() {
  try {
    let code = generateCode();
    let attempts = 0;
    while ((await storyExists(code)) && attempts < 10) {
      code = generateCode();
      attempts++;
    }
    const story = await createStory(code);
    return NextResponse.json({ code, story }, { status: 201 });
  } catch (err) {
    console.error("POST /api/stories error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
