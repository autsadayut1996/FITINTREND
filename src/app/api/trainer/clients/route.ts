import { NextRequest, NextResponse } from 'next/server';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all clients
  const { rows: clients } = await pool.query(
    `SELECT id, name, email, created_at FROM users WHERE role = 'client' ORDER BY name`
  );

  return NextResponse.json({ clients });
}
