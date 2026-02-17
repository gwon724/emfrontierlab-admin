import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

// QR 코드 전용 시크릿 키
const QR_SECRET = process.env.QR_SECRET || 'emfrontier-qr-secret-2026';

export async function POST(request: NextRequest) {
  try {
    // 관리자 토큰 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { qrData } = body;

    let clientId: number | null = null;

    // QR 데이터 파싱 시도
    try {
      const data = JSON.parse(qrData);
      
      // JWT 토큰이 있으면 검증
      if (data.token) {
        try {
          const qrPayload = jwt.verify(data.token, QR_SECRET) as any;
          clientId = qrPayload.clientId;
        } catch (error) {
          // JWT 검증 실패 시 직접 clientId 추출
          console.log('JWT verification failed, trying direct clientId');
        }
      }
      
      // clientId가 없으면 데이터에서 직접 추출
      if (!clientId && data.clientId) {
        clientId = parseInt(data.clientId);
      }
    } catch (e) {
      // JSON 파싱 실패 시 숫자로 파싱 시도
      const parsed = parseInt(qrData);
      if (!isNaN(parsed)) {
        clientId = parsed;
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'QR 코드에서 클라이언트 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    initDatabase();
    const db = getDatabase();

    // 클라이언트 정보 조회
    const client: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    
    if (!client) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 진행 상황 조회
    const application: any = db.prepare('SELECT * FROM applications WHERE client_id = ? ORDER BY created_at DESC LIMIT 1').get(client.id);
    
    // AI 진단 결과 조회
    const diagnosis: any = db.prepare('SELECT * FROM ai_diagnosis WHERE client_id = ? ORDER BY created_at DESC LIMIT 1').get(client.id);

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        age: client.age,
        gender: client.gender,
        annual_revenue: client.annual_revenue,
        debt: client.debt,
        debt_policy_fund: client.debt_policy_fund,
        debt_credit_loan: client.debt_credit_loan,
        debt_secondary_loan: client.debt_secondary_loan,
        debt_card_loan: client.debt_card_loan,
        kcb_score: client.kcb_score,
        nice_score: client.nice_score,
        has_technology: client.has_technology === 1,
        business_years: client.business_years,
        soho_grade: client.soho_grade,
      },
      application: application ? {
        id: application.id,
        status: application.status,
        policy_funds: application.policy_funds ? JSON.parse(application.policy_funds) : [],
        fund_amounts: application.fund_amounts ? JSON.parse(application.fund_amounts) : {},
        notes: application.notes,
      } : null,
      diagnosis: diagnosis ? {
        soho_grade: diagnosis.soho_grade,
        recommended_funds: JSON.parse(diagnosis.recommended_funds),
        diagnosis_details: diagnosis.diagnosis_details,
      } : null,
    });

  } catch (error: any) {
    console.error('QR Scan error:', error);
    return NextResponse.json(
      { error: 'QR 코드 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
