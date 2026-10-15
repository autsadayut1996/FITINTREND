import { NextRequest, NextResponse } from 'next/server';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { rows: programRows } = await pool.query(
    'SELECT * FROM programs WHERE id = $1 AND client_id = $2',
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

  const { rows: workoutLogs } = await pool.query(
    'SELECT * FROM workout_logs WHERE program_id = $1 AND client_id = $2 ORDER BY day_number',
    [id, session.id]
  );

  return NextResponse.json({ program, days: daysWithData, meal_plans: mealPlans, workout_logs: workoutLogs });
}
