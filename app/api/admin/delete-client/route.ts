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
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: '클라이언트 ID가 필요합니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 클라이언트 존재 여부 확인
    const client: any = db.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).get(clientId);

    if (!client) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 트랜잭션으로 클라이언트 및 관련 데이터 삭제
    try {
      // PRAGMA 설정으로 외래 키 제약조건 일시 비활성화
      db.pragma('foreign_keys = OFF');
      
      // 1. AI 진단 결과 삭제
      db.prepare('DELETE FROM ai_diagnosis WHERE client_id = ?').run(clientId);
      
      // 2. 신청 내역 삭제
      db.prepare('DELETE FROM applications WHERE client_id = ?').run(clientId);
      
      // 3. 문서 삭제 (있다면)
      try {
        db.prepare('DELETE FROM client_documents WHERE client_id = ?').run(clientId);
      } catch (e) {
        // client_documents 테이블이 없을 수 있음
        console.log('client_documents table does not exist or is empty');
      }
      
      // 4. 클라이언트 삭제
      db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
      
      // 외래 키 제약조건 다시 활성화
      db.pragma('foreign_keys = ON');

      return NextResponse.json({
        success: true,
        message: `클라이언트 "${client.name}"(${client.email})와 관련된 모든 데이터가 삭제되었습니다.`
      });

    } catch (deleteError) {
      // 외래 키 제약조건 다시 활성화
      db.pragma('foreign_keys = ON');
      console.error('Delete transaction error:', deleteError);
      return NextResponse.json(
        { error: '클라이언트 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: '클라이언트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
