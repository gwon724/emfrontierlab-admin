import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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
    const {
      email,
      password,
      name,
      phone,
      age,
      gender,
      annual_revenue,
      debt,
      debt_policy_fund,
      debt_credit_loan,
      debt_secondary_loan,
      debt_card_loan,
      kcb_score,
      nice_score,
      has_technology,
      business_years
    } = body;

    // 필수 필드 검증
    if (!email || !password || !name || !age || !gender || annual_revenue === undefined || debt === undefined) {
      return NextResponse.json({ 
        error: '필수 정보가 누락되었습니다. (이메일, 비밀번호, 이름, 나이, 성별, 연매출, 총부채)' 
      }, { status: 400 });
    }

    // 전화번호 유효성 검사 (선택사항이지만, 있으면 검증)
    if (phone) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(phone.replace(/-/g, ''))) {
        return NextResponse.json(
          { error: '올바른 전화번호 형식이 아닙니다.' },
          { status: 400 }
        );
      }
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    }

    // 비밀번호 길이 검증 (최소 6자)
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
    }

    // 업력 검증 (필수)
    if (business_years === undefined || business_years < 0) {
      return NextResponse.json({ error: '업력(사업 연수)을 입력해주세요.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 이메일 중복 확인
    const existingClient = db.prepare('SELECT * FROM clients WHERE email = ?').get(email);
    if (existingClient) {
      return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 409 });
    }

    // 비밀번호 해시화
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 클라이언트 생성
    const result = db.prepare(`
      INSERT INTO clients (
        email, 
        password, 
        name,
        phone,
        age, 
        gender, 
        annual_revenue, 
        debt,
        debt_policy_fund,
        debt_credit_loan,
        debt_secondary_loan,
        debt_card_loan,
        kcb_score,
        nice_score,
        has_technology,
        business_years,
        agree_credit_check,
        agree_privacy,
        agree_confidentiality
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
    `).run(
      email,
      hashedPassword,
      name,
      phone || null,
      parseInt(age) || 0,
      gender,
      parseInt(annual_revenue) || 0,
      parseInt(debt) || 0,
      parseInt(debt_policy_fund) || 0,
      parseInt(debt_credit_loan) || 0,
      parseInt(debt_secondary_loan) || 0,
      parseInt(debt_card_loan) || 0,
      parseInt(kcb_score) || null,
      parseInt(nice_score) || 0,
      has_technology ? 1 : 0,
      parseInt(business_years) || 0
    );

    return NextResponse.json({
      success: true,
      message: '클라이언트가 성공적으로 등록되었습니다.',
      clientId: result.lastInsertRowid
    });

  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: '클라이언트 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
