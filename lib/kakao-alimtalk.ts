/**
 * 카카오 알림톡 전송 유틸리티
 * NHN Cloud (TOAST) 알림톡 API 사용
 */

// 환경변수에서 가져오기
const KAKAO_ALIMTALK_APP_KEY = process.env.KAKAO_ALIMTALK_APP_KEY || '';
const KAKAO_ALIMTALK_SECRET_KEY = process.env.KAKAO_ALIMTALK_SECRET_KEY || '';
const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY || ''; // 발신 프로필 키

// NHN Cloud 알림톡 API 엔드포인트
const ALIMTALK_API_URL = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys';

export interface AlimtalkParams {
  templateCode: string; // 템플릿 코드
  recipientNo: string; // 수신자 전화번호 (01012345678 형식)
  templateParameter: Record<string, string>; // 템플릿 변수
  buttons?: Array<{
    ordering: number;
    type: 'WL' | 'AL' | 'BK'; // WL: 웹링크, AL: 앱링크, BK: 봇키워드
    name: string;
    linkMobile?: string;
    linkPc?: string;
  }>;
}

/**
 * 전화번호 형식 검증 및 정규화
 */
function normalizePhoneNumber(phone: string): string {
  // 하이픈, 공백 제거
  const cleaned = phone.replace(/[-\s]/g, '');
  
  // 010으로 시작하는 11자리 숫자인지 확인
  if (!/^01[0-9]{8,9}$/.test(cleaned)) {
    throw new Error('유효하지 않은 전화번호 형식입니다.');
  }
  
  return cleaned;
}

/**
 * 알림톡 전송
 */
export async function sendAlimtalk(params: AlimtalkParams): Promise<boolean> {
  try {
    // API 키 검증
    if (!KAKAO_ALIMTALK_APP_KEY || !KAKAO_SENDER_KEY) {
      console.error('❌ 카카오 알림톡 API 키가 설정되지 않았습니다.');
      console.log('💡 .env 파일에 다음 값을 추가하세요:');
      console.log('   KAKAO_ALIMTALK_APP_KEY=your_app_key');
      console.log('   KAKAO_ALIMTALK_SECRET_KEY=your_secret_key');
      console.log('   KAKAO_SENDER_KEY=your_sender_key');
      return false;
    }

    // 전화번호 정규화
    const recipientNo = normalizePhoneNumber(params.recipientNo);

    // 요청 바디 구성
    const requestBody = {
      senderKey: KAKAO_SENDER_KEY,
      templateCode: params.templateCode,
      recipientList: [
        {
          recipientNo,
          templateParameter: params.templateParameter,
          buttons: params.buttons || [],
        },
      ],
    };

    // API 요청
    const response = await fetch(
      `${ALIMTALK_API_URL}/${KAKAO_ALIMTALK_APP_KEY}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': KAKAO_ALIMTALK_SECRET_KEY,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const result = await response.json();

    if (response.ok && result.header?.isSuccessful) {
      console.log('✅ 알림톡 전송 성공:', recipientNo);
      return true;
    } else {
      console.error('❌ 알림톡 전송 실패:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ 알림톡 전송 중 오류:', error);
    return false;
  }
}

/**
 * 템플릿별 전송 함수
 */

// 1. 신청 접수 알림
export async function sendApplicationReceived(
  recipientNo: string,
  params: {
    customerName: string;
    applicationDate: string;
    policyFundName: string;
    amount: string;
  }
) {
  return sendAlimtalk({
    templateCode: 'EMF_001',
    recipientNo,
    templateParameter: {
      고객명: params.customerName,
      신청일: params.applicationDate,
      정책자금명: params.policyFundName,
      신청금액: params.amount,
    },
    buttons: [
      {
        ordering: 1,
        type: 'WL',
        name: '상세보기',
        linkMobile: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
        linkPc: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
      },
    ],
  });
}

// 2. 심사 진행 알림
export async function sendApplicationInProgress(
  recipientNo: string,
  params: {
    customerName: string;
    status: string;
    policyFundName: string;
    progressDate: string;
  }
) {
  return sendAlimtalk({
    templateCode: 'EMF_002',
    recipientNo,
    templateParameter: {
      고객명: params.customerName,
      상태: params.status,
      정책자금명: params.policyFundName,
      진행일: params.progressDate,
    },
    buttons: [
      {
        ordering: 1,
        type: 'WL',
        name: '상세보기',
        linkMobile: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
        linkPc: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
      },
    ],
  });
}

// 3. 승인 완료 알림
export async function sendApplicationApproved(
  recipientNo: string,
  params: {
    customerName: string;
    policyFundName: string;
    approvedAmount: string;
    approvalDate: string;
  }
) {
  return sendAlimtalk({
    templateCode: 'EMF_003',
    recipientNo,
    templateParameter: {
      고객명: params.customerName,
      정책자금명: params.policyFundName,
      승인금액: params.approvedAmount,
      승인일: params.approvalDate,
    },
    buttons: [
      {
        ordering: 1,
        type: 'WL',
        name: '상세보기',
        linkMobile: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
        linkPc: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
      },
    ],
  });
}

// 4. 서류 보완 요청 알림
export async function sendDocumentSupplement(
  recipientNo: string,
  params: {
    customerName: string;
    supplementContent: string;
    deadline: string;
  }
) {
  return sendAlimtalk({
    templateCode: 'EMF_004',
    recipientNo,
    templateParameter: {
      고객명: params.customerName,
      보완내용: params.supplementContent,
      기한: params.deadline,
    },
    buttons: [
      {
        ordering: 1,
        type: 'WL',
        name: '서류 제출하기',
        linkMobile: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
        linkPc: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
      },
    ],
  });
}

// 5. 반려 알림
export async function sendApplicationRejected(
  recipientNo: string,
  params: {
    customerName: string;
    policyFundName: string;
    rejectionReason: string;
    rejectionDate: string;
  }
) {
  return sendAlimtalk({
    templateCode: 'EMF_005',
    recipientNo,
    templateParameter: {
      고객명: params.customerName,
      정책자금명: params.policyFundName,
      반려사유: params.rejectionReason,
      반려일: params.rejectionDate,
    },
    buttons: [
      {
        ordering: 1,
        type: 'WL',
        name: '재심사 요청',
        linkMobile: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
        linkPc: 'https://3000-i78ue3xjbua7xyz00ylib-ad490db5.sandbox.novita.ai/client/dashboard',
      },
    ],
  });
}
