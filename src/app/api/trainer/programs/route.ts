import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows: programs } = await pool.query(
    `SELECT p.*, u.name as client_name
     FROM programs p
     LEFT JOIN users u ON p.client_id = u.id
     WHERE p.trainer_id = $1
     ORDER BY p.created_at DESC`,
    [session.id]
  );

  return NextResponse.json({ programs });
}

export async function POST(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, total_days, client_id } = await req.json();

  if (!name || !total_days) {
    return NextResponse.json({ error: 'Name and total days required' }, { status: 400 });
  }

  const id = uuidv4();
  await pool.query(
    'INSERT INTO programs (id, trainer_id, client_id, name, description, total_days) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, session.id, client_id || null, name, description || null, total_days]
  );

  // Create program days
  const dayValues: string[] = [];
  const dayParams: unknown[] = [];
  for (let i = 1; i <= total_days; i++) {
    const base = dayParams.length;
    dayValues.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    dayParams.push(uuidv4(), id, i);
  }
  await pool.query(
    `INSERT INTO program_days (id, program_id, day_number) VALUES ${dayValues.join(', ')}`,
    dayParams
  );

  return NextResponse.json({ id });
}
