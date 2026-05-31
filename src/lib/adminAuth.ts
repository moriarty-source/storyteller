import { NextRequest } from "next/server";
import { getAdminPassword } from "@/lib/config";

export async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get("authorization");
  const expected = await getAdminPassword();
  return auth === expected;
}