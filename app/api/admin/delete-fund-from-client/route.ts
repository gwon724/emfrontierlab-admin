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
    const { clientId, fundName } = body;

    if (!clientId || !fundName) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
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

    // policy_funds에서 해당 자금 제거
    const currentFunds = JSON.parse(application.policy_funds || '[]');
    const updatedFunds = currentFunds.filter((fund: string) => fund !== fundName);

    if (updatedFunds.length === 0) {
      // 모든 자금을 삭제한 경우 신청 자체를 삭제
      db.prepare('DELETE FROM applications WHERE client_id = ?').run(clientId);
      return NextResponse.json({
        success: true,
        message: '모든 정책자금이 삭제되어 신청이 취소되었습니다.',
        deleted_all: true
      });
    }

    // fund_amounts에서도 해당 자금 제거
    let fundAmounts = {};
    if (application.fund_amounts) {
      try {
        fundAmounts = JSON.parse(application.fund_amounts);
        delete fundAmounts[fundName];
      } catch (e) {
        console.error('Error parsing fund_amounts:', e);
      }
    }

    // 업데이트된 정보 저장
    db.prepare(`
      UPDATE applications 
      SET policy_funds = ?, fund_amounts = ?, updated_at = datetime('now')
      WHERE client_id = ?
    `).run(
      JSON.stringify(updatedFunds),
      JSON.stringify(fundAmounts),
      clientId
    );

    return NextResponse.json({
      success: true,
      message: '정책자금이 삭제되었습니다.',
      remaining_funds: updatedFunds.length
    });

  } catch (error: any) {
    console.error('Delete fund error:', error);
    return NextResponse.json(
      { error: '정책자금 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
