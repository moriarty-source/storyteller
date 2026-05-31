import { NextResponse } from "next/server";
import { getStory } from "@/lib/stories";
import { compileToInk } from "@/lib/inkCompiler";
import { Compiler } from "inkjs/compiler/Compiler";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { code } = await params;
  const story = getStory(code.toUpperCase());

  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (story.status !== "completed") {
    return NextResponse.json({ error: "Story not completed" }, { status: 403 });
  }

  try {
    const inkSource = compileToInk(story, { forReader: true });
    const compiler = new Compiler(inkSource);
    const compiled = compiler.Compile();
    const json = compiled.ToJson();
    return NextResponse.json({ json });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Ink compilation failed: ${message}` },
      { status: 500 }
    );
  }
}
