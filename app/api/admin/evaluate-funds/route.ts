import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { evaluatePolicyFunds, calculateSOHOGrade, calculateMaxLoanLimit } from '@/lib/ai-diagnosis';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { clientId } = await request.json();
    if (!clientId) return NextResponse.json({ error: 'clientId가 필요합니다.' }, { status: 400 });

    initDatabase();
    const db = getDatabase();
    const client: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });

    const clientData = {
      niceScore: client.nice_score || 0,
      kcb_score: client.kcb_score || 0,
      annualRevenue: client.annual_revenue || 0,
      debt: client.debt || 0,
      hasTechnology: client.has_technology === 1,
      businessYears: client.business_years || 0,
      employeeCount: client.employee_count || 0,
      age: client.age || 0,
      birth_date: client.birth_date || undefined,
      industry: client.industry || undefined,
      is_manufacturing: client.is_manufacturing || 0,
    };

    const sohoGrade = calculateSOHOGrade(clientData);
    const maxLoanLimit = calculateMaxLoanLimit(clientData, sohoGrade);
    const funds = evaluatePolicyFunds(clientData);

    return NextResponse.json({ success: true, sohoGrade, maxLoanLimit, funds, clientName: client.name });
  } catch (error: any) {
    console.error('evaluate-funds error:', error);
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
