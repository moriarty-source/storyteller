import { NextRequest } from "next/server";
import { getAdminPassword } from "@/lib/config";

/**
 * Checks the x-admin-password header against the stored admin password.
 * Used by all admin API routes.
 */
export async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  const pw = request.headers.get("x-admin-password");
  const expected = await getAdminPassword();
  return pw === expected;
}