import { NextRequest, NextResponse } from 'next/server';
import { pool, ready } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ready();
  const { id } = await params;

  const { rows } = await pool.query<{ content_type: string; data: Buffer }>(
    'SELECT content_type, data FROM uploads WHERE id = $1',
    [id]
  );
  const row = rows[0];
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      'Content-Type': row.content_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
