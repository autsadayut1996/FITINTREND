import { NextRequest, NextResponse } from 'next/server';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const type = searchParams.get('type') || 'all'; // 'food' | 'workout' | 'all'
  const date = searchParams.get('date'); // optional filter

  // Get all clients that have programs assigned by this trainer
  const { rows: clients } = await pool.query<{ id: string; name: string; email: string }>(
    `SELECT DISTINCT u.id, u.name, u.email
     FROM users u
     INNER JOIN programs p ON p.client_id = u.id
     WHERE p.trainer_id = $1
     ORDER BY u.name`,
    [session.id]
  );

  const targetClientIds = clientId
    ? clients.filter((c) => c.id === clientId).map((c) => c.id)
    : clients.map((c) => c.id);

  if (targetClientIds.length === 0) {
    return NextResponse.json({ clients, food_logs: [], workout_logs: [] });
  }

  const idPlaceholders = targetClientIds.map((_, i) => `$${i + 1}`).join(',');

  let foodLogs: unknown[] = [];
  let workoutLogs: unknown[] = [];

  if (type === 'all' || type === 'food') {
    const params = date ? [...targetClientIds, date] : targetClientIds;
    const foodQuery = date
      ? `SELECT fl.*, u.name as client_name FROM food_logs fl JOIN users u ON u.id = fl.client_id WHERE fl.client_id IN (${idPlaceholders}) AND fl.log_date = $${targetClientIds.length + 1} ORDER BY fl.created_at DESC`
      : `SELECT fl.*, u.name as client_name FROM food_logs fl JOIN users u ON u.id = fl.client_id WHERE fl.client_id IN (${idPlaceholders}) ORDER BY fl.created_at DESC LIMIT 100`;
    const result = await pool.query(foodQuery, params);
    foodLogs = result.rows;
  }

  if (type === 'all' || type === 'workout') {
    const params = date ? [...targetClientIds, date] : targetClientIds;
    const workoutQuery = date
      ? `SELECT wl.*, u.name as client_name, p.name as program_name FROM workout_logs wl JOIN users u ON u.id = wl.client_id JOIN programs p ON p.id = wl.program_id WHERE wl.client_id IN (${idPlaceholders}) AND wl.workout_date = $${targetClientIds.length + 1} ORDER BY wl.created_at DESC`
      : `SELECT wl.*, u.name as client_name, p.name as program_name FROM workout_logs wl JOIN users u ON u.id = wl.client_id JOIN programs p ON p.id = wl.program_id WHERE wl.client_id IN (${idPlaceholders}) ORDER BY wl.created_at DESC LIMIT 100`;
    const result = await pool.query(workoutQuery, params);
    workoutLogs = result.rows;
  }

  return NextResponse.json({ clients, food_logs: foodLogs, workout_logs: workoutLogs });
}
