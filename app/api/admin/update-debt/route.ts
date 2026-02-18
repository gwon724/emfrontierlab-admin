import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function PUT(req: Request) {
  try {
    // 관리자 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientId,
      annual_revenue,
      business_years,
      total_debt,
      debt_policy_fund,
      debt_credit_loan,
      debt_secondary_loan,
      debt_card_loan
    } = body;

    // 필수 필드 검증
    if (!clientId || total_debt === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['clientId', 'total_debt']
      }, { status: 400 });
    }

    // 데이터베이스 연결
    const db = getDatabase();

    // 클라이언트 존재 확인
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 재무 정보 업데이트 (연매출 + 업력 + 부채 정보)
    db.prepare(`
      UPDATE clients 
      SET 
        annual_revenue = ?,
        business_years = ?,
        debt = ?,
        total_debt = ?,
        debt_policy_fund = ?,
        debt_credit_loan = ?,
        debt_secondary_loan = ?,
        debt_card_loan = ?
      WHERE id = ?
    `).run(
      annual_revenue || 0,
      business_years || 0,
      total_debt,
      total_debt,
      debt_policy_fund || 0,
      debt_credit_loan || 0,
      debt_secondary_loan || 0,
      debt_card_loan || 0,
      clientId
    );

    return NextResponse.json({
      success: true,
      message: 'Debt information updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating debt:', error);
    return NextResponse.json({ 
      error: 'Failed to update debt information',
      details: error.message
    }, { status: 500 });
  }
}
