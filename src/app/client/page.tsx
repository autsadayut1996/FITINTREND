'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Program {
  id: string;
  name: string;
  description: string;
  total_days: number;
  trainer_name: string;
  created_at: string;
}

interface FoodLog {
  id: string;
  meal_time: string;
  food_name: string;
  calories: number;
  image_path: string;
  created_at: string;
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅', lunch: '🍱', dinner: '🌙', snack: '🍎'
};
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'เช้า', lunch: 'กลางวัน', dinner: 'เย็น', snack: 'ของว่าง'
};

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [todayFoodLogs, setTodayFoodLogs] = useState<FoodLog[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [today] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'client')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'client') {
      fetchPrograms();
      fetchTodayFood();
    }
  }, [user]);

  const fetchPrograms = async () => {
    const res = await fetch('/api/client/programs');
    const data = await res.json();
    setPrograms(data.programs || []);
  };

  const fetchTodayFood = async () => {
    const res = await fetch(`/api/client/food-logs?date=${today}`);
    const data = await res.json();
    setTodayFoodLogs(data.logs || []);
    setTodayCalories(data.totalCalories || 0);
  };

  if (loading || !user) return <div className="flex items-center justify-center min-h-[60vh] text-green-400 animate-pulse">กำลังโหลด...</div>;

  const todayFormatted = new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">สวัสดี, {user.name} 👋</h1>
        <p className="text-gray-500 text-sm">{todayFormatted}</p>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card text-center col-span-2">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-3xl font-bold text-orange-400">{todayCalories}</div>
          <div className="text-xs text-gray-500">แคลอรี่วันนี้</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">📋</div>
          <div className="text-3xl font-bold text-blue-400">{programs.length}</div>
          <div className="text-xs text-gray-500">โปรแกรม</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">🍽️</div>
          <div className="text-3xl font-bold text-green-400">{todayFoodLogs.length}</div>
          <div className="text-xs text-gray-500">มื้ออาหารวันนี้</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Programs */}
        <div>
          <h2 className="font-semibold text-lg mb-3">📋 โปรแกรมของฉัน</h2>
          {programs.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 text-sm">ยังไม่มีโปรแกรม รอเทรนเนอร์มอบหมาย</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map(prog => (
                <div key={prog.id} className="card">
                  <h3 className="font-semibold">{prog.name}</h3>
                  <div className="text-sm text-gray-500 mt-1 flex gap-3">
                    <span>📅 {prog.total_days} วัน</span>
                    <span>👤 {prog.trainer_name}</span>
                  </div>
                  <Link href={`/client/programs/${prog.id}`} className="btn-primary text-sm py-1.5 px-3 mt-3 inline-block">เริ่มออกกำลังกาย →</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's food */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">🍽️ อาหารวันนี้</h2>
            <Link href="/client/food" className="text-green-400 text-sm hover:underline">จัดการ →</Link>
          </div>
          {todayFoodLogs.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 text-sm mb-3">ยังไม่มีบันทึกอาหารวันนี้</p>
              <Link href="/client/food" className="btn-primary text-sm py-1.5 px-4">บันทึกอาหาร</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {todayFoodLogs.slice(0, 4).map(log => (
                <div key={log.id} className="card flex items-center gap-3 py-2 px-3">
                  {log.image_path ? (
                    <img src={log.image_path} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="text-2xl">{MEAL_ICONS[log.meal_time] || '🍽️'}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.food_name || 'อาหาร'}</p>
                    <p className="text-xs text-gray-500">{MEAL_LABELS[log.meal_time]}</p>
                  </div>
                  <span className="text-orange-400 text-sm font-medium shrink-0">{log.calories} cal</span>
                </div>
              ))}
              {todayFoodLogs.length > 4 && (
                <Link href="/client/food" className="text-xs text-gray-500 hover:text-gray-300 block text-center">+{todayFoodLogs.length - 4} รายการ</Link>
              )}
              <div className="card py-2 px-3 flex justify-between items-center bg-orange-900/20 border-orange-800">
                <span className="text-sm text-gray-400">รวมทั้งวัน</span>
                <span className="text-orange-400 font-bold">{todayCalories} cal</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
