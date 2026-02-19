import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDatabase, getDatabase } from '@/lib/db';
import { generateToken } from '@/lib/auth';

// 관리자 인증 코드 (비밀번호와 분리된 별도 인증번호)
const ADMIN_AUTH_CODE = '018181';

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const db = getDatabase();

    const body = await request.json();
    const { name, phone, email, password, authCode } = body;

    // 필수 필드 검증
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: '연락처를 입력해주세요.' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
    }
    if (!authCode) {
      return NextResponse.json({ error: '관리자 인증번호를 입력해주세요.' }, { status: 400 });
    }

    // ── 인증번호 검증 (비밀번호와 무관하게 별도 확인) ──
    if (authCode.trim() !== ADMIN_AUTH_CODE) {
      return NextResponse.json(
        { error: '관리자 인증번호가 올바르지 않습니다.' },
        { status: 403 }
      );
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      return NextResponse.json({ error: '올바른 전화번호 형식이 아닙니다.' }, { status: 400 });
    }

    // 비밀번호 길이 검증 (최소 6자, 인증코드 조건 없음)
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
    }

    // 이메일 중복 확인
    const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 관리자 등록
    const result = db.prepare(
      'INSERT INTO admins (email, password, name, phone) VALUES (?, ?, ?, ?)'
    ).run(email, hashedPassword, name.trim(), phone);

    const adminId = result.lastInsertRowid;

    // JWT 토큰 생성
    const token = generateToken({
      id: Number(adminId),
      email,
      type: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: '관리자 계정이 생성되었습니다.',
      token,
      admin: {
        id: Number(adminId),
        email,
        name: name.trim(),
        phone,
      },
    });
  } catch (error: any) {
    console.error('Admin register error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}
