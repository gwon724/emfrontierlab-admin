import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, status, notes } = body;

    initDatabase();
    const db = getDatabase();

    // 진행상황 업데이트
    db.prepare(`
      UPDATE applications 
      SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE client_id = ?
    `).run(status, notes || '', clientId);

    return NextResponse.json({
      success: true,
      message: '진행상황이 업데이트되었습니다.'
    });

  } catch (error: any) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: '진행상황 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
