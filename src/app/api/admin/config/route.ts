import { NextRequest, NextResponse } from "next/server";
import { getWordLimits, setWordLimits, getAdminPassword } from "@/lib/config";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const pw = req.headers.get("x-admin-password");
  return pw === (await getAdminPassword());
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getWordLimits());
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  await setWordLimits(body);
  return NextResponse.json(await getWordLimits());
}
