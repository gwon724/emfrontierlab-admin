import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { evaluatePolicyFunds, calculateSOHOGrade, calculateMaxLoanLimit, performCompanyAnalysis } from '@/lib/ai-diagnosis';

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { clientId, kcb_score, nice_score } = await request.json();
    if (!clientId) return NextResponse.json({ error: 'clientId가 필요합니다.' }, { status: 400 });

    const kcb = kcb_score !== undefined ? parseInt(kcb_score) : null;
    const nice = nice_score !== undefined ? parseInt(nice_score) : null;

    if (nice !== null && (isNaN(nice) || nice < 0 || nice > 1000)) {
      return NextResponse.json({ error: 'NICE 점수는 0~1000 사이여야 합니다.' }, { status: 400 });
    }
    if (kcb !== null && (isNaN(kcb) || kcb < 0 || kcb > 1000)) {
      return NextResponse.json({ error: 'KCB 점수는 0~1000 사이여야 합니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();
    const client: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });

    // 점수 업데이트
    if (kcb !== null && nice !== null) {
      db.prepare('UPDATE clients SET kcb_score = ?, nice_score = ? WHERE id = ?').run(kcb, nice, clientId);
    } else if (kcb !== null) {
      db.prepare('UPDATE clients SET kcb_score = ? WHERE id = ?').run(kcb, clientId);
    } else if (nice !== null) {
      db.prepare('UPDATE clients SET nice_score = ? WHERE id = ?').run(nice, clientId);
    }

    // 점수 변경 후 SOHO 등급 자동 재계산
    const updatedClient: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    const clientData = {
      niceScore: updatedClient.nice_score || 0,
      kcbScore: updatedClient.kcb_score || 0,
      annualRevenue: updatedClient.annual_revenue || 0,
      debt: updatedClient.debt || 0,
      hasTechnology: updatedClient.has_technology === 1,
      businessYears: updatedClient.business_years || 0,
      employeeCount: updatedClient.employee_count || 0,
    };
    const newGrade = calculateSOHOGrade(clientData);
    const newLimit = calculateMaxLoanLimit(clientData, newGrade);

    db.prepare('UPDATE clients SET soho_grade = ?, score = ? WHERE id = ?').run(newGrade, newLimit, clientId);

    return NextResponse.json({
      success: true,
      message: '신용점수가 업데이트되었습니다.',
      kcb_score: updatedClient.kcb_score,
      nice_score: updatedClient.nice_score,
      soho_grade: newGrade,
      max_loan_limit: newLimit,
    });
  } catch (error: any) {
    console.error('update-credit-score error:', error);
    return NextResponse.json({ error: '신용점수 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
