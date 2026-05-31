import { NextRequest, NextResponse } from "next/server";
import { getWordLimits, setWordLimits, getAdminPassword } from "@/lib/config";

function isAuthorized(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === getAdminPassword();
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getWordLimits());
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  setWordLimits(body);
  return NextResponse.json(getWordLimits());
}
