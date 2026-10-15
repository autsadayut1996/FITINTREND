import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const { rows: logs } = await pool.query<{ calories: number | null }>(
    'SELECT * FROM food_logs WHERE client_id = $1 AND log_date = $2 ORDER BY created_at',
    [session.id, date]
  );

  const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);

  return NextResponse.json({ logs, totalCalories, date });
}

export async function POST(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { log_date, meal_time, food_name, calories, image_path, notes } = await req.json();

  if (!log_date || !meal_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO food_logs (id, client_id, log_date, meal_time, food_name, calories, image_path, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, session.id, log_date, meal_time, food_name ?? null, calories ?? null, image_path ?? null, notes ?? null]
  );

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  await pool.query('DELETE FROM food_logs WHERE id = $1 AND client_id = $2', [id, session.id]);

  return NextResponse.json({ message: 'Deleted' });
}
