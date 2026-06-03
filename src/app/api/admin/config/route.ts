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
  return NextResponse.json(limits);
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Partial<WordLimits>;

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
    const val = body[k];
    if (typeof val !== "number" || !Number.isInteger(val) || val <= 0) {
      return NextResponse.json({ error: `Invalid word limit for ${k}` }, { status: 400 });
    }
  }

  await setWordLimits(body as WordLimits);
  const limits = await getWordLimits();
  return NextResponse.json({ wordLimits: limits });
}
