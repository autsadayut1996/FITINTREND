import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool, ready } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// Simple food calorie database for common Thai/international foods
const foodCalorieDB: Record<string, number> = {
  'rice': 206, 'fried rice': 238, 'khao pad': 238, 'ข้าวผัด': 238,
  'noodle': 220, 'pad thai': 355, 'ผัดไทย': 355,
  'chicken': 165, 'grilled chicken': 165, 'ไก่ย่าง': 165,
  'pork': 242, 'grilled pork': 200, 'หมูย่าง': 200,
  'fish': 136, 'tilapia': 128, 'ปลา': 136,
  'egg': 78, 'fried egg': 90, 'ไข่ดาว': 90,
  'salad': 20, 'green salad': 15, 'สลัด': 20,
  'soup': 60, 'tom yum': 80, 'ต้มยำ': 80,
  'banana': 89, 'กล้วย': 89, 'apple': 52, 'แอปเปิ้ล': 52,
  'orange': 47, 'ส้ม': 47, 'mango': 60, 'มะม่วง': 60,
  'bread': 265, 'toast': 75,
  'milk': 42, 'นม': 42, 'coffee': 2, 'กาแฟ': 2,
  'smoothie': 150, 'juice': 112,
  'pizza': 266, 'hamburger': 295, 'burger': 295,
  'steak': 271, 'sushi': 144,
  'green curry': 180, 'แกงเขียวหวาน': 180,
  'massaman': 220, 'แกงมัสมั่น': 220,
  'som tam': 45, 'ส้มตำ': 45,
  'larb': 150, 'ลาบ': 150,
};

function estimateCalories(filename: string, foodName?: string): { calories: number; detected_food: string } {
  const search = (foodName || filename).toLowerCase();

  for (const [key, cal] of Object.entries(foodCalorieDB)) {
    if (search.includes(key)) {
      return { calories: cal, detected_food: key };
    }
  }

  // Default estimate
  return { calories: 300, detected_food: foodName || 'อาหาร' };
}

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  await ready();
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const foodName = formData.get('food_name') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG, WEBP, GIF)' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 8MB' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const id = uuidv4();
  await pool.query('INSERT INTO uploads (id, content_type, data) VALUES ($1, $2, $3)', [id, file.type, buffer]);

  const { calories, detected_food } = estimateCalories(file.name, foodName || undefined);

  return NextResponse.json({
    image_path: `/api/uploads/${id}`,
    calories,
    detected_food,
  });
}
