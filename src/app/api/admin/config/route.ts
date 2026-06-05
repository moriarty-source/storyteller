import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getWordLimits, setWordLimits } from "@/lib/config";
import { checkAdminAuth } from "@/lib/adminAuth";
import type { WordLimits } from "@/types/story";

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limits = await getWordLimits();
  return NextResponse.json({ wordLimits: limits });
}

async function handleSaveLimits(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const wordLimits = (body && typeof body === "object" && "wordLimits" in body ? body.wordLimits : body) as Partial<WordLimits>;

  const keys: (keyof WordLimits)[] = [
    "station1",
    "station2",
    "station3",
    "station4",
    "station5",
    "station6",
    "consequence",
  ];
  for (const k of keys) {
    const val = wordLimits[k];
    if (typeof val !== "number" || !Number.isInteger(val) || val <= 0) {
      return NextResponse.json({ error: `Invalid word limit for ${k}` }, { status: 400 });
    }
  }

  await setWordLimits(wordLimits as WordLimits);
  const limits = await getWordLimits();
  return NextResponse.json({ wordLimits: limits });
}

export async function PUT(req: NextRequest) {
  return handleSaveLimits(req);
}

export async function PATCH(req: NextRequest) {
  return handleSaveLimits(req);
}
