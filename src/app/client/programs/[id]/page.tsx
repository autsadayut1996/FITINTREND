'use client';
import { useEffect, useState, use, useRef } from 'react';
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
  exercises: Exercise[];
}

interface MealPlan {
  id: string;
  day_number: number;
  meal_time: string;
  description: string;
  target_calories: number | null;
}

interface WorkoutLog {
  id: string;
  day_number: number;
  workout_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes: string;
  image_path: string | null;
}

interface Program {
  id: string;
  name: string;
  total_days: number;
}

const SESSION_INFO: Record<string, { label: string; icon: string; css: string }> = {
  morning: { label: 'เช้า', icon: '🌅', css: 'session-morning' },
  noon: { label: 'กลางวัน', icon: '☀️', css: 'session-noon' },
  evening: { label: 'เย็น', icon: '🌆', css: 'session-evening' },
};

const MEAL_INFO: Record<string, { label: string; icon: string; css: string }> = {
  breakfast: { label: 'เช้า', icon: '🌅', css: 'meal-breakfast' },
  lunch: { label: 'กลางวัน', icon: '🍱', css: 'meal-lunch' },
  dinner: { label: 'เย็น', icon: '🌙', css: 'meal-dinner' },
  snack: { label: 'ของว่าง', icon: '🍎', css: 'meal-snack' },
};

