'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface FoodLog {
  id: string;
  meal_time: string;
  food_name: string | null;
  calories: number | null;
  image_path: string | null;
  notes: string | null;
  created_at: string;
}

const MEAL_INFO: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'เช้า', icon: '🌅', color: 'badge-orange' },
  lunch: { label: 'กลางวัน', icon: '🍱', color: 'badge-green' },
  dinner: { label: 'เย็น', icon: '🌙', color: 'badge-blue' },
  snack: { label: 'ของว่าง', icon: '🍎', color: 'badge-purple' },
};

export default function FoodPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [detectedFood, setDetectedFood] = useState('');
  const [estimatedCal, setEstimatedCal] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    meal_time: 'breakfast',
    food_name: '',
    calories: '',
    image_path: '',
    notes: '',
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'client')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'client') fetchFoodLogs();
  }, [user, selectedDate]);

  const fetchFoodLogs = async () => {
    const res = await fetch(`/api/client/food-logs?date=${selectedDate}`);
    const data = await res.json();
    setFoodLogs(data.logs || []);
    setTotalCalories(data.totalCalories || 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    const fd = new FormData();
    fd.append('file', file);
    if (form.food_name) fd.append('food_name', form.food_name);

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();

    if (res.ok) {
      setForm(prev => ({ ...prev, image_path: data.image_path, calories: String(data.calories) }));
      setDetectedFood(data.detected_food);
      setEstimatedCal(String(data.calories));
      if (!form.food_name && data.detected_food) {
        setForm(prev => ({ ...prev, food_name: data.detected_food }));
      }
    }
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/client/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        log_date: selectedDate,
        meal_time: form.meal_time,
        food_name: form.food_name || null,
        calories: form.calories ? parseInt(form.calories) : null,
        image_path: form.image_path || null,
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ meal_time: 'breakfast', food_name: '', calories: '', image_path: '', notes: '' });
      setPreview(null);
      setDetectedFood('');
      setEstimatedCal('');
      fetchFoodLogs();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return;
    await fetch('/api/client/food-logs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchFoodLogs();
  };

  if (loading || !user) return <div className="flex items-center justify-center min-h-[60vh] text-green-400 animate-pulse">กำลังโหลด...</div>;

  const logsByMeal: Record<string, FoodLog[]> = {};
  foodLogs.forEach(log => {
    if (!logsByMeal[log.meal_time]) logsByMeal[log.meal_time] = [];
    logsByMeal[log.meal_time].push(log);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/client" className="btn-secondary text-sm py-1.5 px-3">← กลับ</Link>
        <h1 className="text-xl font-bold">🍽️ บันทึกอาหาร</h1>
      </div>

      {/* Date picker */}
      <div className="card mb-4 flex items-center gap-3">
        <label className="label mb-0 shrink-0">วันที่:</label>
        <input type="date" className="input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
      </div>

      {/* Calorie summary */}
      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">แคลอรี่รวมวันนี้</p>
          <p className="text-3xl font-bold text-orange-400">{totalCalories} <span className="text-sm text-gray-500">cal</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">{foodLogs.length} มื้อ</p>
          <div className="w-24 h-2 bg-gray-800 rounded-full mt-1">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min((totalCalories / 2000) * 100, 100)}%`,
                background: totalCalories > 2000 ? '#ef4444' : '#22c55e',
              }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{Math.round((totalCalories / 2000) * 100)}% ของ 2000 cal</p>
        </div>
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(true)} className="btn-primary w-full mb-6 py-3 text-base">
        📸 เพิ่มอาหาร / อัพโหลดรูป
      </button>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 px-4 pb-4">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">เพิ่มรายการอาหาร</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="label">รูปอาหาร (คำนวณแคลอรี่อัตโนมัติ)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#333] rounded-xl p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
                >
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="" className="w-full max-h-40 object-cover rounded-lg" />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                          <span className="text-white text-sm">กำลังวิเคราะห์...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-gray-500 text-sm">กดเพื่อเลือกรูปอาหาร</p>
                      <p className="text-gray-600 text-xs mt-1">ระบบจะคำนวณแคลอรี่ให้อัตโนมัติ</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                {detectedFood && (
                  <div className="mt-2 bg-green-900/30 border border-green-800 text-green-400 text-sm px-3 py-2 rounded-lg">
                    🔍 ตรวจพบ: <strong>{detectedFood}</strong> — ประมาณ <strong>{estimatedCal} cal</strong>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">มื้ออาหาร</label>
                  <select className="input" value={form.meal_time} onChange={e => setForm({ ...form, meal_time: e.target.value })}>
                    <option value="breakfast">🌅 เช้า</option>
                    <option value="lunch">🍱 กลางวัน</option>
                    <option value="dinner">🌙 เย็น</option>
                    <option value="snack">🍎 ของว่าง</option>
                  </select>
                </div>
                <div>
                  <label className="label">แคลอรี่ (cal)</label>
                  <input type="number" className="input" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} placeholder="300" />
                </div>
              </div>

              <div>
                <label className="label">ชื่ออาหาร</label>
                <input className="input" value={form.food_name} onChange={e => setForm({ ...form, food_name: e.target.value })} placeholder="เช่น ข้าวผัด, ไก่ย่าง" />
              </div>

              <div>
                <label className="label">หมายเหตุ</label>
                <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ปริมาณ, ส่วนผสม..." />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1" disabled={saving || uploading}>
                  {saving ? 'กำลังบันทึก...' : '✅ บันทึก'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setPreview(null); setDetectedFood(''); setEstimatedCal(''); }} className="btn-secondary">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Food logs by meal */}
      {foodLogs.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          <div className="text-4xl mb-2">🍽️</div>
          <p>ยังไม่มีบันทึกอาหารสำหรับวันนี้</p>
        </div>
      ) : (
        <div className="space-y-6">
          {['breakfast', 'lunch', 'dinner', 'snack'].map(mealTime => {
            const logs = logsByMeal[mealTime] || [];
            if (!logs.length) return null;
            const mi = MEAL_INFO[mealTime];
            const mealTotal = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
            return (
              <div key={mealTime}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{mi.icon}</span>
                    <span className="font-medium">{mi.label}</span>
                  </div>
                  <span className="text-orange-400 text-sm font-medium">{mealTotal} cal</span>
                </div>
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log.id} className="card flex items-start gap-3 py-2.5 px-3">
                      {log.image_path ? (
                        <img src={log.image_path} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center text-2xl shrink-0">{mi.icon}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{log.food_name || 'ไม่ระบุชื่ออาหาร'}</p>
                        {log.notes && <p className="text-xs text-gray-500 mt-0.5">{log.notes}</p>}
                        {log.calories && (
                          <span className="text-orange-400 text-xs font-medium">{log.calories} cal</span>
                        )}
                      </div>
                      <button onClick={() => handleDelete(log.id)} className="text-red-500 text-xs shrink-0 hover:text-red-300 mt-1">ลบ</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="card border-orange-800 bg-orange-900/10 flex justify-between items-center">
            <span className="font-medium">รวมทั้งวัน</span>
            <span className="text-orange-400 text-xl font-bold">{totalCalories} cal</span>
          </div>
        </div>
      )}
    </div>
  );
}
