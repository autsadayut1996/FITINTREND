'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface FoodLog {
  id: string;
  client_id: string;
  client_name: string;
  log_date: string;
  meal_time: string;
  food_name: string | null;
  calories: number | null;
  image_path: string | null;
  notes: string | null;
  created_at: string;
}

interface WorkoutLog {
  id: string;
  client_id: string;
  client_name: string;
  program_name: string;
  day_number: number;
  workout_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  image_path: string | null;
  created_at: string;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: '🌅 เช้า',
  lunch: '🍱 กลางวัน',
  dinner: '🌙 เย็น',
  snack: '🍎 ของว่าง',
};

export default function TrainerClientsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [activeTab, setActiveTab] = useState<'workout' | 'food'>('workout');
  const [filterDate, setFilterDate] = useState('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'trainer')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'trainer') fetchLogs();
  }, [user, selectedClient, filterDate]);

  const fetchLogs = async () => {
    setFetching(true);
    const params = new URLSearchParams();
    if (selectedClient) params.set('client_id', selectedClient);
    if (filterDate) params.set('date', filterDate);
    const res = await fetch(`/api/trainer/clients/logs?${params}`);
    const data = await res.json();
    setClients(data.clients || []);
    setFoodLogs(data.food_logs || []);
    setWorkoutLogs(data.workout_logs || []);
    setFetching(false);
  };

  if (loading || !user) return <div className="flex items-center justify-center min-h-[60vh] text-green-400 animate-pulse">กำลังโหลด...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/trainer" className="btn-secondary text-sm py-1.5 px-3">← กลับ</Link>
        <div>
          <h1 className="text-xl font-bold">📊 ติดตามบันทึกลูกค้า</h1>
          <p className="text-gray-500 text-sm">ดูบันทึกอาหารและการออกกำลังกายของลูกค้าทุกคน</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="label">ลูกค้า</label>
          <select className="input" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
            <option value="">ทั้งหมด</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="label">วันที่</label>
          <input type="date" className="input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="btn-secondary text-sm py-2">ล้างวันที่</button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">{clients.length}</div>
          <div className="text-xs text-gray-500">ลูกค้าทั้งหมด</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-400">{workoutLogs.length}</div>
          <div className="text-xs text-gray-500">บันทึกออกกำลังกาย</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-400">{foodLogs.length}</div>
          <div className="text-xs text-gray-500">บันทึกอาหาร</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden mb-5 w-fit">
        {(['workout', 'food'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {tab === 'workout' ? '🏋️ ออกกำลังกาย' : '🍽️ อาหาร'}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="text-center py-12 text-gray-500 animate-pulse">กำลังโหลด...</div>
      ) : activeTab === 'workout' ? (
        workoutLogs.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🏋️</div>
            <p>ยังไม่มีบันทึกการออกกำลังกาย</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workoutLogs.map(log => (
              <div key={log.id} className="card flex gap-3">
                {log.image_path && (
                  <img src={log.image_path} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-medium text-sm">{log.client_name}</span>
                      <span className="text-gray-500 text-xs ml-2">— {log.program_name} Day {log.day_number}</span>
                    </div>
                    {log.duration_minutes && (
                      <span className="badge badge-green text-xs">{log.duration_minutes} นาที</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">📅 {log.workout_date}{log.start_time && log.end_time ? ` · ⏰ ${log.start_time}–${log.end_time}` : ''}</p>
                  {log.notes && <p className="text-xs text-gray-400 mt-1">{log.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        foodLogs.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🍽️</div>
            <p>ยังไม่มีบันทึกอาหาร</p>
          </div>
        ) : (
          <div className="space-y-3">
            {foodLogs.map(log => (
              <div key={log.id} className="card flex gap-3">
                {log.image_path ? (
                  <img src={log.image_path} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-[#222] rounded-lg flex items-center justify-center text-2xl shrink-0">🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-medium text-sm">{log.client_name}</span>
                    <div className="flex gap-2">
                      <span className="badge badge-gray text-xs">{MEAL_LABEL[log.meal_time] || log.meal_time}</span>
                      {log.calories && <span className="badge badge-orange text-xs">{log.calories} cal</span>}
                    </div>
                  </div>
                  <p className="text-sm mt-0.5">{log.food_name || <span className="text-gray-500">ไม่ระบุชื่อ</span>}</p>
                  <p className="text-xs text-gray-500 mt-0.5">📅 {log.log_date}</p>
                  {log.notes && <p className="text-xs text-gray-400 mt-0.5">{log.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
