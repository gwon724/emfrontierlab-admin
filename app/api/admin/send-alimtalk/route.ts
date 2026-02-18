import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import {
  sendApplicationReceived,
  sendApplicationInProgress,
  sendApplicationApproved,
  sendDocumentSupplement,
  sendApplicationRejected,
} from '@/lib/kakao-alimtalk';

/**
 * 관리자 - 카카오 알림톡 전송 API
 * POST /api/admin/send-alimtalk
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 관리자 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { clientId, messageType, customParams } = body;

    if (!clientId || !messageType) {
      return NextResponse.json(
        { error: '클라이언트 ID와 메시지 타입이 필요합니다.' },
        { status: 400 }
      );
    }

    // 3. 클라이언트 정보 조회
    const db = getDatabase();
    const client = db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .get(clientId) as any;

    if (!client) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. 전화번호 확인
    if (!client.phone) {
      return NextResponse.json(
        {
          error: '전화번호가 등록되지 않았습니다.',
          message: '클라이언트의 전화번호를 먼저 등록해주세요.',
        },
        { status: 400 }
      );
    }

    // 5. 최신 신청 정보 조회
    const application = db
      .prepare(
        'SELECT * FROM applications WHERE client_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .get(clientId) as any;

    let policyFunds = [];
    if (application?.policy_funds) {
      try {
        policyFunds = JSON.parse(application.policy_funds);
      } catch (e) {
        policyFunds = [];
      }
    }

    const policyFundName = policyFunds.length > 0
      ? policyFunds.map((f: any) => f.name || f).join(', ')
      : '정책자금';

    // 6. 날짜 포맷팅
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 7. 메시지 타입별 전송
    let success = false;
    let message = '';

    switch (messageType) {
      case 'application_received':
        success = await sendApplicationReceived(client.phone, {
          customerName: client.name,
          applicationDate: formattedDate,
          policyFundName,
          amount: customParams?.amount || '미정',
        });
        message = '신청 접수 알림톡이 전송되었습니다.';
        break;

      case 'in_progress':
        success = await sendApplicationInProgress(client.phone, {
          customerName: client.name,
          status: application?.status || '진행중',
          policyFundName,
          progressDate: formattedDate,
        });
        message = '심사 진행 알림톡이 전송되었습니다.';
        break;

      case 'approved':
        success = await sendApplicationApproved(client.phone, {
          customerName: client.name,
          policyFundName,
          approvedAmount: customParams?.approvedAmount || '미정',
          approvalDate: formattedDate,
        });
        message = '승인 완료 알림톡이 전송되었습니다.';
        break;

      case 'supplement':
        success = await sendDocumentSupplement(client.phone, {
          customerName: client.name,
          supplementContent: customParams?.supplementContent || '서류 보완 필요',
          deadline: customParams?.deadline || '7일 이내',
        });
        message = '서류 보완 알림톡이 전송되었습니다.';
        break;

      case 'rejected':
        success = await sendApplicationRejected(client.phone, {
          customerName: client.name,
          policyFundName,
          rejectionReason: customParams?.rejectionReason || '자격 요건 미충족',
          rejectionDate: formattedDate,
        });
        message = '반려 알림톡이 전송되었습니다.';
        break;

      default:
        return NextResponse.json(
          { error: '지원하지 않는 메시지 타입입니다.' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '알림톡 전송에 실패했습니다. API 키 설정을 확인해주세요.',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ 알림톡 전송 오류:', error);
    return NextResponse.json(
      { error: '알림톡 전송 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
