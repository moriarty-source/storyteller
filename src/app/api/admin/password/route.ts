import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { setAdminPassword } from '@/lib/config';
import { checkAdminAuth } from '@/lib/adminAuth';

function jsonResponse(data: unknown, init: { status?: number } = {}) {
  const { status = 200 } = init;
  return {
    status,
    async json() {
      return data;
    },
  } as any;
}

export async function PUT(req: NextRequest) {
  // Authenticate using current admin password (header "x-admin-password")
  const authorized = await checkAdminAuth(req);
  if (!authorized) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const { password } = await req.json();
  if (typeof password !== 'string' || !password.trim()) {
    return jsonResponse({ error: 'Invalid password' }, { status: 400 });
  }

  await setAdminPassword(password);
  return jsonResponse({ success: true });
}
