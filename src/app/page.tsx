'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'trainer' ? '/trainer' : '/client');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-green-400 text-xl animate-pulse">กำลังโหลด...</div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="text-6xl mb-4">💪</div>
      <h1 className="text-4xl font-bold mb-3">
        <span className="text-green-400">FitInTrend</span>
      </h1>
      <p className="text-gray-400 text-lg mb-2">แอปบันทึกการออกกำลังกายและโภชนาการ</p>
      <p className="text-gray-500 text-sm mb-8 max-w-md">
        สำหรับเทรนเนอร์และลูกค้า — จัดโปรแกรมออกกำลังกาย บันทึกอาหาร คำนวณแคลอรี่อัตโนมัติ
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/login" className="btn-primary text-lg py-3 px-8">เข้าสู่ระบบ</Link>
        <Link href="/register" className="btn-secondary text-lg py-3 px-8">สมัครสมาชิก</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
        {[
          { icon: '📋', title: 'โปรแกรมออกกำลังกาย', desc: 'เทรนเนอร์จัดโปรแกรมเช้า กลางวัน เย็น ตามวัน' },
          { icon: '📸', title: 'บันทึกอาหารพร้อมรูป', desc: 'อัพโหลดรูปอาหาร คำนวณแคลอรี่อัตโนมัติ' },
          { icon: '📊', title: 'ติดตามความก้าวหน้า', desc: 'ดูสถิติการออกกำลังกายและการกินในแต่ละวัน' },
        ].map((f) => (
          <div key={f.title} className="card text-left">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
