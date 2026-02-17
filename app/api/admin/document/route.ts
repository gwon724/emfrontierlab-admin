import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

// 문서 불러오기 (GET)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 최신 문서 조회
    const document = db.prepare(`
      SELECT content, updated_at
      FROM client_documents
      WHERE client_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(parseInt(clientId));

    if (!document) {
      return NextResponse.json({ content: null });
    }

    return NextResponse.json({
      content: (document as any).content,
      updatedAt: (document as any).updated_at
    });
  } catch (error) {
    console.error('문서 로드 오류:', error);
    return NextResponse.json(
      { error: '문서 로드 실패' },
      { status: 500 }
    );
  }
}

// 문서 저장 (POST)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { clientId, content } = await request.json();

    if (!clientId || !content) {
      return NextResponse.json(
        { error: '클라이언트 ID와 문서 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 문서 저장 (있으면 업데이트, 없으면 생성)
    const existing = db.prepare(`
      SELECT id FROM client_documents WHERE client_id = ?
    `).get(clientId);

    if (existing) {
      db.prepare(`
        UPDATE client_documents
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE client_id = ?
      `).run(content, clientId);
    } else {
      db.prepare(`
        INSERT INTO client_documents (client_id, content)
        VALUES (?, ?)
      `).run(clientId, content);
    }

    return NextResponse.json({
      success: true,
      message: '문서가 저장되었습니다.'
    });
  } catch (error) {
    console.error('문서 저장 오류:', error);
    return NextResponse.json(
      { error: '문서 저장 실패' },
      { status: 500 }
    );
  }
}
