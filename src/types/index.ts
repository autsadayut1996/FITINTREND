export type Role = 'trainer' | 'client';
export type Session = 'morning' | 'noon' | 'evening';
export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Program {
  id: string;
  trainer_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  total_days: number;
  is_active: number;
  created_at: string;
}

export interface ProgramDay {
  id: string;
  program_id: string;
  day_number: number;
  title: string | null;
  notes: string | null;
  exercises?: Exercise[];
  meal_plans?: MealPlan[];
}

export interface Exercise {
  id: string;
  day_id: string;
  session: Session;
  name: string;
  sets: number | null;
  reps: string | null;
  duration_minutes: number | null;
  rest_seconds: number | null;
  order_index: number;
  notes: string | null;
}

export interface MealPlan {
  id: string;
  program_id: string;
  day_number: number;
  meal_time: MealTime;
  description: string;
  target_calories: number | null;
  notes: string | null;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  program_id: string;
  day_number: number;
  workout_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface FoodLog {
  id: string;
  client_id: string;
  log_date: string;
  meal_time: MealTime;
  food_name: string | null;
  calories: number | null;
  image_path: string | null;
  notes: string | null;
  created_at: string;
}
