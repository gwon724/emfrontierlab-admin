import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * AI 정책자금 평가 모달에서 선택된 자금을 클라이언트에게 등록하는 API
 * POST /api/admin/register-funds-from-eval
 * Body: { clientId, selectedFunds: string[], mode: 'replace' | 'add' }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, selectedFunds, mode = 'add' } = body;

    if (!clientId) return NextResponse.json({ error: 'clientId가 필요합니다.' }, { status: 400 });
    if (!selectedFunds || selectedFunds.length === 0) {
      return NextResponse.json({ error: '선택된 자금이 없습니다.' }, { status: 400 });
    }

    initDatabase();
    const db = getDatabase();

    // 클라이언트 존재 확인
    const client: any = db.prepare('SELECT id, name FROM clients WHERE id = ?').get(clientId);
    if (!client) return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 });

    // 기존 신청 확인
    const existing: any = db.prepare('SELECT * FROM applications WHERE client_id = ?').get(clientId);

    let finalFunds: string[];

    if (existing) {
      const currentFunds: string[] = JSON.parse(existing.policy_funds || '[]');
      if (mode === 'replace') {
        // 교체 모드: 선택된 자금으로 완전히 교체
        finalFunds = selectedFunds;
      } else {
        // 추가 모드: 기존 자금에 새 자금 추가 (중복 제거)
        const combined = [...currentFunds, ...selectedFunds];
        finalFunds = Array.from(new Set(combined));
      }

      db.prepare(`
        UPDATE applications 
        SET policy_funds = ?, status = '접수대기', updated_at = datetime('now')
        WHERE client_id = ?
      `).run(JSON.stringify(finalFunds), clientId);
    } else {
      // 새 신청 생성
      finalFunds = selectedFunds;
      db.prepare(`
        INSERT INTO applications 
        (client_id, policy_funds, status, created_at, updated_at)
        VALUES (?, ?, '접수대기', datetime('now'), datetime('now'))
      `).run(clientId, JSON.stringify(finalFunds));
    }

    return NextResponse.json({
      success: true,
      message: `${client.name}님에게 ${selectedFunds.length}개 정책자금이 ${mode === 'replace' ? '등록' : '추가'}되었습니다.`,
      clientName: client.name,
      registeredFunds: selectedFunds,
      totalFunds: finalFunds,
      mode,
    });
  } catch (error: any) {
    console.error('register-funds-from-eval error:', error);
    return NextResponse.json({ error: '자금 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
