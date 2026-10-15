import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

const TRAINER_PATHS = ['/trainer'];
const CLIENT_PATHS = ['/client'];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;

  const isTrainerPath = TRAINER_PATHS.some(p => path.startsWith(p));
  const isClientPath = CLIENT_PATHS.some(p => path.startsWith(p));

  if (isTrainerPath || isClientPath) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    const session = await verifyToken(token);
    if (!session) return NextResponse.redirect(new URL('/login', req.url));

    if (isTrainerPath && session.role !== 'trainer') {
      return NextResponse.redirect(new URL('/client', req.url));
    }
    if (isClientPath && session.role !== 'client') {
      return NextResponse.redirect(new URL('/trainer', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/trainer/:path*', '/client/:path*'],
};
