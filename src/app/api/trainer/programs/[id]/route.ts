import { NextRequest, NextResponse } from 'next/server';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { rows: programRows } = await pool.query(
    'SELECT * FROM programs WHERE id = $1 AND trainer_id = $2',
    [id, session.id]
  );
  const program = programRows[0];
  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows: days } = await pool.query(
    'SELECT * FROM program_days WHERE program_id = $1 ORDER BY day_number',
    [id]
  );

  const daysWithData = await Promise.all(
    days.map(async (day) => {
      const { rows: exercises } = await pool.query(
        'SELECT * FROM exercises WHERE day_id = $1 ORDER BY session, order_index',
        [day.id]
      );
      return { ...day, exercises };
    })
  );

  const { rows: mealPlans } = await pool.query(
    'SELECT * FROM meal_plans WHERE program_id = $1 ORDER BY day_number, meal_time',
    [id]
  );

  return NextResponse.json({ program, days: daysWithData, meal_plans: mealPlans });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { name, description, client_id, is_active } = await req.json();

  await pool.query(
    'UPDATE programs SET name = $1, description = $2, client_id = $3, is_active = $4 WHERE id = $5 AND trainer_id = $6',
    [name, description, client_id || null, is_active ?? 1, id, session.id]
  );

  return NextResponse.json({ message: 'Updated' });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await pool.query('DELETE FROM programs WHERE id = $1 AND trainer_id = $2', [id, session.id]);

  return NextResponse.json({ message: 'Deleted' });
}
