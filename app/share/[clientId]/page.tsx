'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ShareClientInfo() {
  const params = useParams();
  const clientId = params.clientId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientData, setClientData] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    fetchClientInfo();
    generateQRCode();
  }, [clientId]);

  const fetchClientInfo = async () => {
    try {
      const res = await fetch(`/api/share/client-info?clientId=${clientId}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setClientData(data.client);
      } else {
        setError(data.error || '데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      // QR 코드 생성 API 호출 (클라이언트 공유 링크)
      const currentUrl = window.location.href;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
      setQrCodeUrl(qrApiUrl);
    } catch (err) {
      console.error('QR 코드 생성 오류:', err);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatCurrency = (num: number) => {
    return `${formatNumber(num)}원`;
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      '접수대기': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '접수완료': 'bg-blue-100 text-blue-800 border-blue-300',
      '진행중': 'bg-purple-100 text-purple-800 border-purple-300',
      '진행완료': 'bg-green-100 text-green-800 border-green-300',
      '집행완료': 'bg-teal-100 text-teal-800 border-teal-300',
      '보완': 'bg-orange-100 text-orange-800 border-orange-300',
      '반려': 'bg-red-100 text-red-800 border-red-300',
      '미신청': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 고객 정보 보고서
              </h1>
              <p className="text-gray-600">EMFRONTIER 정책자금 신청 정보</p>
            </div>
            
            {/* QR 코드 */}
            {qrCodeUrl && (
              <div className="bg-white border-4 border-gray-200 rounded-xl p-2 shadow-lg">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-32 h-32"
                />
                <p className="text-xs text-gray-500 text-center mt-1">공유 링크</p>
              </div>
            )}
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            기본 정보
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-700 font-semibold mb-1">이름</p>
              <p className="text-lg font-bold text-blue-900">{clientData.name}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <p className="text-sm text-purple-700 font-semibold mb-1">이메일</p>
              <p className="text-sm font-bold text-purple-900 break-all">{clientData.email}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
              <p className="text-sm text-pink-700 font-semibold mb-1">나이</p>
              <p className="text-lg font-bold text-pink-900">{clientData.age}세</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-700 font-semibold mb-1">성별</p>
              <p className="text-lg font-bold text-green-900">{clientData.gender}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <p className="text-sm text-yellow-700 font-semibold mb-1">연매출</p>
              <p className="text-sm font-bold text-yellow-900">{formatCurrency(clientData.annual_revenue)}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
              <p className="text-sm text-indigo-700 font-semibold mb-1">기술기업</p>
              <p className="text-lg font-bold text-indigo-900">{clientData.has_technology ? 'O' : 'X'}</p>
            </div>
          </div>
        </div>

        {/* 신용 점수 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            신용 점수
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <p className="text-sm font-semibold mb-2 opacity-90">KCB 신용점수</p>
              <p className="text-4xl font-bold">{clientData.kcb_score || 'N/A'}</p>
              <div className="mt-3 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${(clientData.kcb_score / 1000) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <p className="text-sm font-semibold mb-2 opacity-90">NICE 신용점수</p>
              <p className="text-4xl font-bold">{clientData.nice_score || 'N/A'}</p>
              <div className="mt-3 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${(clientData.nice_score / 1000) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 기대출 현황 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💰</span>
            기대출 현황
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-red-50 rounded-xl p-4 border-l-4 border-red-500">
              <span className="font-semibold text-red-700">총 부채</span>
              <span className="text-xl font-bold text-red-900">{formatCurrency(clientData.debt)}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">정책자금 대출</p>
                <p className="text-sm font-bold text-blue-900">{formatCurrency(clientData.debt_policy_fund)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-700 mb-1">신용대출</p>
                <p className="text-sm font-bold text-green-900">{formatCurrency(clientData.debt_credit_loan)}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-yellow-700 mb-1">제2금융권</p>
                <p className="text-sm font-bold text-yellow-900">{formatCurrency(clientData.debt_secondary_loan)}</p>
              </div>
              <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                <p className="text-xs text-pink-700 mb-1">카드론</p>
                <p className="text-sm font-bold text-pink-900">{formatCurrency(clientData.debt_card_loan)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 소호등급 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            소호등급
          </h2>
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-xl p-8 text-white text-center shadow-lg">
            <p className="text-sm font-semibold mb-2 opacity-90">AI 평가 등급</p>
            <p className="text-6xl font-bold">{clientData.soho_grade || 'N/A'}</p>
          </div>
        </div>

        {/* 신청 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            정책자금 신청 현황
          </h2>
          
          {/* 상태 */}
          <div className="mb-4">
            <span className={`inline-block px-4 py-2 rounded-lg font-bold border-2 ${getStatusColor(clientData.application_status)}`}>
              {clientData.application_status}
            </span>
          </div>

          {/* 신청한 정책자금 */}
          {clientData.policy_funds && clientData.policy_funds.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 mb-2">신청한 정책자금 목록</h3>
              {clientData.policy_funds.map((fund: any, index: number) => {
                const fundName = typeof fund === 'string' ? fund : fund.name;
                const fundAmount = clientData.fund_amounts && clientData.fund_amounts[fundName];
                
                return (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-l-4 border-blue-500 shadow">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 mb-1">{fundName}</p>
                        {typeof fund === 'object' && fund.category && (
                          <p className="text-sm text-gray-600">분류: {fund.category}</p>
                        )}
                        {typeof fund === 'object' && fund.requirements && (
                          <p className="text-xs text-gray-500 mt-1">{fund.requirements}</p>
                        )}
                      </div>
                      {fundAmount && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">신청금액</p>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(fundAmount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500">신청한 정책자금이 없습니다.</p>
            </div>
          )}

          {/* AI 추천 정책자금 */}
          {clientData.recommended_funds && clientData.recommended_funds.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>🤖</span>
                AI 추천 정책자금
              </h3>
              <div className="grid gap-3">
                {clientData.recommended_funds.map((fund: any, index: number) => {
                  const fundName = typeof fund === 'string' ? fund : fund.name;
                  
                  return (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border-l-4 border-green-500">
                      <p className="font-bold text-gray-800">{fundName}</p>
                      {typeof fund === 'object' && (
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {fund.category && <p>• 분류: {fund.category}</p>}
                          {fund.max_amount && <p>• 최대한도: {fund.max_amount}</p>}
                          {fund.interest_rate && <p>• 금리: {fund.interest_rate}</p>}
                          {fund.requirements && <p>• 조건: {fund.requirements}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 메모 */}
          {clientData.notes && (
            <div className="mt-4 bg-yellow-50 rounded-xl p-4 border-l-4 border-yellow-400">
              <p className="text-sm font-semibold text-yellow-800 mb-1">관리자 메모</p>
              <p className="text-gray-700">{clientData.notes}</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="text-center text-gray-500 text-sm py-6">
          <p>© 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved</p>
          <p className="mt-1">이 정보는 비공개 자료입니다. 무단 배포를 금지합니다.</p>
        </div>
      </div>
    </div>
  );
}
