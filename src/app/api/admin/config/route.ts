import { NextRequest, NextResponse } from "next/server";
import { getWordLimits, setWordLimits, getAdminPassword } from "@/lib/config";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const pw = req.headers.get("x-admin-password");
  const expected = await getAdminPassword();
  return pw === expected;
}

export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limits = await getWordLimits();
  return NextResponse.json(limits);
}

export async function PATCH(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  await setWordLimits(body);
  const limits = await getWordLimits();
  return NextResponse.json(limits);
}