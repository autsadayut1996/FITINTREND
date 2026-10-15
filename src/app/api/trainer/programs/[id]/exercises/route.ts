import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: program_id } = await params;
  const { day_number, session: exerciseSession, name, sets, reps, duration_minutes, rest_seconds, notes } = await req.json();

  const { rows: dayRows } = await pool.query<{ id: string }>(
    'SELECT id FROM program_days WHERE program_id = $1 AND day_number = $2',
    [program_id, day_number]
  );
  const day = dayRows[0];
  if (!day) return NextResponse.json({ error: 'Day not found' }, { status: 404 });

  const { rows: maxRows } = await pool.query<{ m: number | null }>(
    'SELECT MAX(order_index) as m FROM exercises WHERE day_id = $1 AND session = $2',
    [day.id, exerciseSession]
  );
  const order_index = (maxRows[0]?.m ?? -1) + 1;

  const id = uuidv4();
  await pool.query(
    `INSERT INTO exercises (id, day_id, session, name, sets, reps, duration_minutes, rest_seconds, order_index, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, day.id, exerciseSession, name, sets ?? null, reps ?? null, duration_minutes ?? null, rest_seconds ?? null, order_index, notes ?? null]
  );

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { exercise_id } = await req.json();
  await pool.query('DELETE FROM exercises WHERE id = $1', [exercise_id]);

  return NextResponse.json({ message: 'Deleted' });
}
