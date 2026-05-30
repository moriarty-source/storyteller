import { NextRequest } from "next/server";
import { getAdminPassword } from "@/lib/config";

export function checkAdminAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  return auth === getAdminPassword();
}
