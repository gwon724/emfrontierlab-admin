import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/db';

// 관리자 가입 인증코드
const ADMIN_INVITE_CODE = 'dpavmfhsxldj';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, inviteCode } = body;

    // 필수 필드 검증
    if (!email || !password || !name || !inviteCode) {
      return NextResponse.json(
        { error: '모든 항목을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 인증코드 검증
    if (inviteCode !== ADMIN_INVITE_CODE) {
      return NextResponse.json(
        { error: '인증코드가 올바르지 않습니다.' },
        { status: 403 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 이메일 중복 확인
    const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
    if (existingAdmin) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해시화 후 저장
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run(
      email,
      hashedPassword,
      name
    );

    return NextResponse.json({ success: true, message: '관리자 계정이 생성되었습니다.' });

  } catch (error: any) {
    console.error('Admin register error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
