import { Pool } from 'pg';

declare global {
  var __pgPool: Pool | undefined;
  var __pgReady: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

export const pool = global.__pgPool ?? (global.__pgPool = createPool());

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      trainer_id TEXT NOT NULL REFERENCES users(id),
      client_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      total_days INTEGER NOT NULL DEFAULT 30,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS program_days (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      title TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
      session TEXT NOT NULL DEFAULT 'morning',
      name TEXT NOT NULL,
      sets INTEGER,
      reps TEXT,
      duration_minutes INTEGER,
      rest_seconds INTEGER,
      order_index INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      meal_time TEXT NOT NULL,
      description TEXT NOT NULL,
      target_calories INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES users(id),
      program_id TEXT NOT NULL REFERENCES programs(id),
      day_number INTEGER NOT NULL,
      workout_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER,
      status TEXT NOT NULL DEFAULT 'completed',
      notes TEXT,
      image_path TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES users(id),
      log_date TEXT NOT NULL,
      meal_time TEXT NOT NULL,
      food_name TEXT,
      calories INTEGER,
      image_path TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS trainer_clients (
      trainer_id TEXT NOT NULL REFERENCES users(id),
      client_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY (trainer_id, client_id)
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export function ready(): Promise<void> {
  if (!global.__pgReady) global.__pgReady = migrate();
  return global.__pgReady;
}
