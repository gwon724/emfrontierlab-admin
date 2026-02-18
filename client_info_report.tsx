// 고객정보 보고서 출력 컴포넌트 (A4 최적화)
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface ClientInfoReportProps {
  client: any;
  onClose: () => void;
}

export default function ClientInfoReport({ client, onClose }: ClientInfoReportProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCanvasRef.current && client?.id) {
      const shareUrl = `${window.location.origin}/app/share/${client.id}`;
      QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
        width: 96,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [client]);

  const handlePrint = () => {
    window.print();
  };

  if (!client) return null;

  // 총 부채 계산
  const totalDebt = (client.debt_policy_fund || 0) +
                    (client.debt_credit_loan || 0) +
                    (client.debt_secondary_loan || 0) +
                    (client.debt_card_loan || 0);

  return (
    <div id="client-info-overlay" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div id="client-info-container" className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* 화면용 헤더 (프린트 시 숨김) */}
        <div className="print-hide sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">📄 고객정보 보고서</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              🖨️ 인쇄
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              ✕ 닫기
            </button>
          </div>
        </div>

        {/* 프린트 전용 QR 코드 (화면에서는 숨김) */}
        <canvas
          ref={qrCanvasRef}
          className="print-only"
          style={{ display: 'none' }}
        />

        {/* A4 페이지 내용 */}
        <div id="client-info-content" className="p-8">
          
          {/* 페이지 1: 고객 기본 정보 */}
          <div className="report-page">
            {/* 헤더 */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">고객 정보 보고서</h1>
                <p className="text-sm text-gray-600">Customer Information Report</p>
              </div>
              <div className="text-right">
                <div className="w-24 h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center mb-2">
                  <canvas ref={qrCanvasRef} className="w-20 h-20" />
                </div>
                <p className="text-xs text-gray-500">QR 코드</p>
              </div>
            </div>

            {/* 보고서 정보 */}
            <div className="mb-8 pb-4 border-b-2 border-gray-300">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">발행일:</span>
                  <span className="ml-2 font-semibold">{new Date().toLocaleDateString('ko-KR')}</span>
                </div>
                <div>
                  <span className="text-gray-600">고객 ID:</span>
                  <span className="ml-2 font-semibold">{client.id}</span>
                </div>
              </div>
            </div>

            {/* 섹션 1: 기본 정보 */}
            <div className="avoid-break mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-800">
                📋 기본 정보
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="text-gray-600 font-medium w-32">이름</span>
                  <span className="text-gray-900 font-semibold flex-1">{client.name}</span>
                </div>
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="text-gray-600 font-medium w-32">나이</span>
                  <span className="text-gray-900 font-semibold flex-1">{client.age}세</span>
                </div>
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="text-gray-600 font-medium w-32">성별</span>
                  <span className="text-gray-900 font-semibold flex-1">{client.gender}</span>
                </div>
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="text-gray-600 font-medium w-32">전화번호</span>
                  <span className="text-gray-900 font-semibold flex-1">{client.phone || '미등록'}</span>
                </div>
                <div className="flex border-b border-gray-200 pb-2 col-span-2">
                  <span className="text-gray-600 font-medium w-32">이메일</span>
                  <span className="text-gray-900 font-semibold flex-1">{client.email}</span>
                </div>
                <div className="flex border-b border-gray-200 pb-2 col-span-2">
                  <span className="text-gray-600 font-medium w-32">가입일</span>
                  <span className="text-gray-900 font-semibold flex-1">
                    {new Date(client.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            {/* 섹션 2: 신용 정보 */}
            <div className="avoid-break mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-800">
                🏆 신용 등급 및 점수
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-2">SOHO 등급</div>
                    <div className="text-3xl font-bold text-gray-900">{client.soho_grade}</div>
                    <div className="text-xs text-gray-500 mt-1">등급</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-2">KCB 점수</div>
                    <div className="text-3xl font-bold text-gray-900">{client.kcb_score || '-'}</div>
                    <div className="text-xs text-gray-500 mt-1">점</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-2">NICE 점수</div>
                    <div className="text-3xl font-bold text-gray-900">{client.nice_score || '-'}</div>
                    <div className="text-xs text-gray-500 mt-1">점</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 섹션 3: 재무 정보 */}
            <div className="avoid-break">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-800">
                💰 재무 정보
              </h2>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">연매출</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(client.annual_revenue || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">원</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">총 부채</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalDebt.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">원</div>
                </div>
              </div>

              {/* 부채 세부 내역 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">기대출 내역</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm text-gray-600">정책자금</span>
                    <span className="font-semibold text-gray-900">
                      {(client.debt_policy_fund || 0).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm text-gray-600">신용대출</span>
                    <span className="font-semibold text-gray-900">
                      {(client.debt_credit_loan || 0).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm text-gray-600">2금융권 대출</span>
                    <span className="font-semibold text-gray-900">
                      {(client.debt_secondary_loan || 0).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm text-gray-600">카드론</span>
                    <span className="font-semibold text-gray-900">
                      {(client.debt_card_loan || 0).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 페이지 구분선 */}
          <div className="page-break"></div>

          {/* 페이지 2: 사업 정보 및 추가 정보 */}
          <div className="report-page">
            {/* 페이지 헤더 */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">고객 정보 보고서 (계속)</h1>
                <p className="text-sm text-gray-600">{client.name} 님</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>페이지 2/2</div>
              </div>
            </div>

            {/* 섹션 4: 사업 정보 */}
            <div className="avoid-break mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-800">
                🏢 사업 정보
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="text-gray-600 font-medium w-32">사업 업력</span>
                  <span className="text-gray-900 font-semibold flex-1">{client.business_years || 0}년</span>
                </div>
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="text-gray-600 font-medium w-32">사업자 유형</span>
                  <span className="text-gray-900 font-semibold flex-1">SOHO</span>
                </div>
              </div>

              {/* 재무 비율 */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">재무 비율 분석</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">부채비율</div>
                    <div className="text-xl font-bold text-gray-900">
                      {client.annual_revenue > 0 
                        ? ((totalDebt / client.annual_revenue) * 100).toFixed(1)
                        : '0.0'
                      }%
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">여유자금</div>
                    <div className="text-xl font-bold text-gray-900">
                      {((client.annual_revenue || 0) - totalDebt).toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 섹션 5: 추가 메모 */}
            <div className="avoid-break mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-800">
                📝 추가 메모
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                <p className="text-sm text-gray-500 italic">
                  관리자가 작성한 메모나 특이사항이 여기에 표시됩니다.
                </p>
              </div>
            </div>

            {/* 푸터 */}
            <div className="mt-12 pt-6 border-t-2 border-gray-300">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  본 보고서는 EMFRONTIER LAB 관리 시스템에서 발행되었습니다.
                </p>
                <p className="text-xs text-gray-500">
                  Copyright © 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
