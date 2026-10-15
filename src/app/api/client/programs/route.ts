import { NextRequest, NextResponse } from 'next/server';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows: programs } = await pool.query(
    `SELECT p.*, u.name as trainer_name
     FROM programs p
     LEFT JOIN users u ON p.trainer_id = u.id
     WHERE p.client_id = $1 AND p.is_active = 1
     ORDER BY p.created_at DESC`,
    [session.id]
  );

  return NextResponse.json({ programs });
}
