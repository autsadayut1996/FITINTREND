import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool, ready } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await ready();
    const { email, password } = await req.json();

    const { rows } = await pool.query<{
      id: string; name: string; email: string; password: string; role: 'trainer' | 'client';
    }>('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
