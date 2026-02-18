import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const VALID_STATUSES = ['접수대기', '접수완료', '진행중', '진행완료', '집행완료', '보완', '반려'];

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
    const { clientId, fundName, status, notes } = body;

    if (!clientId || !fundName || !status) {
      return NextResponse.json(
        { error: 'clientId, fundName, status는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다.' },
        { status: 400 }
      );
    }

    initDatabase();
    const db = getDatabase();

    // UPSERT: 없으면 INSERT, 있으면 UPDATE
    db.prepare(`
      INSERT INTO fund_statuses (client_id, fund_name, status, notes, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(client_id, fund_name)
      DO UPDATE SET
        status = excluded.status,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).run(clientId, fundName, status, notes || '');

    return NextResponse.json({
      success: true,
      message: `'${fundName}' 상태가 '${status}'(으)로 업데이트되었습니다.`
    });

  } catch (error: any) {
    console.error('Fund status update error:', error);
    return NextResponse.json(
      { error: '정책자금 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
