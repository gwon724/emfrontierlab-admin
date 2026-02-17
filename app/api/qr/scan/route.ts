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

    // QR 데이터 파싱
    let data;
    try {
      data = JSON.parse(qrData);
    } catch (e) {
      return NextResponse.json(
        { error: '잘못된 QR 코드 형식입니다.' },
        { status: 400 }
      );
    }

    // 발급처 검증 (관리자 사이트에서 생성된 QR만 허용)
    if (data.issuer !== 'EMFRONTIER_ADMIN') {
      return NextResponse.json(
        { error: '관리자 사이트에서 생성된 QR 코드만 스캔 가능합니다.' },
        { status: 403 }
      );
    }

    // JWT 토큰 검증
    let qrPayload;
    try {
      qrPayload = jwt.verify(data.token, QR_SECRET) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'QR 코드가 유효하지 않거나 만료되었습니다.' },
        { status: 403 }
      );
    }

    // QR 타입 검증 (관리자 전용)
    if (qrPayload.type !== 'admin-qr') {
      return NextResponse.json(
        { error: '관리자 전용 QR 코드만 스캔 가능합니다.' },
        { status: 403 }
      );
    }

    const clientId = qrPayload.clientId || data.clientId;

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
        kcb_score: client.kcb_score,
        nice_score: client.nice_score,
        has_technology: client.has_technology === 1,
        soho_grade: client.soho_grade,
      },
      application: application ? {
        id: application.id,
        status: application.status,
        policy_funds: application.policy_funds ? JSON.parse(application.policy_funds) : [],
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