export default function ClientProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeTab, setActiveTab] = useState<'exercise' | 'diet' | 'log'>('exercise');
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    workout_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    notes: '',
    image_path: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'client')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'client') fetchProgram();
  }, [user, id]);

  const fetchProgram = async () => {
    const res = await fetch(`/api/client/programs/${id}`);
    if (!res.ok) { router.push('/client'); return; }
    const data = await res.json();
    setProgram(data.program);
    setDays(data.days);
    setMealPlans(data.meal_plans);
    setWorkoutLogs(data.workout_logs);
  };

  const handleWorkoutPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) setLogForm(prev => ({ ...prev, image_path: data.image_path }));
    setUploading(false);
  };

  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/client/workout-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program_id: id, day_number: selectedDay, ...logForm }),
    });
    if (res.ok) {
      setShowLogForm(false);
      setLogForm({ workout_date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', notes: '', image_path: '' });
      setPreviewUrl(null);
      fetchProgram();
    }
    setSaving(false);
  };

  if (!program) return <div className="flex items-center justify-center min-h-[60vh] text-green-400 animate-pulse">กำลังโหลด...</div>;

  const currentDay = days.find(d => d.day_number === selectedDay);
  const exercises = currentDay?.exercises || [];
  const dayMeals = mealPlans.filter(m => m.day_number === selectedDay);
  const dayLogs = workoutLogs.filter(l => l.day_number === selectedDay);
  const completedDays = new Set(workoutLogs.map(l => l.day_number)).size;

  const exercisesBySession: Record<string, Exercise[]> = {};
  exercises.forEach(ex => {
    if (!exercisesBySession[ex.session]) exercisesBySession[ex.session] = [];
    exercisesBySession[ex.session].push(ex);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/client" className="btn-secondary text-sm py-1.5 px-3">← กลับ</Link>
        <div>
          <h1 className="text-xl font-bold">{program.name}</h1>
          <p className="text-gray-500 text-sm">{completedDays}/{program.total_days} วันที่ทำสำเร็จ</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 card py-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>ความก้าวหน้า</span>
          <span>{Math.round((completedDays / program.total_days) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(completedDays / program.total_days) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Day selector */}
        <div className="w-20 shrink-0">
          <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">วัน</div>
          <div className="flex flex-col gap-1 max-h-[65vh] overflow-y-auto pr-1">
            {days.map(day => {
              const done = workoutLogs.some(l => l.day_number === day.day_number);
              return (
                <button
                  key={day.day_number}
                  onClick={() => setSelectedDay(day.day_number)}
                  className={`text-xs px-2 py-2 rounded-lg text-left font-medium transition-colors relative ${
                    selectedDay === day.day_number ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  Day {day.day_number}
                  {done && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h2 className="text-base font-semibold">Day {selectedDay}</h2>
            {dayLogs.length > 0 && <span className="badge badge-green text-xs">✓ ทำแล้ว {dayLogs.length} ครั้ง</span>}
            <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden ml-auto">
              {(['exercise', 'diet', 'log'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {tab === 'exercise' ? '🏋️ ออกกำลังกาย' : tab === 'diet' ? '🍽️ อาหาร' : '📝 บันทึก'}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise */}
          {activeTab === 'exercise' && (
            <div>
              {exercises.length === 0 ? (
                <div className="card text-center py-8 text-gray-500">ยังไม่มีโปรแกรมออกกำลังกายสำหรับวันนี้</div>
              ) : (
                <>
                  {['morning', 'noon', 'evening'].map(session => {
                    const exList = exercisesBySession[session] || [];
                    if (!exList.length) return null;
                    const si = SESSION_INFO[session];
                    return (
                      <div key={session} className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{si.icon}</span>
                          <span className="font-medium text-sm">{si.label}</span>
                        </div>
                        <div className="space-y-2">
                          {exList.map((ex, i) => (
                            <div key={ex.id} className={`card ${si.css} py-3`}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-5">{i + 1}.</span>
                                <span className="font-medium text-sm">{ex.name}</span>
                              </div>
                              <div className="flex gap-3 mt-1 ml-7 flex-wrap">
                                {ex.sets && <span className="badge badge-blue text-xs">{ex.sets} เซต</span>}
                                {ex.reps && <span className="badge badge-green text-xs">{ex.reps} ครั้ง</span>}
                                {ex.duration_minutes && <span className="badge badge-orange text-xs">{ex.duration_minutes} นาที</span>}
                                {ex.rest_seconds && <span className="badge badge-gray text-xs">พัก {ex.rest_seconds}s</span>}
                              </div>
                              {ex.notes && <p className="text-xs text-gray-500 mt-1 ml-7">{ex.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <div className="mt-4">
                <button onClick={() => { setActiveTab('log'); setShowLogForm(true); }} className="btn-primary w-full py-3">
                  ✅ บันทึกการออกกำลังกาย Day {selectedDay}
                </button>
              </div>
            </div>
          )}

          {/* Diet */}
          {activeTab === 'diet' && (
            <div>
              {dayMeals.length === 0 ? (
                <div className="card text-center py-8 text-gray-500">ยังไม่มีแผนอาหารสำหรับวันนี้</div>
              ) : (
                <div className="space-y-4">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(mealTime => {
                    const meals = dayMeals.filter(m => m.meal_time === mealTime);
                    if (!meals.length) return null;
                    const mi = MEAL_INFO[mealTime];
                    return (
                      <div key={mealTime}>
                        <div className="flex items-center gap-2 mb-2">
                          <span>{mi.icon}</span>
                          <span className="font-medium text-sm">{mi.label}</span>
                        </div>
                        <div className="space-y-2">
                          {meals.map(meal => (
                            <div key={meal.id} className={`card ${mi.css} py-3`}>
                              <p className="text-sm">{meal.description}</p>
                              {meal.target_calories && (
                                <p className="text-xs text-green-400 mt-1">🎯 เป้าหมาย {meal.target_calories} cal</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4">
                <Link href="/client/food" className="btn-secondary block text-center py-2.5">📸 บันทึกอาหารที่กินวันนี้</Link>
              </div>
            </div>
          )}

          {/* Log */}
          {activeTab === 'log' && (
            <div>
              {dayLogs.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-medium text-gray-400">ประวัติการออกกำลังกาย</h3>
                  {dayLogs.map(log => (
                    <div key={log.id} className="card border-green-800 flex gap-3">
                      {log.image_path && (
                        <img src={log.image_path} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">📅 {log.workout_date}</span>
                          {log.duration_minutes && <span className="badge badge-green">{log.duration_minutes} นาที</span>}
                        </div>
                        {log.start_time && log.end_time && (
                          <p className="text-xs text-gray-500 mt-1">⏰ {log.start_time} - {log.end_time}</p>
                        )}
                        {log.notes && <p className="text-xs text-gray-400 mt-1">{log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showLogForm ? (
                <form onSubmit={submitLog} className="card space-y-4">
                  <h3 className="font-medium">บันทึก Day {selectedDay}</h3>

                  {/* Photo upload */}
                  <div>
                    <label className="label">📸 รูปการออกกำลังกาย</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#333] rounded-xl p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
                    >
                      {previewUrl ? (
                        <div className="relative">
                          <img src={previewUrl} alt="" className="w-full max-h-40 object-cover rounded-lg" />
                          {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                              <span className="text-white text-sm">กำลังอัพโหลด...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-3">
                          <div className="text-3xl mb-1">📷</div>
                          <p className="text-gray-500 text-sm">กดเพื่อถ่ายหรือเลือกรูป</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleWorkoutPhoto} />
                  </div>

                  <div>
                    <label className="label">วันที่ออกกำลังกาย *</label>
                    <input type="date" className="input" value={logForm.workout_date} onChange={e => setLogForm({ ...logForm, workout_date: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">เวลาเริ่ม</label>
                      <input type="time" className="input" value={logForm.start_time} onChange={e => setLogForm({ ...logForm, start_time: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">เวลาเสร็จ</label>
                      <input type="time" className="input" value={logForm.end_time} onChange={e => setLogForm({ ...logForm, end_time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">หมายเหตุ</label>
                    <textarea className="input" rows={2} value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} placeholder="ความรู้สึก, ความยาก, etc." />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1" disabled={saving || uploading}>{saving ? 'กำลังบันทึก...' : '✅ บันทึก'}</button>
                    <button type="button" onClick={() => { setShowLogForm(false); setPreviewUrl(null); }} className="btn-secondary">ยกเลิก</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowLogForm(true)} className="btn-primary w-full py-3">
                  + บันทึกการออกกำลังกาย Day {selectedDay}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
