import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    const { clientId, title, content, documentType } = body;

    if (!clientId || !title) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 문서 저장
    db.prepare(`
      INSERT INTO client_documents (client_id, document_type, title, content)
      VALUES (?, ?, ?, ?)
    `).run(clientId, documentType || 'general', title, content || '');

    return NextResponse.json({
      success: true,
      message: '문서가 저장되었습니다.'
    });

  } catch (error: any) {
    console.error('Save document error:', error);
    return NextResponse.json(
      { error: '문서 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 해당 클라이언트의 모든 문서 조회
    const documents = db.prepare(`
      SELECT * FROM client_documents
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).all(clientId);

    return NextResponse.json({
      success: true,
      documents
    });

  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: '문서 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
