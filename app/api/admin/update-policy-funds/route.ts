import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase, initDatabase } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    // 토큰 검증
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    initDatabase();
    const db = getDatabase();

    const body = await request.json();
    const { clientId, policyFunds } = body;

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다.' }, { status: 400 });
    }

    // applications 테이블에서 해당 클라이언트의 신청 정보 업데이트
    const application = db.prepare(`
      SELECT id FROM applications WHERE client_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(clientId);

    if (application) {
      db.prepare(`
        UPDATE applications 
        SET policy_funds = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(
        JSON.stringify(policyFunds),
        application.id
      );
    } else {
      // 신청이 없으면 새로 생성
      db.prepare(`
        INSERT INTO applications (client_id, status, policy_funds, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        clientId,
        '접수대기',
        JSON.stringify(policyFunds)
      );
    }

    return NextResponse.json({
      success: true,
      message: '정책자금이 업데이트되었습니다.'
    });

  } catch (error: any) {
    console.error('Update policy funds error:', error);
    return NextResponse.json(
      { error: '정책자금 업데이트 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}
