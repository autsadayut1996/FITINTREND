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
  const program_id = searchParams.get('program_id');

  const { rows: logs } = program_id
    ? await pool.query(
        'SELECT * FROM workout_logs WHERE client_id = $1 AND program_id = $2 ORDER BY workout_date DESC',
        [session.id, program_id]
      )
    : await pool.query('SELECT * FROM workout_logs WHERE client_id = $1 ORDER BY workout_date DESC', [session.id]);

  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { program_id, day_number, workout_date, start_time, end_time, notes, image_path } = await req.json();

  if (!program_id || !day_number || !workout_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Calculate duration
  let duration_minutes = null;
  if (start_time && end_time) {
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    duration_minutes = (eh * 60 + em) - (sh * 60 + sm);
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO workout_logs (id, client_id, program_id, day_number, workout_date, start_time, end_time, duration_minutes, notes, image_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, session.id, program_id, day_number, workout_date, start_time ?? null, end_time ?? null, duration_minutes, notes ?? null, image_path ?? null]
  );

  return NextResponse.json({ id });
}
