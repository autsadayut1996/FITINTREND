'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      setLoading(false);
      return;
    }

    await refresh();
    router.push(data.user.role === 'trainer' ? '/trainer' : '/client');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💪</div>
          <h1 className="text-xl font-bold">เข้าสู่ระบบ</h1>
        </div>

        {error && <div className="bg-red-900/40 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">อีเมล</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ยังไม่มีบัญชี? <Link href="/register" className="text-green-400 hover:underline">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  );
}
