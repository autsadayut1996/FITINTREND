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
  const { day_number, meal_time, description, target_calories, notes } = await req.json();

  const id = uuidv4();
  await pool.query(
    `INSERT INTO meal_plans (id, program_id, day_number, meal_time, description, target_calories, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, program_id, day_number, meal_time, description, target_calories ?? null, notes ?? null]
  );

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meal_plan_id } = await req.json();
  await pool.query('DELETE FROM meal_plans WHERE id = $1', [meal_plan_id]);

  return NextResponse.json({ message: 'Deleted' });
}
