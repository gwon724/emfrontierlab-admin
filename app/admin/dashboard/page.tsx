'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

// 상태 목록 및 스타일 매핑
const STATUS_LIST = ['접수대기', '접수완료', '진행중', '진행완료', '집행완료', '보완', '반려'] as const;
type StatusType = typeof STATUS_LIST[number];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; icon: string }> = {
  '접수대기': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-400', icon: '⏳' },
  '접수완료': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500', icon: '✅' },
  '진행중':   { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500', icon: '🔄' },
  '진행완료': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500', icon: '🎉' },
  '집행완료': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500', icon: '💰' },
  '보완':     { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500', icon: '⚠️' },
  '반려':     { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500', icon: '❌' },
};

function getStatusBadgeClass(status: string) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['접수대기'];
  return `${cfg.bg} ${cfg.text} border ${cfg.border}`;
}

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' | 'md' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['접수대기'];
  const sizeClass = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

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
  const [statusUpdate, setStatusUpdate] = useState({ status: '접수대기', notes: '' });
  const [editingFunds, setEditingFunds] = useState(false);
  const [editedFunds, setEditedFunds] = useState<string[]>([]);
  const [newFundInput, setNewFundInput] = useState('');

  // 정책자금별 개별 상태 관리
  const [fundStatusEdits, setFundStatusEdits] = useState<Record<string, { status: string; notes: string }>>({});
  const [savingFundStatus, setSavingFundStatus] = useState<string | null>(null);
  const [savedFundStatus, setSavedFundStatus] = useState<string | null>(null); // 저장 성공 표시용
  const [showRegisterLinkModal, setShowRegisterLinkModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // 전체 상태 변경 (상세 모달 내)
  const [overallStatusEdit, setOverallStatusEdit] = useState('접수대기');
  const [savingOverallStatus, setSavingOverallStatus] = useState(false);

  // AI 정책자금 분석
  const [showFundEval, setShowFundEval] = useState(false);
  const [fundEvalData, setFundEvalData] = useState<any>(null);
  const [loadingFundEval, setLoadingFundEval] = useState(false);
  const [fundFilter, setFundFilter] = useState<'all'|'eligible'|'ineligible'>('all');

  // AI 기업집중분석
  const [showCompanyAnalysis, setShowCompanyAnalysis] = useState(false);
  const [companyAnalysisData, setCompanyAnalysisData] = useState<any>(null);
  const [loadingCompanyAnalysis, setLoadingCompanyAnalysis] = useState(false);

  const CLIENT_REGISTER_URL = process.env.NEXT_PUBLIC_CLIENT_SITE_URL
    ? `${process.env.NEXT_PUBLIC_CLIENT_SITE_URL}/client/register`
    : 'https://emfrontierlab.vercel.app/client/register';

  const handleCopyRegisterLink = async () => {
    try {
      await navigator.clipboard.writeText(CLIENT_REGISTER_URL);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = CLIENT_REGISTER_URL;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  useEffect(() => {
    fetchData();
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // 열려있는 상세 모달의 클라이언트도 갱신
        if (selectedClient) {
          const updated = json.clients?.find((c: any) => c.id === selectedClient.id);
          if (updated) {
            setSelectedClient(updated);
          }
        }
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, status: statusUpdate.status, notes: statusUpdate.notes })
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

  // 상세 모달 내 전체 상태 저장
  const handleSaveOverallStatus = async () => {
    if (!selectedClient) return;
    const token = localStorage.getItem('adminToken');
    setSavingOverallStatus(true);
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, status: overallStatusEdit, notes: '' })
      });
      if (res.ok) {
        setSelectedClient({ ...selectedClient, application_status: overallStatusEdit });
        fetchData();
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingOverallStatus(false);
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
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await processQRData(decodedText);
          stopQRScanner();
        },
        () => {}
      );
    } catch (error: any) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData, password: '' })
      });
      const resData = await res.json();
      if (res.ok) {
        alert('QR 스캔 성공!');
        setSelectedClient(resData.client);
        setShowQRScanner(false);
        setScannedData(null);
      } else {
        alert(resData.error || 'QR 스캔에 실패했습니다.');
      }
    } catch (error) {
      alert('QR 처리 중 오류가 발생했습니다.');
    }
  };

  const handleQRScan = async () => {
    if (!scannedData) { alert('QR 데이터를 입력해주세요.'); return; }
    await processQRData(scannedData);
  };

  useEffect(() => {
    if (showQRScanner && !isScanning) {
      setTimeout(() => startQRScanner(), 100);
    }
    return () => { if (html5QrCodeRef.current) stopQRScanner(); };
  }, [showQRScanner]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/admin/login');
  };

  const handleStartEditFunds = () => {
    setEditedFunds(selectedClient.policy_funds || []);
    setEditingFunds(true);
  };

  const handleCancelEditFunds = () => {
    setEditingFunds(false);
    setEditedFunds([]);
    setNewFundInput('');
  };

  const handleAddFund = () => {
    if (newFundInput.trim()) {
      setEditedFunds([...editedFunds, newFundInput.trim()]);
      setNewFundInput('');
    }
  };

  const handleRemoveFund = (index: number) => {
    setEditedFunds(editedFunds.filter((_, idx) => idx !== index));
  };

  const handleSaveFunds = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-policy-funds', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, policyFunds: editedFunds })
      });
      if (res.ok) {
        const updatedClient = { ...selectedClient, policy_funds: editedFunds };
        setSelectedClient(updatedClient);
        // 자금 목록이 바뀌었으므로 fundStatusEdits 재초기화
        initFundStatusEdits(updatedClient);
        setEditingFunds(false);
        setNewFundInput('');
        fetchData();
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch (error) {
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 정책자금별 상태 편집 초기화
  const initFundStatusEdits = (client: any) => {
    const funds: string[] = client.policy_funds || [];
    const existing: Record<string, { status: string; notes: string }> = {};
    funds.forEach((fund: string) => {
      const saved = client.fund_statuses?.[fund];
      existing[fund] = { status: saved?.status || '접수대기', notes: saved?.notes || '' };
    });
    setFundStatusEdits(existing);
  };

  // 정책자금 개별 상태 저장
  const handleSaveFundStatus = async (fundName: string) => {
    const token = localStorage.getItem('adminToken');
    const edit = fundStatusEdits[fundName];
    if (!edit) return;

    setSavingFundStatus(fundName);
    try {
      const res = await fetch('/api/admin/update-fund-status', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, fundName, status: edit.status, notes: edit.notes })
      });

      if (res.ok) {
        const updatedFundStatuses = {
          ...selectedClient.fund_statuses,
          [fundName]: { status: edit.status, notes: edit.notes, updated_at: new Date().toISOString() }
        };
        setSelectedClient({ ...selectedClient, fund_statuses: updatedFundStatuses });
        setSavedFundStatus(fundName);
        setTimeout(() => setSavedFundStatus(null), 2000);
        fetchData();
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingFundStatus(null);
    }
  };

  // 클라이언트 상세 열기
  const openClientDetail = (client: any) => {
    setSelectedClient(client);
    initFundStatusEdits(client);
    setOverallStatusEdit(client.application_status || '접수대기');
    setEditingFunds(false);
    setShowClientDetail(true);
  };

  // AI 정책자금 평가
  const handleOpenFundEval = async (client: any) => {
    setSelectedClient(client);
    setShowFundEval(true);
    setFundEvalData(null);
    setLoadingFundEval(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/evaluate-funds', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      });
      const d = await res.json();
      if (res.ok) setFundEvalData(d);
      else alert(d.error || '분석 실패');
    } catch { alert('오류 발생'); }
    finally { setLoadingFundEval(false); }
  };

  // AI 기업집중분석
  const handleOpenCompanyAnalysis = async (client: any) => {
    setSelectedClient(client);
    setShowCompanyAnalysis(true);
    setCompanyAnalysisData(null);
    setLoadingCompanyAnalysis(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/company-analysis', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      });
      const d = await res.json();
      if (res.ok) setCompanyAnalysisData(d);
      else alert(d.error || '분석 실패');
    } catch { alert('오류 발생'); }
    finally { setLoadingCompanyAnalysis(false); }
  };

  // 클라이언트 삭제
  const handleDeleteClient = async (client: any) => {
    if (!confirm(`⚠️ "${client.name}"(${client.email}) 회원을 정말 삭제하시겠습니까?\n\n관련된 모든 데이터(AI 진단, 신청 내역 등)가 영구 삭제됩니다.`)) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/delete-client', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      });
      const d = await res.json();
      if (res.ok) {
        alert(`✅ ${d.message}`);
        setShowClientDetail(false);
        setSelectedClient(null);
        fetchData();
      } else {
        alert(d.error || '삭제 실패');
      }
    } catch { alert('삭제 중 오류가 발생했습니다.'); }
  };

  const handleQuickStatusChange = async (clientId: number, currentStatus: string) => {
    const currentIndex = STATUS_LIST.indexOf(currentStatus as StatusType);
    const nextStatus = STATUS_LIST[(currentIndex + 1) % STATUS_LIST.length];
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, status: nextStatus, notes: '' })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!data) return null;

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
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowRegisterLinkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              가입링크
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
          {Object.entries(data.statusCounts).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className={`bg-white rounded-lg shadow p-4 text-center border-t-4 ${cfg ? `border-${cfg.dot.replace('bg-', '')}` : 'border-gray-400'}`}>
                <div className="text-sm font-medium text-gray-600">{cfg?.icon} {status}</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{count as number}</div>
              </div>
            );
          })}
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">전체 회원 ({filteredClients.length}명)</h2>
              <p className="text-sm text-gray-600 mt-1">정책자금별로 개별 진행상태를 관리합니다.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOHO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신용점수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">
                    📋 정책자금별 진행상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전체상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      아직 신청한 회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold">
                          {client.soho_grade}등급
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-xs">KCB {client.kcb_score || '-'}점</span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded text-xs">NICE {client.nice_score}점</span>
                        </div>
                      </td>
                      {/* 정책자금별 상태 - 핵심 컬럼 */}
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {client.policy_funds && client.policy_funds.length > 0 ? (
                          <div className="space-y-1.5">
                            {client.policy_funds.map((fund: string, idx: number) => {
                              const fs = client.fund_statuses?.[fund];
                              const st = fs?.status || '접수대기';
                              const cfg = STATUS_CONFIG[st] || STATUS_CONFIG['접수대기'];
                              return (
                                <div key={idx} className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                  <span className="text-xs text-gray-700 flex-1 truncate max-w-[120px]" title={fund}>{fund}</span>
                                  <span className={`text-xs font-bold ${cfg.text} flex-shrink-0`}>{st}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">미배정</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleQuickStatusChange(client.id, client.application_status || '접수대기')}
                          className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-opacity hover:opacity-80 ${getStatusBadgeClass(client.application_status || '접수대기')}`}
                          title="클릭하여 다음 상태로 변경"
                        >
                          {client.application_status || '접수대기'}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openClientDetail(client)}
                          className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg hover:bg-gray-900 font-medium transition-colors"
                        >
                          상세 / 상태관리
                        </button>
                        <button
                          onClick={() => handleOpenFundEval(client)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                          🏦 정책자금
                        </button>
                        <button
                          onClick={() => handleOpenCompanyAnalysis(client)}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 font-medium transition-colors"
                        >
                          📊 기업분석
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상태 업데이트 모달 (기존 호환용) */}
      {showStatusModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">진행상황 업데이트</h3>
            <p className="text-sm text-gray-600 mb-4">{selectedClient.name}님의 진행상황을 변경합니다</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태 선택</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택사항)</label>
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
              <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleUpdateStatus} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">업데이트</button>
            </div>
          </div>
        </div>
      )}

      {/* QR 스캐너 모달 */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">📷 QR 코드 스캔</h3>
            <p className="text-sm text-gray-600 mb-4">카메라로 클라이언트의 QR 코드를 스캔하세요</p>
            <div className="mb-4">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden border-2 border-blue-500"></div>
              {scannerError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{scannerError}</div>
              )}
            </div>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">수동으로 QR 데이터 입력</summary>
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium text-gray-700">QR 데이터 (JSON)</label>
                <textarea
                  value={scannedData || ''}
                  onChange={(e) => setScannedData(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  rows={3}
                  placeholder='{"clientId":1,"email":"test@example.com"}'
                />
                <button onClick={handleQRScan} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">수동 입력 확인</button>
              </div>
            </details>
            <button
              onClick={async () => { await stopQRScanner(); setShowQRScanner(false); setScannedData(null); setScannerError(''); }}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ===== 회원 상세 정보 + 정책자금 상태 관리 모달 ===== */}
      {showClientDetail && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto relative" id="client-detail-content">
            
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 rounded-t-2xl print-hide">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedClient.name}님 상세 정보</h3>
                <p className="text-xs text-gray-500 mt-0.5">정책자금별 진행상태를 개별 관리합니다</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-1.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  인쇄
                </button>
                <button
                  onClick={() => { setShowClientDetail(false); setSelectedClient(null); setEditingFunds(false); }}
                  className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm"
                >
                  닫기
                </button>
              </div>
            </div>

            {/* 프린트 전용 헤더 */}
            <div className="hidden print:block px-6 pt-6 mb-4">
              <h3 className="text-2xl font-bold text-gray-800">회원 상세 정보 - {selectedClient.name}</h3>
            </div>

            <div className="p-6 space-y-6">

              {/* ── 기본 정보 ── */}
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-800 text-white rounded flex items-center justify-center text-xs">📋</span>
                  기본 정보
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs text-gray-500">이름</label><p className="font-semibold text-gray-900">{selectedClient.name}</p></div>
                  <div><label className="text-xs text-gray-500">이메일</label><p className="font-semibold text-gray-900 text-sm">{selectedClient.email}</p></div>
                  <div><label className="text-xs text-gray-500">나이</label><p className="font-semibold text-gray-900">{selectedClient.age}세</p></div>
                  <div><label className="text-xs text-gray-500">성별</label><p className="font-semibold text-gray-900">{selectedClient.gender}</p></div>
                  <div><label className="text-xs text-gray-500">사업연수</label><p className="font-semibold text-gray-900">{selectedClient.business_years || '-'}년</p></div>
                  <div><label className="text-xs text-gray-500">가입일</label><p className="font-semibold text-gray-900 text-sm">{new Date(selectedClient.created_at).toLocaleString('ko-KR')}</p></div>
                </div>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">🏆 신용 등급 및 점수</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">SOHO</span>
                      <span className="px-3 py-1 bg-green-600 text-white rounded-lg font-bold text-base shadow">{selectedClient.soho_grade}등급</span>
                    </div>
                    <div className="w-px h-6 bg-gray-300" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">KCB</span>
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-base shadow">{selectedClient.kcb_score || '-'}점</span>
                    </div>
                    <div className="w-px h-6 bg-gray-300" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">NICE</span>
                      <span className="px-3 py-1 bg-purple-600 text-white rounded-lg font-bold text-base shadow">{selectedClient.nice_score}점</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 재무 정보 ── */}
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
                  <span>💰</span> 재무 정보
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs text-gray-500">연매출</label>
                    <p className="font-bold text-gray-900">{selectedClient.annual_revenue?.toLocaleString()}원</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs text-gray-500">총 부채</label>
                    <p className="font-bold text-gray-900">{selectedClient.debt?.toLocaleString()}원</p>
                  </div>
                  <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs text-gray-500">기술력 보유</label>
                    <p className="font-bold text-gray-900">{selectedClient.has_technology ? '✅ 예' : '❌ 아니오'}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-2">기대출 세부 내역</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '정책자금', val: selectedClient.debt_policy_fund },
                      { label: '신용대출', val: selectedClient.debt_credit_loan },
                      { label: '2금융권', val: selectedClient.debt_secondary_loan },
                      { label: '카드론', val: selectedClient.debt_card_loan },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-sm font-medium text-gray-900">{(val || 0).toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 전체 진행상태 ── */}
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
                  <span>🗂️</span> 전체 진행상태
                </h4>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-600">현재 상태:</span>
                    <StatusBadge status={selectedClient.application_status || '접수대기'} size="md" />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={overallStatusEdit}
                      onChange={(e) => setOverallStatusEdit(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      {STATUS_LIST.map(s => {
                        const cfg = STATUS_CONFIG[s];
                        return <option key={s} value={s}>{cfg.icon} {s}</option>;
                      })}
                    </select>
                    <button
                      onClick={handleSaveOverallStatus}
                      disabled={savingOverallStatus}
                      className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${
                        savingOverallStatus ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-900'
                      }`}
                    >
                      {savingOverallStatus ? '저장중...' : '전체상태 저장'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">전체 상태는 모든 자금을 대표하는 요약 상태입니다.</p>
                </div>
              </div>

              {/* ══════════ 정책자금별 개별 진행상태 ══════════ */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span>💼</span>
                    정책자금별 개별 진행상태
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {selectedClient.policy_funds?.length || 0}개
                    </span>
                  </h4>
                  <button
                    onClick={handleStartEditFunds}
                    className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    ✏️ 자금 목록 수정
                  </button>
                </div>

                {/* 자금 목록 편집 모드 */}
                {editingFunds && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl">
                    <p className="text-xs font-bold text-amber-700 mb-3">📝 자금 목록 편집 모드</p>
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {editedFunds.map((fund: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-gray-800">{fund}</span>
                          <button onClick={() => handleRemoveFund(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2">✕</button>
                        </div>
                      ))}
                      {editedFunds.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">자금이 없습니다. 아래에서 추가하세요.</p>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newFundInput}
                        onChange={(e) => setNewFundInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFund()}
                        placeholder="새 정책자금 이름 입력 후 Enter..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button onClick={handleAddFund} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">추가</button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCancelEditFunds} className="flex-1 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">취소</button>
                      <button onClick={handleSaveFunds} className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-semibold">저장</button>
                    </div>
                  </div>
                )}

                {/* 자금별 상태 카드 */}
                {selectedClient.policy_funds && selectedClient.policy_funds.length > 0 ? (
                  <div className="space-y-3">
                    {selectedClient.policy_funds.map((fund: string) => {
                      const edit = fundStatusEdits[fund] || { status: '접수대기', notes: '' };
                      const saved = selectedClient.fund_statuses?.[fund];
                      const isSaving = savingFundStatus === fund;
                      const justSaved = savedFundStatus === fund;
                      const savedStatus = saved?.status || '접수대기';
                      const cfg = STATUS_CONFIG[savedStatus] || STATUS_CONFIG['접수대기'];

                      return (
                        <div key={fund} className={`border-2 rounded-xl overflow-hidden transition-all ${justSaved ? 'border-green-400 shadow-md' : 'border-gray-200'}`}>
                          {/* 자금명 헤더 */}
                          <div className={`flex items-center justify-between px-4 py-3 ${cfg.bg} border-b ${cfg.border}`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                              <span className="font-bold text-gray-800 text-sm">{fund}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {justSaved && (
                                <span className="text-xs text-green-600 font-semibold animate-pulse">✅ 저장됨</span>
                              )}
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                {cfg.icon} {savedStatus}
                              </span>
                            </div>
                          </div>

                          {/* 상태 변경 영역 */}
                          <div className="px-4 py-3 bg-white">
                            {/* 상태 선택 버튼 그룹 */}
                            <div className="mb-3">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">상태 선택</label>
                              <div className="flex flex-wrap gap-1.5">
                                {STATUS_LIST.map((s) => {
                                  const sCfg = STATUS_CONFIG[s];
                                  const isSelected = edit.status === s;
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => setFundStatusEdits(prev => ({ ...prev, [fund]: { ...prev[fund], status: s } }))}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                                        isSelected
                                          ? `${sCfg.bg} ${sCfg.text} ${sCfg.border} shadow-sm scale-105`
                                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                      }`}
                                    >
                                      {sCfg.icon} {s}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 메모 + 저장 */}
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={edit.notes}
                                onChange={(e) => setFundStatusEdits(prev => ({ ...prev, [fund]: { ...prev[fund], notes: e.target.value } }))}
                                placeholder="메모 (예: 서류 검토 중, 보완서류 요청...)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <button
                                onClick={() => handleSaveFundStatus(fund)}
                                disabled={isSaving}
                                className={`px-4 py-2 text-sm rounded-lg font-bold transition-all whitespace-nowrap ${
                                  isSaving
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : justSaved
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-800 text-white hover:bg-gray-900'
                                }`}
                              >
                                {isSaving ? '저장중...' : justSaved ? '✅ 저장됨' : '저장'}
                              </button>
                            </div>

                            {/* 마지막 수정 시각 */}
                            {saved?.updated_at && (
                              <p className="text-xs text-gray-400 mt-2">
                                마지막 수정: {new Date(saved.updated_at).toLocaleString('ko-KR')}
                                {saved.notes && <span className="ml-2 text-gray-500">「{saved.notes}」</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-xl text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm mb-2">배정된 정책자금이 없습니다.</p>
                    <button
                      onClick={handleStartEditFunds}
                      className="text-blue-600 text-sm underline hover:text-blue-800"
                    >
                      + 자금 목록 수정에서 추가하기
                    </button>
                  </div>
                )}
              </div>

            </div>{/* /p-6 space-y-6 */}

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 print-hide rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => handleOpenFundEval(selectedClient)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm"
                >
                  🏦 AI 정책자금 분석
                </button>
                <button
                  onClick={() => handleOpenCompanyAnalysis(selectedClient)}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm"
                >
                  📊 AI 기업집중분석
                </button>
                <button
                  onClick={() => { setShowClientDetail(false); setSelectedClient(null); setEditingFunds(false); }}
                  className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors text-sm"
                >
                  닫기
                </button>
                <button
                  onClick={() => handleDeleteClient(selectedClient)}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 가입링크 모달 */}
      {showRegisterLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">클라이언트 가입링크</h3>
                  <p className="text-green-100 text-sm">링크를 복사해서 고객에게 전달하세요</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">가입링크 안내</p>
                    <p>고객이 아래 링크로 직접 접속해 회원가입을 완료하면, 가입 정보가 자동으로 관리자 DB에 등록됩니다.</p>
                  </div>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">가입 링크 URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={CLIENT_REGISTER_URL}
                    readOnly
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopyRegisterLink}
                    className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                      linkCopied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    {linkCopied ? '✅ 복사완료!' : '링크 복사'}
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">전달 방법</p>
                <div className="space-y-2">
                  {['위 링크를 복사하여 카카오톡·문자로 고객에게 전송', '고객이 링크 접속 후 회원가입 양식 작성 및 제출', '가입 완료 시 이 대시보드에 자동 등록됨'].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
              <a href={CLIENT_REGISTER_URL} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center py-2.5 px-4 border-2 border-green-600 text-green-700 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors mb-3"
              >
                🔗 가입 페이지 미리보기
              </a>
              <button
                onClick={() => { setShowRegisterLinkModal(false); setLinkCopied(false); }}
                className="w-full py-2.5 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI 정책자금 평가 모달 ===== */}
      {showFundEval && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🏦</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI 정책자금 평가</h3>
                  <p className="text-xs text-gray-500">{fundEvalData?.clientName || selectedClient?.name}님 · 조건별 충족 여부 분석</p>
                </div>
              </div>
              <button onClick={() => setShowFundEval(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {loadingFundEval ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">AI가 정책자금 조건을 분석 중...</p>
                </div>
              ) : fundEvalData ? (
                <>
                  {/* 요약 카드 */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">SOHO 등급</p>
                      <p className="text-3xl font-black text-blue-700">{fundEvalData.sohoGrade}</p>
                      <p className="text-xs text-blue-500 mt-1">등급</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                      <p className="text-xs text-green-600 font-semibold mb-1">최대 한도</p>
                      <p className="text-lg font-black text-green-700">{(fundEvalData.maxLoanLimit / 100000000).toFixed(1)}억</p>
                      <p className="text-xs text-green-500 mt-1">{fundEvalData.maxLoanLimit?.toLocaleString()}원</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">추천 자금</p>
                      <p className="text-3xl font-black text-purple-700">{fundEvalData.funds?.filter((f: any) => f.eligible).length}</p>
                      <p className="text-xs text-purple-500 mt-1">/ {fundEvalData.funds?.length}개 분석</p>
                    </div>
                  </div>

                  {/* 필터 탭 */}
                  <div className="flex gap-2 mb-4">
                    {(['all', 'eligible', 'ineligible'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFundFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          fundFilter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {f === 'all' ? `전체 (${fundEvalData.funds?.length})` :
                         f === 'eligible' ? `✅ 충족 (${fundEvalData.funds?.filter((x: any) => x.eligible).length})` :
                         `❌ 미충족 (${fundEvalData.funds?.filter((x: any) => !x.eligible).length})`}
                      </button>
                    ))}
                  </div>

                  {/* 자금별 카드 - 노션 스타일 */}
                  <div className="space-y-3">
                    {fundEvalData.funds
                      ?.filter((fund: any) =>
                        fundFilter === 'all' ? true :
                        fundFilter === 'eligible' ? fund.eligible :
                        !fund.eligible
                      )
                      .map((fund: any, idx: number) => (
                        <div key={idx} className={`border-2 rounded-xl overflow-hidden ${fund.eligible ? 'border-green-300' : 'border-gray-200'}`}>
                          {/* 자금 헤더 */}
                          <div className={`flex items-center justify-between px-4 py-3 ${fund.eligible ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {fund.category?.includes('중진공') ? '🏢' :
                                 fund.category?.includes('소진공') ? '🏪' :
                                 fund.category?.includes('신용보증') ? '🛡️' :
                                 fund.category?.includes('기술보증') ? '🔬' : '💼'}
                              </span>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{fund.name}</p>
                                <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">{fund.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <p className="text-xs text-gray-500">최대 한도</p>
                                <p className={`font-bold text-sm ${fund.eligible ? 'text-green-700' : 'text-gray-500'}`}>
                                  {(fund.max_amount / 100000000).toFixed(1) === '0.0'
                                    ? (fund.max_amount / 10000000).toFixed(0) + '천만'
                                    : (fund.max_amount / 100000000).toFixed(1) + '억'}원
                                </p>
                              </div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                fund.eligible ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {fund.passCount}/{fund.totalCount}
                              </div>
                            </div>
                          </div>

                          {/* 조건 체크 목록 - 노션 테이블 스타일 */}
                          <div className="px-4 py-3 bg-white">
                            <div className="divide-y divide-gray-100">
                              {fund.conditions?.map((cond: any, ci: number) => (
                                <div key={ci} className="flex items-center justify-between py-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                      cond.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                                    }`}>
                                      {cond.passed ? '✓' : '✗'}
                                    </span>
                                    <span className="text-sm text-gray-700 font-medium">{cond.label}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-right">
                                    <div>
                                      <p className="text-xs text-gray-400">기준</p>
                                      <p className="text-xs font-semibold text-gray-600">{cond.required}</p>
                                    </div>
                                    <div className="w-20">
                                      <p className="text-xs text-gray-400">실제값</p>
                                      <p className={`text-xs font-bold ${cond.passed ? 'text-green-600' : 'text-red-500'}`}>{cond.actual}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400 py-8">데이터를 불러오지 못했습니다.</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowFundEval(false)}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI 기업집중분석 모달 ===== */}
      {showCompanyAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI 기업집중분석</h3>
                  <p className="text-xs text-gray-500">{companyAnalysisData?.clientName || selectedClient?.name}님 · 매출·기대출·직원수·업력 종합</p>
                </div>
              </div>
              <button onClick={() => setShowCompanyAnalysis(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {loadingCompanyAnalysis ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">기업 데이터를 종합 분석 중...</p>
                </div>
              ) : companyAnalysisData?.analysis ? (
                (() => {
                  const a = companyAnalysisData.analysis;
                  const gradeColor = (g: string) => {
                    if (g === 'S') return 'text-purple-700 bg-purple-100';
                    if (g === 'A') return 'text-green-700 bg-green-100';
                    if (g === 'B') return 'text-blue-700 bg-blue-100';
                    if (g === 'C') return 'text-yellow-700 bg-yellow-100';
                    return 'text-red-700 bg-red-100';
                  };
                  return (
                    <>
                      {/* 종합 등급 */}
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white text-center mb-6">
                        <p className="text-sm font-medium opacity-80 mb-2">종합 기업 등급</p>
                        <p className="text-6xl font-black mb-2">{a.overallGrade}</p>
                        <p className="text-2xl font-bold opacity-90">{a.overallScore}점</p>
                        <p className="text-sm opacity-75 mt-3">{a.summary}</p>
                      </div>

                      {/* 4개 항목 분석 */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                          { label: '매출 분석', icon: '💰', data: a.revenueLevel },
                          { label: '부채 분석', icon: '📉', data: a.debtLevel },
                          { label: '직원수 분석', icon: '👥', data: a.employeeLevel },
                          { label: '업력 분석', icon: '📅', data: a.businessAgeLevel },
                        ].map(({ label, icon, data }) => (
                          <div key={label} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-gray-700 flex items-center gap-1">{icon} {label}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${gradeColor(data.grade)}`}>
                                {data.grade}등급
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                style={{ width: `${data.score}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-600">{data.comment}</p>
                            {data.ratio !== undefined && (
                              <p className="text-xs text-gray-400 mt-1">부채비율: {data.ratio.toFixed(0)}%</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 강점 */}
                      {a.strengths?.length > 0 && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                          <p className="text-sm font-bold text-green-800 mb-2">✅ 강점</p>
                          <ul className="space-y-1">
                            {a.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                                <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 약점 */}
                      {a.weaknesses?.length > 0 && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm font-bold text-red-800 mb-2">⚠️ 개선 필요</p>
                          <ul className="space-y-1">
                            {a.weaknesses.map((w: string, i: number) => (
                              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 제안 */}
                      {a.suggestions?.length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-sm font-bold text-blue-800 mb-2">💡 전략 제안</p>
                          <ul className="space-y-1">
                            {a.suggestions.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5 flex-shrink-0">{i + 1}.</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <p className="text-center text-gray-400 py-8">데이터를 불러오지 못했습니다.</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowCompanyAnalysis(false)}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors"
              >
                닫기
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
