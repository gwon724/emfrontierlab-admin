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
    const { clientId, fundAmounts } = body;

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // fundAmounts는 {정책자금명: 금액} 형태의 객체
    // 예: {"소상공인 정책자금": 50000000, "혁신창업 자금": 30000000}
    const fundAmountsJson = JSON.stringify(fundAmounts || {});

    // applications 테이블에서 해당 client의 레코드 찾기
    const application: any = db.prepare('SELECT * FROM applications WHERE client_id = ?').get(clientId);

    if (!application) {
      // 레코드가 없으면 새로 생성
      db.prepare(`
        INSERT INTO applications (client_id, status, policy_funds, fund_amounts)
        VALUES (?, ?, ?, ?)
      `).run(clientId, '접수대기', '[]', fundAmountsJson);
    } else {
      // 레코드가 있으면 업데이트
      db.prepare(`
        UPDATE applications
        SET fund_amounts = ?, updated_at = CURRENT_TIMESTAMP
        WHERE client_id = ?
      `).run(fundAmountsJson, clientId);
    }

    return NextResponse.json({
      success: true,
      message: '자금 금액이 업데이트되었습니다.'
    });

  } catch (error: any) {
    console.error('Update fund amounts error:', error);
    return NextResponse.json(
      { error: '업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
