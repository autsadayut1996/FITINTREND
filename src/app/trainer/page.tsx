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
  is_active: number;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export default function TrainerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', total_days: 30, client_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'trainer')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchPrograms();
      fetchClients();
    }
  }, [user]);

  const fetchPrograms = async () => {
    const res = await fetch('/api/trainer/programs');
    const data = await res.json();
    setPrograms(data.programs || []);
  };

  const fetchClients = async () => {
    const res = await fetch('/api/trainer/clients');
    const data = await res.json();
    setClients(data.clients || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/trainer/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setShowForm(false);
      setForm({ name: '', description: '', total_days: 30, client_id: '' });
      fetchPrograms();
      router.push(`/trainer/programs/${data.id}`);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบโปรแกรมนี้?')) return;
    await fetch(`/api/trainer/programs/${id}`, { method: 'DELETE' });
    fetchPrograms();
  };

  if (loading || !user) return <div className="flex items-center justify-center min-h-[60vh] text-green-400 animate-pulse">กำลังโหลด...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">แดชบอร์ดเทรนเนอร์</h1>
          <p className="text-gray-500 text-sm mt-0.5">สวัสดี, {user.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trainer/clients" className="btn-secondary text-sm">📊 บันทึกลูกค้า</Link>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ สร้างโปรแกรม</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'โปรแกรมทั้งหมด', value: programs.length, icon: '📋' },
          { label: 'โปรแกรมที่ใช้งาน', value: programs.filter(p => p.is_active).length, icon: '✅' },
          { label: 'ลูกค้าทั้งหมด', value: clients.length, icon: '👥' },
          { label: 'ลูกค้าที่มีโปรแกรม', value: programs.filter(p => p.client_id).length, icon: '🏋️' },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-green-400">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">สร้างโปรแกรมใหม่</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">ชื่อโปรแกรม *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="เช่น โปรแกรมลดน้ำหนัก 30 วัน" />
              </div>
              <div>
                <label className="label">รายละเอียด</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดโปรแกรม..." />
              </div>
              <div>
                <label className="label">จำนวนวัน *</label>
                <input type="number" className="input" value={form.total_days} onChange={e => setForm({ ...form, total_days: parseInt(e.target.value) })} min={1} max={365} required />
              </div>
              <div>
                <label className="label">มอบหมายให้ลูกค้า</label>
                <select className="input" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">-- เลือกลูกค้า --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'กำลังสร้าง...' : 'สร้างโปรแกรม'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Programs list */}
      <h2 className="font-semibold text-lg mb-3">โปรแกรมทั้งหมด</h2>
      {programs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">ยังไม่มีโปรแกรม กดปุ่ม &quot;สร้างโปรแกรม&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map(program => (
            <div key={program.id} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{program.name}</h3>
                  {program.description && <p className="text-gray-500 text-sm mt-0.5">{program.description}</p>}
                </div>
                <span className={`badge ${program.is_active ? 'badge-green' : 'badge-gray'} shrink-0`}>
                  {program.is_active ? 'ใช้งาน' : 'หยุด'}
                </span>
              </div>
              <div className="flex gap-3 text-sm text-gray-500">
                <span>📅 {program.total_days} วัน</span>
                {program.client_name && <span>👤 {program.client_name}</span>}
              </div>
              <div className="flex gap-2 mt-2">
                <Link href={`/trainer/programs/${program.id}`} className="btn-primary text-sm py-1.5 px-3 flex-1 text-center">จัดการ</Link>
                <button onClick={() => handleDelete(program.id)} className="btn-danger text-sm">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
