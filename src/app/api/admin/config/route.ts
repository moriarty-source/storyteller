import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getWordLimits, setWordLimits } from "@/lib/config";
import { checkAdminAuth } from "@/lib/adminAuth";
import type { WordLimits } from "@/types/story";

function jsonResponse(data: unknown, init: { status?: number } = {}) {
  const { status = 200 } = init;
  return {
    status,
    async json() {
      return data;
    },
  } as any;
}

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }
  const limits = await getWordLimits();
  return jsonResponse(limits);
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
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
    const val = (body as any)[k];
    if (typeof val !== "number" || !Number.isInteger(val) || val <= 0) {
      return jsonResponse({ error: `Invalid word limit for ${k}` }, { status: 400 });
    }
  }

  await setWordLimits(body as WordLimits);
  const limits = await getWordLimits();
  return jsonResponse({ wordLimits: limits });
}
