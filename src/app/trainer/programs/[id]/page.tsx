'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Exercise {
  id: string;
  session: string;
  name: string;
  sets: number | null;
  reps: string | null;
  duration_minutes: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

interface ProgramDay {
  id: string;
  day_number: number;
  title: string | null;
  exercises: Exercise[];
}

interface MealPlan {
  id: string;
  day_number: number;
  meal_time: string;
  description: string;
  target_calories: number | null;
}

interface Program {
  id: string;
  name: string;
  description: string;
  total_days: number;
  client_id: string | null;
}

interface Client { id: string; name: string; email: string; }

const SESSION_LABELS: Record<string, { label: string; icon: string; css: string }> = {
  morning: { label: 'เช้า', icon: '🌅', css: 'session-morning' },
  noon: { label: 'กลางวัน', icon: '☀️', css: 'session-noon' },
  evening: { label: 'เย็น', icon: '🌆', css: 'session-evening' },
};

const MEAL_LABELS: Record<string, { label: string; icon: string; css: string }> = {
  breakfast: { label: 'เช้า', icon: '🌅', css: 'meal-breakfast' },
  lunch: { label: 'กลางวัน', icon: '🍱', css: 'meal-lunch' },
  dinner: { label: 'เย็น', icon: '🌙', css: 'meal-dinner' },
  snack: { label: 'ของว่าง', icon: '🍎', css: 'meal-snack' },
};

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeTab, setActiveTab] = useState<'exercise' | 'diet'>('exercise');

  // Exercise form
  const [exForm, setExForm] = useState({ session: 'morning', name: '', sets: '', reps: '', duration_minutes: '', rest_seconds: '', notes: '' });
  const [addingEx, setAddingEx] = useState(false);

  // Meal plan form
  const [mealForm, setMealForm] = useState({ meal_time: 'breakfast', description: '', target_calories: '', notes: '' });
  const [addingMeal, setAddingMeal] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'trainer')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchProgram();
      fetchClients();
    }
  }, [user, id]);

  const fetchProgram = async () => {
    const res = await fetch(`/api/trainer/programs/${id}`);
    if (!res.ok) { router.push('/trainer'); return; }
    const data = await res.json();
    setProgram(data.program);
    setDays(data.days);
    setMealPlans(data.meal_plans);
  };

  const fetchClients = async () => {
    const res = await fetch('/api/trainer/clients');
    const data = await res.json();
    setClients(data.clients || []);
  };

  const addExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/trainer/programs/${id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_number: selectedDay,
        session: exForm.session,
        name: exForm.name,
        sets: exForm.sets ? parseInt(exForm.sets) : null,
        reps: exForm.reps || null,
        duration_minutes: exForm.duration_minutes ? parseInt(exForm.duration_minutes) : null,
        rest_seconds: exForm.rest_seconds ? parseInt(exForm.rest_seconds) : null,
        notes: exForm.notes || null,
      }),
    });
    setExForm({ session: 'morning', name: '', sets: '', reps: '', duration_minutes: '', rest_seconds: '', notes: '' });
    setAddingEx(false);
    fetchProgram();
  };

  const deleteExercise = async (exercise_id: string) => {
    if (!confirm('ลบท่าออกกำลังกายนี้?')) return;
    await fetch(`/api/trainer/programs/${id}/exercises`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id }),
    });
    fetchProgram();
  };

  const addMealPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/trainer/programs/${id}/meal-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_number: selectedDay,
        meal_time: mealForm.meal_time,
        description: mealForm.description,
        target_calories: mealForm.target_calories ? parseInt(mealForm.target_calories) : null,
        notes: mealForm.notes || null,
      }),
    });
    setMealForm({ meal_time: 'breakfast', description: '', target_calories: '', notes: '' });
    setAddingMeal(false);
    fetchProgram();
  };

  const deleteMealPlan = async (meal_plan_id: string) => {
    if (!confirm('ลบแผนอาหารนี้?')) return;
    await fetch(`/api/trainer/programs/${id}/meal-plans`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_plan_id }),
    });
    fetchProgram();
  };

  const updateClient = async (client_id: string) => {
    if (!program) return;
    await fetch(`/api/trainer/programs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: program.name, description: program.description, client_id: client_id || null, is_active: 1 }),
    });
    fetchProgram();
  };

  if (!program) return <div className="flex items-center justify-center min-h-[60vh] text-green-400 animate-pulse">กำลังโหลด...</div>;

  const currentDay = days.find(d => d.day_number === selectedDay);
  const currentDayExercises = currentDay?.exercises || [];
  const currentDayMeals = mealPlans.filter(m => m.day_number === selectedDay);

  const exercisesBySession: Record<string, Exercise[]> = {};
  currentDayExercises.forEach(ex => {
    if (!exercisesBySession[ex.session]) exercisesBySession[ex.session] = [];
    exercisesBySession[ex.session].push(ex);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/trainer" className="btn-secondary text-sm py-1.5 px-3 mt-1">← กลับ</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{program.name}</h1>
          {program.description && <p className="text-gray-500 text-sm mt-1">{program.description}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm text-gray-400">📅 {program.total_days} วัน</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">👤 มอบหมายให้:</span>
              <select
                className="input text-sm py-1 px-2 w-auto"
                value={program.client_id || ''}
                onChange={e => updateClient(e.target.value)}
              >
                <option value="">-- เลือกลูกค้า --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Day selector */}
        <div className="w-24 shrink-0">
          <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">วัน</div>
          <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-1">
            {days.map(day => (
              <button
                key={day.day_number}
                onClick={() => setSelectedDay(day.day_number)}
                className={`text-sm px-2 py-2 rounded-lg text-left font-medium transition-colors ${
                  selectedDay === day.day_number
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                Day {day.day_number}
              </button>
            ))}
          </div>
        </div>

        {/* Day content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold">Day {selectedDay}</h2>
            <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden">
              {(['exercise', 'diet'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'exercise' ? '🏋️ ออกกำลังกาย' : '🍽️ อาหาร'}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise tab */}
          {activeTab === 'exercise' && (
            <div>
              {['morning', 'noon', 'evening'].map(session => {
                const exList = exercisesBySession[session] || [];
                const sl = SESSION_LABELS[session];
                return (
                  <div key={session} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{sl.icon}</span>
                      <span className="font-medium text-sm">{sl.label}</span>
                      <span className="text-xs text-gray-500">({exList.length} ท่า)</span>
                    </div>
                    {exList.length === 0 ? (
                      <p className="text-gray-600 text-sm ml-6">ยังไม่มีท่าออกกำลังกาย</p>
                    ) : (
                      <div className="space-y-2 ml-6">
                        {exList.map(ex => (
                          <div key={ex.id} className={`card ${sl.css} flex items-start justify-between gap-2 py-2 px-3`}>
                            <div>
                              <span className="font-medium text-sm">{ex.name}</span>
                              <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                                {ex.sets && <span>{ex.sets} เซต</span>}
                                {ex.reps && <span>{ex.reps} ครั้ง</span>}
                                {ex.duration_minutes && <span>{ex.duration_minutes} นาที</span>}
                                {ex.rest_seconds && <span>พัก {ex.rest_seconds}วิ</span>}
                              </div>
                              {ex.notes && <p className="text-xs text-gray-600 mt-0.5">{ex.notes}</p>}
                            </div>
                            <button onClick={() => deleteExercise(ex.id)} className="text-red-500 text-xs shrink-0 hover:text-red-300">ลบ</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add exercise */}
              {addingEx ? (
                <form onSubmit={addExercise} className="card mt-4 space-y-3">
                  <h3 className="font-medium text-sm">เพิ่มท่าออกกำลังกาย</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">ช่วงเวลา</label>
                      <select className="input" value={exForm.session} onChange={e => setExForm({ ...exForm, session: e.target.value })}>
                        <option value="morning">เช้า</option>
                        <option value="noon">กลางวัน</option>
                        <option value="evening">เย็น</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">ชื่อท่า *</label>
                      <input className="input" value={exForm.name} onChange={e => setExForm({ ...exForm, name: e.target.value })} required placeholder="เช่น Push-up" />
                    </div>
                    <div>
                      <label className="label">จำนวนเซต</label>
                      <input type="number" className="input" value={exForm.sets} onChange={e => setExForm({ ...exForm, sets: e.target.value })} placeholder="3" />
                    </div>
                    <div>
                      <label className="label">ครั้ง/เซต</label>
                      <input className="input" value={exForm.reps} onChange={e => setExForm({ ...exForm, reps: e.target.value })} placeholder="10-12" />
                    </div>
                    <div>
                      <label className="label">ระยะเวลา (นาที)</label>
                      <input type="number" className="input" value={exForm.duration_minutes} onChange={e => setExForm({ ...exForm, duration_minutes: e.target.value })} placeholder="30" />
                    </div>
                    <div>
                      <label className="label">พัก (วินาที)</label>
                      <input type="number" className="input" value={exForm.rest_seconds} onChange={e => setExForm({ ...exForm, rest_seconds: e.target.value })} placeholder="60" />
                    </div>
                  </div>
                  <div>
                    <label className="label">หมายเหตุ</label>
                    <input className="input" value={exForm.notes} onChange={e => setExForm({ ...exForm, notes: e.target.value })} placeholder="คำแนะนำเพิ่มเติม..." />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm py-1.5">บันทึก</button>
                    <button type="button" onClick={() => setAddingEx(false)} className="btn-secondary text-sm py-1.5">ยกเลิก</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setAddingEx(true)} className="btn-secondary text-sm mt-3 w-full">+ เพิ่มท่าออกกำลังกาย</button>
              )}
            </div>
          )}

          {/* Diet tab */}
          {activeTab === 'diet' && (
            <div>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(mealTime => {
                const meals = currentDayMeals.filter(m => m.meal_time === mealTime);
                const ml = MEAL_LABELS[mealTime];
                return (
                  <div key={mealTime} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{ml.icon}</span>
                      <span className="font-medium text-sm">{ml.label}</span>
                    </div>
                    {meals.length === 0 ? (
                      <p className="text-gray-600 text-sm ml-6">ยังไม่มีแผนอาหาร</p>
                    ) : (
                      <div className="space-y-2 ml-6">
                        {meals.map(meal => (
                          <div key={meal.id} className={`card ${ml.css} flex items-start justify-between gap-2 py-2 px-3`}>
                            <div>
                              <span className="text-sm">{meal.description}</span>
                              {meal.target_calories && (
                                <span className="text-xs text-green-400 ml-2">{meal.target_calories} cal</span>
                              )}
                            </div>
                            <button onClick={() => deleteMealPlan(meal.id)} className="text-red-500 text-xs shrink-0 hover:text-red-300">ลบ</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {addingMeal ? (
                <form onSubmit={addMealPlan} className="card mt-4 space-y-3">
                  <h3 className="font-medium text-sm">เพิ่มแผนอาหาร</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">มื้ออาหาร</label>
                      <select className="input" value={mealForm.meal_time} onChange={e => setMealForm({ ...mealForm, meal_time: e.target.value })}>
                        <option value="breakfast">เช้า</option>
                        <option value="lunch">กลางวัน</option>
                        <option value="dinner">เย็น</option>
                        <option value="snack">ของว่าง</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">เป้าหมายแคลอรี่</label>
                      <input type="number" className="input" value={mealForm.target_calories} onChange={e => setMealForm({ ...mealForm, target_calories: e.target.value })} placeholder="500" />
                    </div>
                  </div>
                  <div>
                    <label className="label">รายการอาหาร *</label>
                    <textarea className="input" rows={2} value={mealForm.description} onChange={e => setMealForm({ ...mealForm, description: e.target.value })} required placeholder="เช่น ข้าวกล้อง + ไก่ย่าง + ผักสด" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm py-1.5">บันทึก</button>
                    <button type="button" onClick={() => setAddingMeal(false)} className="btn-secondary text-sm py-1.5">ยกเลิก</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setAddingMeal(true)} className="btn-secondary text-sm mt-3 w-full">+ เพิ่มแผนอาหาร</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
