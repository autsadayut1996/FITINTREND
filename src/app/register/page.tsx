'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'สมัครสมาชิกไม่สำเร็จ');
      setLoading(false);
      return;
    }

    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏋️</div>
          <h1 className="text-xl font-bold">สมัครสมาชิก</h1>
        </div>

        {error && <div className="bg-red-900/40 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">ชื่อ</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="ชื่อ-นามสกุล" />
          </div>
          <div>
            <label className="label">อีเมล</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="example@email.com" />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="อย่างน้อย 6 ตัว" minLength={6} />
          </div>
          <div>
            <label className="label">ประเภทบัญชี</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="client">🏃 ลูกค้า</option>
              <option value="trainer">🏋️ เทรนเนอร์</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          มีบัญชีแล้ว? <Link href="/login" className="text-green-400 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
