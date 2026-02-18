import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const { clientId, newPassword } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검사
    if (!newPassword) {
      return NextResponse.json(
        { error: '새 비밀번호는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    initDatabase();
    const db = getDatabase();

    // 클라이언트 존재 확인
    const client: any = db.prepare('SELECT id, name, email FROM clients WHERE id = ?').get(clientId);
    if (!client) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    db.prepare(`
      UPDATE clients 
      SET password = ? 
      WHERE id = ?
    `).run(hashedPassword, clientId);

    // 로그 기록 (보안상 중요)
    console.log(`[ADMIN] Client password reset - ClientID: ${clientId}, ClientName: ${client.name}, ClientEmail: ${client.email}, Admin: ${payload.email}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 재설정되었습니다.'
    });

  } catch (error: any) {
    console.error('Reset client password error:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}
