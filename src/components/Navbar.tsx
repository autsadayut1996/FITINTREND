'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-[#2a2a2a] bg-[#111] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-green-400">💪</span>
          <span>FitInTrend</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-400">{user.name}</span>
              <span className={`badge ${user.role === 'trainer' ? 'badge-blue' : 'badge-green'}`}>
                {user.role === 'trainer' ? '🏋️ เทรนเนอร์' : '🏃 ลูกค้า'}
              </span>
              <Link
                href={user.role === 'trainer' ? '/trainer' : '/client'}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                แดชบอร์ด
              </Link>
              <button onClick={logout} className="btn-danger text-sm py-1.5">ออกจากระบบ</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm py-1.5 px-3">เข้าสู่ระบบ</Link>
              <Link href="/register" className="btn-primary text-sm py-1.5 px-3">สมัครสมาชิก</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
