import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { setAdminPassword } from '@/lib/config';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function PUT(req: NextRequest) {
  const authorized = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { password } = await req.json();
  if (typeof password !== 'string' || !password.trim()) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
  }

  await setAdminPassword(password);
  return NextResponse.json({ success: true });
}
