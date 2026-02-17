import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 클라이언트 및 신청 정보 조회
    const client: any = db.prepare(`
      SELECT 
        c.name,
        c.email,
        c.soho_grade,
        a.status as application_status,
        a.policy_funds,
        a.fund_amounts
      FROM clients c
      LEFT JOIN applications a ON c.id = a.client_id
      WHERE c.id = ?
    `).get(clientId);

    if (!client) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // policy_funds와 fund_amounts JSON 파싱
    const policyFunds = client.policy_funds ? JSON.parse(client.policy_funds) : [];
    const fundAmounts = client.fund_amounts ? JSON.parse(client.fund_amounts) : {};

    return NextResponse.json({
      success: true,
      client: {
        name: client.name,
        email: client.email,
        soho_grade: client.soho_grade,
        application_status: client.application_status || '접수대기',
        policy_funds: policyFunds,
        fund_amounts: fundAmounts
      }
    });

  } catch (error: any) {
    console.error('Share link data error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
