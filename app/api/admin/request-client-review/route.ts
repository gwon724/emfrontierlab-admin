import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 현재 신청 정보 가져오기
    const application: any = db.prepare(
      'SELECT * FROM applications WHERE client_id = ?'
    ).get(clientId);

    if (!application) {
      return NextResponse.json({ error: '신청 내역이 없습니다.' }, { status: 404 });
    }

    // 재심사 가능한 상태인지 확인 (반려 또는 보완 상태)
    if (application.status !== '반려' && application.status !== '보완') {
      return NextResponse.json({ 
        error: '재심사는 반려 또는 보완 상태에서만 가능합니다.',
        current_status: application.status
      }, { status: 400 });
    }

    // 상태를 접수대기로 변경
    db.prepare(`
      UPDATE applications 
      SET status = '접수대기', notes = '관리자가 재심사 요청', updated_at = datetime('now')
      WHERE client_id = ?
    `).run(clientId);

    return NextResponse.json({
      success: true,
      message: '재심사가 요청되었습니다. 상태가 접수대기로 변경되었습니다.'
    });

  } catch (error: any) {
    console.error('Request review error:', error);
    return NextResponse.json(
      { error: '재심사 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
