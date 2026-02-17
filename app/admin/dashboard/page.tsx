'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showClientDetail, setShowClientDetail] = useState(false);
  const [qrPassword, setQrPassword] = useState('');
  const [scannedData, setScannedData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '접수대기',
    notes: ''
  });
  const [editingFunds, setEditingFunds] = useState(false);
  const [editedFunds, setEditedFunds] = useState<string[]>([]);
  const [newFundInput, setNewFundInput] = useState('');
  const [editingFundAmounts, setEditingFundAmounts] = useState(false);
  const [fundAmounts, setFundAmounts] = useState<{[key: string]: number}>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: '남성',
    annual_revenue: '',
    debt: '',
    debt_policy_fund: '',
    debt_credit_loan: '',
    debt_secondary_loan: '',
    debt_card_loan: '',
    kcb_score: '',
    nice_score: '',
    has_technology: false,
    business_years: ''
  });
  
  // AI 진단 관련 state
  const [showAIDiagnosis, setShowAIDiagnosis] = useState(false);
  const [aiDiagnosisResult, setAiDiagnosisResult] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    fetchData();
    // 5초마다 자동 새로고침 (실시간 반영)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setData(data);
      } else {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedClient) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          status: statusUpdate.status,
          notes: statusUpdate.notes
        })
      });

      if (res.ok) {
        alert('진행상황이 업데이트되었습니다.');
        setShowStatusModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  const startQRScanner = async () => {
    try {
      setScannerError('');
      setIsScanning(true);
      
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // QR 코드 스캔 성공
          console.log('QR Scanned:', decodedText);
          await processQRData(decodedText);
          stopQRScanner();
        },
        (errorMessage) => {
          // 스캔 중 오류 (무시)
        }
      );
    } catch (error: any) {
      console.error('Scanner start error:', error);
      setScannerError('카메라를 시작할 수 없습니다: ' + error.message);
      setIsScanning(false);
    }
  };

  const stopQRScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
  };

  const processQRData = async (qrData: string) => {
    try {
      const res = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrData: qrData,
          password: ''
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('QR 스캔 성공!');
        setSelectedClient(data.client);
        setShowQRScanner(false);
        setScannedData(null);
      } else {
        alert(data.error || 'QR 스캔에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error processing QR:', error);
      alert('QR 처리 중 오류가 발생했습니다.');
    }
  };

  const handleQRScan = async () => {
    if (!scannedData) {
      alert('QR 데이터를 입력해주세요.');
      return;
    }
    await processQRData(scannedData);
  };

  // QR 스캐너 모달이 열리면 자동으로 스캐너 시작
  useEffect(() => {
    if (showQRScanner && !isScanning) {
      // 모달이 렌더링된 후 스캐너 시작
      setTimeout(() => {
        startQRScanner();
      }, 100);
    }
    
    return () => {
      if (html5QrCodeRef.current) {
        stopQRScanner();
      }
    };
  }, [showQRScanner]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/admin/login');
  };

  // 정책자금 편집 시작
  const handleStartEditFunds = () => {
    setEditedFunds(selectedClient.policy_funds || []);
    setEditingFunds(true);
  };

  // 정책자금 편집 취소
  const handleCancelEditFunds = () => {
    setEditingFunds(false);
    setEditedFunds([]);
    setNewFundInput('');
  };

  // 정책자금 추가
  const handleAddFund = () => {
    if (newFundInput.trim()) {
      setEditedFunds([...editedFunds, newFundInput.trim()]);
      setNewFundInput('');
    }
  };

  // 정책자금 제거
  const handleRemoveFund = (index: number) => {
    setEditedFunds(editedFunds.filter((_, idx) => idx !== index));
  };

  // 정책자금 업데이트 저장
  const handleSaveFunds = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch('/api/admin/update-policy-funds', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          policyFunds: editedFunds
        })
      });

      if (res.ok) {
        alert('정책자금이 업데이트되었습니다.');
        setEditingFunds(false);
        setNewFundInput('');
        fetchData();
        // selectedClient 업데이트
        setSelectedClient({
          ...selectedClient,
          policy_funds: editedFunds
        });
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating policy funds:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 자금 금액 편집 시작
  const handleStartEditFundAmounts = () => {
    setFundAmounts(selectedClient.fund_amounts || {});
    setEditingFundAmounts(true);
  };

  // 자금 금액 편집 취소
  const handleCancelEditFundAmounts = () => {
    setEditingFundAmounts(false);
    setFundAmounts({});
  };

  // 자금 금액 변경
  const handleFundAmountChange = (fundName: string, amount: string) => {
    const numAmount = parseInt(amount.replace(/,/g, '')) || 0;
    setFundAmounts({
      ...fundAmounts,
      [fundName]: numAmount
    });
  };

  // 자금 금액 저장
  const handleSaveFundAmounts = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch('/api/admin/update-fund-amounts', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          fundAmounts: fundAmounts
        })
      });

      if (res.ok) {
        alert('자금 금액이 업데이트되었습니다.');
        setEditingFundAmounts(false);
        fetchData();
        setSelectedClient({
          ...selectedClient,
          fund_amounts: fundAmounts
        });
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating fund amounts:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // AI 진단 시작
  const handleStartAIDiagnosis = async () => {
    if (!selectedClient) return;
    
    setIsLoadingAI(true);
    setShowAIDiagnosis(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // 관리자가 클라이언트 데이터로 AI 진단 실행
      const res = await fetch('/api/client/ai-diagnosis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientData: {
            annual_revenue: selectedClient.annual_revenue || 0,
            total_debt: selectedClient.total_debt || 0,
            debt_policy_fund: selectedClient.debt_policy_fund || 0,
            debt_credit_loan: selectedClient.debt_credit_loan || 0,
            debt_secondary_loan: selectedClient.debt_secondary_loan || 0,
            debt_card_loan: selectedClient.debt_card_loan || 0,
            kcb_score: selectedClient.kcb_score || 0,
            nice_score: selectedClient.nice_score || 0,
            has_technology: selectedClient.has_technology || false,
            business_years: selectedClient.business_years || 0
          }
        })
      });

      if (res.ok) {
        const result = await res.json();
        console.log('🔵 AI 진단 결과:', result);
        setAiDiagnosisResult(result);
      } else {
        alert('AI 진단에 실패했습니다.');
        setShowAIDiagnosis(false);
      }
    } catch (error) {
      console.error('AI 진단 오류:', error);
      alert('AI 진단 중 오류가 발생했습니다.');
      setShowAIDiagnosis(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // 공유 링크 생성
  const handleGenerateShareLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/api/share/client-info?clientId=${selectedClient.id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  // 클립보드에 복사
  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('링크가 복사되었습니다!');
  };

  // 상태 직접 변경 (Notion 스타일)
  const handleQuickStatusChange = async (clientId: number, currentStatus: string) => {
    const statusList = ['접수대기', '접수완료', '진행중', '진행완료', '집행완료', '보완', '반려'];
    const currentIndex = statusList.indexOf(currentStatus || '접수대기');
    const nextStatus = statusList[(currentIndex + 1) % statusList.length];
    
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId,
          status: nextStatus,
          notes: ''
        })
      });

      if (res.ok) {
        fetchData(); // 즉시 새로고침
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // 정책자금 삭제 (관리자용)
  const handleDeleteFundFromClient = async (fundName: string) => {
    if (!selectedClient) return;
    
    if (!confirm(`"${fundName}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/delete-fund-from-client', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          clientId: selectedClient.id,
          fundName 
        })
      });

      const result = await res.json();
      
      if (res.ok) {
        alert(result.message);
        fetchData();
        
        // 모든 정책자금이 삭제된 경우 모달 닫기
        if (result.deleted_all) {
          setShowClientDetail(false);
          setSelectedClient(null);
        } else {
          // 선택된 클라이언트 정보 업데이트
          const updatedFunds = selectedClient.policy_funds.filter((f: string) => f !== fundName);
          setSelectedClient({
            ...selectedClient,
            policy_funds: updatedFunds
          });
        }
      } else {
        alert(result.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting fund:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 재심사 요청 (관리자용)
  const handleRequestReview = async () => {
    if (!selectedClient) return;
    
    if (!confirm(`"${selectedClient.name}" 클라이언트의 재심사를 요청하시겠습니까? 상태가 "접수대기"로 변경됩니다.`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/request-client-review', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId: selectedClient.id })
      });

      const result = await res.json();
      
      if (res.ok) {
        alert(result.message);
        fetchData();
        // 선택된 클라이언트 상태 업데이트
        setSelectedClient({
          ...selectedClient,
          status: '접수대기'
        });
      } else {
        alert(result.error || '재심사 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error requesting review:', error);
      alert('재심사 요청 중 오류가 발생했습니다.');
    }
  };

  // 클라이언트 삭제
  const handleDeleteClient = async (clientId: number, clientName: string) => {
    if (!confirm(`정말로 "${clientName}" 클라이언트와 관련된 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/delete-client', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId })
      });

      const result = await res.json();
      
      if (res.ok) {
        alert(result.message);
        fetchData();
        // 모달이 열려있으면 닫기
        setShowClientDetail(false);
        setSelectedClient(null);
      } else {
        alert(result.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 클라이언트 추가
  const handleAddClient = async () => {
    // 필수 필드 검증
    if (!newClientData.email || !newClientData.password || !newClientData.name || 
        !newClientData.age || !newClientData.annual_revenue || !newClientData.debt ||
        !newClientData.business_years) {
      alert('필수 정보를 모두 입력해주세요.\n(이메일, 비밀번호, 이름, 나이, 연매출, 총부채, 업력)');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClientData.email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 길이 검증
    if (newClientData.password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newClientData,
          age: parseInt(newClientData.age) || 0,
          annual_revenue: parseInt(newClientData.annual_revenue) || 0,
          debt: parseInt(newClientData.debt) || 0,
          debt_policy_fund: parseInt(newClientData.debt_policy_fund) || 0,
          debt_credit_loan: parseInt(newClientData.debt_credit_loan) || 0,
          debt_secondary_loan: parseInt(newClientData.debt_secondary_loan) || 0,
          debt_card_loan: parseInt(newClientData.debt_card_loan) || 0,
          kcb_score: newClientData.kcb_score ? parseInt(newClientData.kcb_score) : null,
          nice_score: parseInt(newClientData.nice_score) || 0,
          business_years: parseInt(newClientData.business_years) || 0
        })
      });

      const result = await res.json();
      
      if (res.ok) {
        alert(result.message);
        setShowAddClientModal(false);
        // 폼 초기화
        setNewClientData({
          email: '',
          password: '',
          name: '',
          age: '',
          gender: '남성',
          annual_revenue: '',
          debt: '',
          debt_policy_fund: '',
          debt_credit_loan: '',
          debt_secondary_loan: '',
          debt_card_loan: '',
          kcb_score: '',
          nice_score: '',
          has_technology: false,
          business_years: ''
        });
        fetchData(); // 목록 새로고침
      } else {
        alert(result.error || '클라이언트 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('클라이언트 등록 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const filteredClients = data.clients.filter((client: any) =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">EMFRONTIER LAB 관리자</h1>
            <p className="text-sm text-gray-300">정책자금 관리 시스템</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddClientModal(true)}
              className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              새 클라이언트
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              QR 스캔
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-sm font-medium text-gray-600">{status}</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{count as number}</div>
            </div>
          ))}
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 클라이언트 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              접수대기 ({filteredClients.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">아직 심사를 진행하지 않은 신청입니다.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SOHO등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KCB점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NICE점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선택 정책자금 <span className="text-blue-600 font-bold">(갯수)</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      아직 신청한 회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                          {client.soho_grade}등급
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 bg-blue-50 text-blue-800 rounded">
                          {client.kcb_score || '-'}점
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 bg-purple-50 text-purple-800 rounded">
                          {client.nice_score}점
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {client.policy_funds && client.policy_funds.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-bold text-sm">
                              {client.policy_funds.length}개
                            </span>
                            <details className="inline">
                              <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                                보기
                              </summary>
                              <div className="mt-2 space-y-1">
                                {client.policy_funds.map((fund: string, idx: number) => (
                                  <div key={idx} className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                    {fund}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">미선택</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleQuickStatusChange(client.id, client.application_status)}
                          className={`px-3 py-2 rounded text-xs font-semibold cursor-pointer hover:shadow-lg transition-all transform hover:scale-105 ${
                            client.application_status === '접수대기' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' :
                            client.application_status === '접수완료' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            client.application_status === '진행중' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                            client.application_status === '진행완료' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                            client.application_status === '집행완료' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                            client.application_status === '보완' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                            client.application_status === '반려' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          title="클릭하여 다음 단계로 이동"
                        >
                          {client.application_status || '접수대기'} →
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowClientDetail(true);
                            }}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            상세보기
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setStatusUpdate({
                                status: client.application_status || '접수대기',
                                notes: ''
                              });
                              setShowStatusModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            상태변경
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상태 업데이트 모달 */}
      {showStatusModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              진행상황 업데이트
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedClient.name}님의 진행상황을 변경합니다
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태 선택
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="접수대기">접수대기</option>
                  <option value="접수완료">접수완료</option>
                  <option value="진행중">진행중</option>
                  <option value="진행완료">진행완료</option>
                  <option value="집행완료">집행완료</option>
                  <option value="보완">보완</option>
                  <option value="반려">반려</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모 (선택사항)
                </label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder="추가 메모를 입력하세요..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                업데이트
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR 스캐너 모달 */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              📷 QR 코드 스캔
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              카메라로 클라이언트의 QR 코드를 스캔하세요
            </p>

            {/* QR 스캐너 영역 */}
            <div className="mb-4">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden border-2 border-blue-500"></div>
              {scannerError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {scannerError}
                </div>
              )}
            </div>

            {/* 수동 입력 옵션 */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                수동으로 QR 데이터 입력
              </summary>
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  QR 데이터 (JSON)
                </label>
                <textarea
                  value={scannedData || ''}
                  onChange={(e) => setScannedData(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  rows={3}
                  placeholder='{"clientId":1,"email":"test@example.com"}'
                />
                <button
                  onClick={handleQRScan}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  수동 입력 확인
                </button>
              </div>
            </details>

            {/* 닫기 버튼 */}
            <button
              onClick={async () => {
                await stopQRScanner();
                setShowQRScanner(false);
                setScannedData(null);
                setScannerError('');
              }}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 회원 상세 정보 모달 */}
      {showClientDetail && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              회원 상세 정보
            </h3>

            {/* 기본 정보 */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">
                📋 기본 정보
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">이름</label>
                  <p className="text-base font-semibold text-gray-900">{selectedClient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">이메일</label>
                  <p className="text-base font-semibold text-gray-900">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">나이</label>
                  <p className="text-base font-semibold text-gray-900">{selectedClient.age}세</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">성별</label>
                  <p className="text-base font-semibold text-gray-900">{selectedClient.gender}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">가입일</label>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(selectedClient.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>

              {/* 신용 등급 및 점수 (한 줄로 표시) */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-3 block">🏆 신용 등급 및 점수</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">SOHO 등급</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg shadow-md">
                      {selectedClient.soho_grade}등급
                    </span>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">KCB</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold text-lg shadow-md">
                      {selectedClient.kcb_score || '-'}점
                    </span>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">NICE</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold text-lg shadow-md">
                      {selectedClient.nice_score}점
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 재무 정보 */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">
                💰 재무 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">연매출</label>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedClient.annual_revenue?.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">총 부채</label>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedClient.debt?.toLocaleString()}원
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">기술력 보유</label>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedClient.has_technology ? '✅ 예' : '❌ 아니오'}
                  </p>
                </div>
              </div>

              {/* 부채 세부 내역 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">기대출 내역</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                    <span className="text-xs text-gray-600">정책자금</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(selectedClient.debt_policy_fund || 0).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                    <span className="text-xs text-gray-600">신용대출</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(selectedClient.debt_credit_loan || 0).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                    <span className="text-xs text-gray-600">2금융권 대출</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(selectedClient.debt_secondary_loan || 0).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                    <span className="text-xs text-gray-600">카드론</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(selectedClient.debt_card_loan || 0).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">기술력 보유</label>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedClient.has_technology ? '✅ 예' : '❌ 아니오'}
                  </p>
                </div>
              </div>
            </div>

            {/* 선택한 정책자금 */}
            {(selectedClient.policy_funds && selectedClient.policy_funds.length > 0) || editingFunds ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h4 className="text-lg font-semibold text-gray-800">
                    💼 진행 중인 정책자금 <span className="text-blue-600">({editingFunds ? editedFunds.length : (selectedClient.policy_funds?.length || 0)}개)</span>
                  </h4>
                  {!editingFunds ? (
                    <button
                      onClick={handleStartEditFunds}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      ✏️ 수정
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEditFunds}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveFunds}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        저장
                      </button>
                    </div>
                  )}
                </div>

                {!editingFunds ? (
                  <div className="space-y-2">
                    {selectedClient.policy_funds?.map((fund: string, idx: number) => (
                      <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow">
                        <span className="font-medium text-gray-800">{fund}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-600 font-semibold">진행중</span>
                          <button
                            onClick={() => handleDeleteFundFromClient(fund)}
                            className="p-1 hover:bg-red-100 rounded-lg transition-colors group"
                            title="이 정책자금 삭제"
                          >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editedFunds.map((fund: string, idx: number) => (
                      <div key={idx} className="p-3 bg-blue-50 border border-blue-300 rounded-lg flex items-center justify-between">
                        <span className="font-medium text-gray-800">{fund}</span>
                        <button
                          onClick={() => handleRemoveFund(idx)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          제거
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFundInput}
                        onChange={(e) => setNewFundInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFund()}
                        placeholder="새 정책자금 이름 입력..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        onClick={handleAddFund}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                선택한 정책자금이 없습니다.
              </div>
            )}

            {/* 자금 금액 설정 */}
            {selectedClient.policy_funds && selectedClient.policy_funds.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h4 className="text-lg font-semibold text-gray-800">
                    💰 자금 금액 설정
                  </h4>
                  <div className="flex gap-2">
                    {/* AI 진단 버튼 */}
                    <button
                      onClick={handleStartAIDiagnosis}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-md"
                    >
                      🤖 AI 진단
                    </button>
                    
                    {!editingFundAmounts ? (
                      <button
                        onClick={handleStartEditFundAmounts}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        💵 금액 입력
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCancelEditFundAmounts}
                          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors font-medium"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveFundAmounts}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          저장
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!editingFundAmounts ? (
                  <div className="space-y-2">
                    {selectedClient.policy_funds.map((fund: string, idx: number) => {
                      const amount = selectedClient.fund_amounts?.[fund] || 0;
                      return (
                        <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">{fund}</span>
                            <span className="text-xl font-bold text-green-700">
                              {amount > 0 ? `${amount.toLocaleString()}원` : '미설정'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">총 금액</span>
                        <span className="text-2xl font-bold text-yellow-700">
                          {Object.values(selectedClient.fund_amounts || {})
                            .reduce((sum: number, val: any) => sum + (val || 0), 0)
                            .toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedClient.policy_funds.map((fund: string, idx: number) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {fund}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={(fundAmounts[fund] || 0).toLocaleString()}
                            onChange={(e) => handleFundAmountChange(fund, e.target.value)}
                            placeholder="금액 입력 (원)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-right"
                          />
                          <span className="text-gray-600 font-medium">원</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">총 금액</span>
                        <span className="text-2xl font-bold text-blue-700">
                          {Object.values(fundAmounts)
                            .reduce((sum: number, val: any) => sum + (val || 0), 0)
                            .toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 클라이언트 공유 링크 */}
            <div className="mb-6">
              <button
                onClick={handleGenerateShareLink}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
              >
                🔗 클라이언트에게 공유할 링크 생성
              </button>
            </div>

            {/* 진행 상태 */}
            {selectedClient.application_status && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">
                  📊 진행 상태
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">현재 상태</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      selectedClient.application_status === '접수대기' ? 'bg-gray-100 text-gray-800' :
                      selectedClient.application_status === '접수완료' ? 'bg-blue-100 text-blue-800' :
                      selectedClient.application_status === '진행중' ? 'bg-yellow-100 text-yellow-800' :
                      selectedClient.application_status === '진행완료' ? 'bg-green-100 text-green-800' :
                      selectedClient.application_status === '집행완료' ? 'bg-purple-100 text-purple-800' :
                      selectedClient.application_status === '보완' ? 'bg-orange-100 text-orange-800' :
                      selectedClient.application_status === '반려' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedClient.application_status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {/* 재심사 버튼 - 반려 또는 보완 상태일 때만 표시 */}
              {selectedClient.application_status && (selectedClient.application_status === '반려' || selectedClient.application_status === '보완') && (
                <button
                  onClick={handleRequestReview}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  재심사 요청하기
                </button>
              )}

              {/* 클라이언트 삭제 버튼 */}
              <button
                onClick={() => handleDeleteClient(selectedClient.id, selectedClient.name)}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                클라이언트 삭제
              </button>

              {/* 닫기 버튼 */}
              <button
                onClick={() => {
                  setShowClientDetail(false);
                  setSelectedClient(null);
                }}
                className="w-full py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공유 링크 모달 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              🔗 클라이언트 정보 공유 링크
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              이 링크를 클라이언트에게 전송하면 진행 상황과 자금 정보를 확인할 수 있습니다.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공유 링크
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                >
                  📋 복사
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">📊 공유 내용</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 이름 및 이메일</li>
                <li>• SOHO 등급</li>
                <li>• 진행 중인 정책자금 목록</li>
                <li>• 각 자금별 금액</li>
                <li>• 신청 상태</li>
              </ul>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* AI 진단 결과 모달 */}
      {showAIDiagnosis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                🤖 AI 정책자금 진단 결과
              </h3>
              <button
                onClick={() => {
                  setShowAIDiagnosis(false);
                  setAiDiagnosisResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingAI ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                <p className="text-gray-600 text-lg">AI가 최적의 정책자금을 분석 중입니다...</p>
              </div>
            ) : aiDiagnosisResult ? (
              <div className="space-y-6">
                {/* SOHO 등급 */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">SOHO 신용등급</p>
                      <p className="text-4xl font-bold text-purple-600">{aiDiagnosisResult.soho_grade || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">최대 대출 한도</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(aiDiagnosisResult.max_loan_limit || 0).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>

                {/* 추천 정책자금 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">💼</span>
                    추천 정책자금 ({aiDiagnosisResult.recommended_funds?.length || 0}개)
                  </h4>
                  
                  {aiDiagnosisResult.recommended_funds && aiDiagnosisResult.recommended_funds.length > 0 ? (
                    <div className="grid gap-3">
                      {aiDiagnosisResult.recommended_funds.map((fund: any, index: number) => {
                        const isAlreadySelected = selectedClient?.policy_funds?.includes(fund.name);
                        
                        return (
                          <div 
                            key={index}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isAlreadySelected 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">
                                    {fund.category === '중진공' ? '🏢' : 
                                     fund.category === '소진공' ? '🏪' : 
                                     fund.category === '신용보증' ? '🛡️' : 
                                     fund.category === '기술보증' ? '🔬' : '💼'}
                                  </span>
                                  <h5 className="font-semibold text-gray-800">{fund.name}</h5>
                                  {isAlreadySelected && (
                                    <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-medium">
                                      ✓ 신청 중
                                    </span>
                                  )}
                                </div>
                                
                                {fund.category && (
                                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium mb-2">
                                    {fund.category}
                                  </span>
                                )}
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>한도:</strong> {fund.max_amount?.toLocaleString() || 'N/A'}원</p>
                                  <p><strong>금리:</strong> {fund.interest_rate || 'N/A'}</p>
                                  {fund.requirements && (
                                    <p><strong>요건:</strong> {fund.requirements}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">추천 가능한 정책자금이 없습니다.</p>
                  )}
                </div>

                {/* 진단 상세 내역 */}
                {aiDiagnosisResult.diagnosis_details && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">📋 진단 상세 내역</h4>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
                      {aiDiagnosisResult.diagnosis_details}
                    </pre>
                  </div>
                )}

                {/* 닫기 버튼 */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowAIDiagnosis(false);
                      setAiDiagnosisResult(null);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-md"
                  >
                    확인
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 새 클라이언트 추가 모달 */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                ➕ 새 클라이언트 등록
              </h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-700 mb-4">📋 기본 정보 (필수)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                      placeholder="example@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호 * (최소 6자)
                    </label>
                    <input
                      type="password"
                      value={newClientData.password}
                      onChange={(e) => setNewClientData({...newClientData, password: e.target.value})}
                      placeholder="비밀번호 입력"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                      placeholder="홍길동"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      나이 *
                    </label>
                    <input
                      type="number"
                      value={newClientData.age}
                      onChange={(e) => setNewClientData({...newClientData, age: e.target.value})}
                      placeholder="35"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      성별 *
                    </label>
                    <select
                      value={newClientData.gender}
                      onChange={(e) => setNewClientData({...newClientData, gender: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="남성">남성</option>
                      <option value="여성">여성</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      업력 (사업 연수) *
                    </label>
                    <input
                      type="number"
                      value={newClientData.business_years}
                      onChange={(e) => setNewClientData({...newClientData, business_years: e.target.value})}
                      placeholder="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 재무 정보 */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-700 mb-4">💰 재무 정보 (필수)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연매출 *
                    </label>
                    <input
                      type="number"
                      value={newClientData.annual_revenue}
                      onChange={(e) => setNewClientData({...newClientData, annual_revenue: e.target.value})}
                      placeholder="200000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      총 부채 *
                    </label>
                    <input
                      type="number"
                      value={newClientData.debt}
                      onChange={(e) => setNewClientData({...newClientData, debt: e.target.value})}
                      placeholder="80000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 기대출 상세 (선택) */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-700 mb-4">📊 기대출 상세 (선택)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      정책자금 대출
                    </label>
                    <input
                      type="number"
                      value={newClientData.debt_policy_fund}
                      onChange={(e) => setNewClientData({...newClientData, debt_policy_fund: e.target.value})}
                      placeholder="30000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      신용대출
                    </label>
                    <input
                      type="number"
                      value={newClientData.debt_credit_loan}
                      onChange={(e) => setNewClientData({...newClientData, debt_credit_loan: e.target.value})}
                      placeholder="40000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2금융권 대출
                    </label>
                    <input
                      type="number"
                      value={newClientData.debt_secondary_loan}
                      onChange={(e) => setNewClientData({...newClientData, debt_secondary_loan: e.target.value})}
                      placeholder="10000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카드론
                    </label>
                    <input
                      type="number"
                      value={newClientData.debt_card_loan}
                      onChange={(e) => setNewClientData({...newClientData, debt_card_loan: e.target.value})}
                      placeholder="5000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 신용 정보 (선택) */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">🏆 신용 정보 (선택)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KCB 점수
                    </label>
                    <input
                      type="number"
                      value={newClientData.kcb_score}
                      onChange={(e) => setNewClientData({...newClientData, kcb_score: e.target.value})}
                      placeholder="750"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NICE 점수
                    </label>
                    <input
                      type="number"
                      value={newClientData.nice_score}
                      onChange={(e) => setNewClientData({...newClientData, nice_score: e.target.value})}
                      placeholder="780"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newClientData.has_technology}
                        onChange={(e) => setNewClientData({...newClientData, has_technology: e.target.checked})}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">기술력 보유</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowAddClientModal(false)}
                className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddClient}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-gray-500 text-sm py-6">
        Copyright © 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved
      </footer>
    </div>
  );
}
