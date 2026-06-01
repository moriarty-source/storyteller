import { NextRequest, NextResponse } from "next/server";
import { getWordLimits, setWordLimits } from "@/lib/config";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getWordLimits());
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  await setWordLimits(body);
  return NextResponse.json(await getWordLimits());
}
