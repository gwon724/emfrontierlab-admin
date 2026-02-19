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
  const [fundEvalSelected, setFundEvalSelected] = useState<string[]>([]);
  const [registeringFunds, setRegisteringFunds] = useState(false);
  const [registerMode, setRegisterMode] = useState<'add'|'replace'>('add');

  // AI 기업집중분석
  const [showCompanyAnalysis, setShowCompanyAnalysis] = useState(false);
  const [companyAnalysisData, setCompanyAnalysisData] = useState<any>(null);
  const [loadingCompanyAnalysis, setLoadingCompanyAnalysis] = useState(false);

  // 신용점수 편집
  const [editingCredit, setEditingCredit] = useState(false);
  const [editKcb, setEditKcb] = useState('');
  const [editNice, setEditNice] = useState('');
  const [savingCredit, setSavingCredit] = useState(false);

  // AI 정책자금 재분석
  const [reanalyzingFunds, setReanalyzingFunds] = useState(false);

  // 파일 보관함
  const [showFileVault, setShowFileVault] = useState(false);
  const [fileVaultClient, setFileVaultClient] = useState<any>(null);
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 부채정보 수정
  const [showDebtEdit, setShowDebtEdit] = useState(false);
  const [debtForm, setDebtForm] = useState({
    annual_revenue: '', business_years: '',
    debt_policy_fund: '', debt_credit_loan: '',
    debt_secondary_loan: '', debt_card_loan: ''
  });
  const [savingDebt, setSavingDebt] = useState(false);

  // 수동 클라이언트 등록
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [createClientLoading, setCreateClientLoading] = useState(false);
  const [createClientError, setCreateClientError] = useState('');
  const [createClientForm, setCreateClientForm] = useState({
    name: '', email: '', password: '', phone: '',
    age: '', gender: 'M', birth_date: '',
    annual_revenue: '', business_years: '',
    debt_policy_fund: '0', debt_credit_loan: '0',
    debt_secondary_loan: '0', debt_card_loan: '0',
    nice_score: '700', kcb_score: '',
    has_technology: false, industry: '',
    is_manufacturing: false,
  });

  // 계정 관리 (아이디/비밀번호 변경)
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountClient, setAccountClient] = useState<any>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    setFundEvalSelected([]);
    setRegisterMode('add');
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

  // 자금 선택 토글
  const toggleFundEvalSelected = (fundName: string) => {
    setFundEvalSelected(prev =>
      prev.includes(fundName) ? prev.filter(f => f !== fundName) : [...prev, fundName]
    );
  };

  // AI 평가 모달에서 선택된 자금 등록
  const handleRegisterFundsFromEval = async () => {
    if (!selectedClient || fundEvalSelected.length === 0) return;
    const modeLabel = registerMode === 'replace' ? '교체' : '추가';
    if (!confirm(`${selectedClient.name}님에게 ${fundEvalSelected.length}개 자금을 ${modeLabel}하시겠습니까?\n\n${fundEvalSelected.join('\n')}`)) return;
    setRegisteringFunds(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/register-funds-from-eval', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, selectedFunds: fundEvalSelected, mode: registerMode })
      });
      const d = await res.json();
      if (res.ok) {
        alert(`✅ ${d.message}\n\n등록된 자금:\n${d.registeredFunds.join('\n')}`);
        setShowFundEval(false);
        setFundEvalSelected([]);
        fetchData();
      } else {
        alert(d.error || '자금 등록에 실패했습니다.');
      }
    } catch { alert('자금 등록 중 오류가 발생했습니다.'); }
    finally { setRegisteringFunds(false); }
  };

  // 신용점수 수정
  const handleSaveCreditScore = async () => {
    if (!selectedClient) return;
    if (!editKcb && !editNice) { alert('수정할 점수를 입력해주세요.'); return; }
    setSavingCredit(true);
    const token = localStorage.getItem('adminToken');
    try {
      const body: any = { clientId: selectedClient.id };
      if (editKcb) body.kcb_score = parseInt(editKcb);
      if (editNice) body.nice_score = parseInt(editNice);
      const res = await fetch('/api/admin/update-credit-score', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await res.json();
      if (res.ok) {
        setSelectedClient((prev: any) => ({
          ...prev,
          kcb_score: d.kcb_score,
          nice_score: d.nice_score,
          soho_grade: d.soho_grade,
        }));
        setEditingCredit(false);
        setEditKcb('');
        setEditNice('');
        fetchData();
        alert(`✅ 신용점수 업데이트 완료\nKCB: ${d.kcb_score}점 / NICE: ${d.nice_score}점\nSOHO등급 자동 재계산: ${d.soho_grade}등급`);
      } else {
        alert(d.error || '업데이트 실패');
      }
    } catch { alert('오류가 발생했습니다.'); }
    finally { setSavingCredit(false); }
  };

  // AI 정책자금 재분석
  const handleReanalyzeFunds = async (client: any) => {
    setReanalyzingFunds(true);
    setFundEvalSelected([]);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/evaluate-funds', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      });
      const d = await res.json();
      if (res.ok) {
        setFundEvalData(d);
        setShowFundEval(true);
        setFundFilter('all');
      } else alert(d.error || '재분석 실패');
    } catch { alert('오류 발생'); }
    finally { setReanalyzingFunds(false); }
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

  // ── 파일 보관함 ──
  const openFileVault = async (client: any) => {
    setFileVaultClient(client);
    setShowFileVault(true);
    setLoadingFiles(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/upload-file?clientId=${client.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      setClientFiles(d.files || []);
    } catch { setClientFiles([]); }
    finally { setLoadingFiles(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileVaultClient) return;
    setUploadingFile(true);
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', String(fileVaultClient.id));
    try {
      const res = await fetch('/api/admin/upload-file', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const d = await res.json();
      if (res.ok) {
        alert('✅ 파일이 업로드됐습니다.');
        await openFileVault(fileVaultClient);
      } else {
        alert(d.error || '업로드 실패');
      }
    } catch { alert('업로드 중 오류가 발생했습니다.'); }
    finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/delete-file', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      if (res.ok) {
        setClientFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch { alert('삭제 중 오류가 발생했습니다.'); }
  };

  const handleDownloadFile = (fileId: number, fileName: string) => {
    const token = localStorage.getItem('adminToken');
    const a = document.createElement('a');
    a.href = `/api/admin/download-file?fileId=${fileId}`;
    a.download = fileName;
    // Authorization 헤더는 fetch로 처리
    fetch(`/api/admin/download-file?fileId=${fileId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a2 = document.createElement('a');
        a2.href = url;
        a2.download = fileName;
        a2.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('다운로드 중 오류가 발생했습니다.'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };

  // ── 부채정보 수정 ──
  const openDebtEdit = (client: any) => {
    setDebtForm({
      annual_revenue: String(client.annual_revenue || ''),
      business_years: String(client.business_years || ''),
      debt_policy_fund: String(client.debt_policy_fund || ''),
      debt_credit_loan: String(client.debt_credit_loan || ''),
      debt_secondary_loan: String(client.debt_secondary_loan || ''),
      debt_card_loan: String(client.debt_card_loan || '')
    });
    setShowDebtEdit(true);
  };

  const handleSaveDebt = async () => {
    if (!selectedClient) return;
    setSavingDebt(true);
    const token = localStorage.getItem('adminToken');
    const totalDebt =
      (parseInt(debtForm.debt_policy_fund) || 0) +
      (parseInt(debtForm.debt_credit_loan) || 0) +
      (parseInt(debtForm.debt_secondary_loan) || 0) +
      (parseInt(debtForm.debt_card_loan) || 0);
    try {
      const res = await fetch('/api/admin/update-debt', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          annual_revenue: parseInt(debtForm.annual_revenue) || 0,
          business_years: parseInt(debtForm.business_years) || 0,
          total_debt: totalDebt,
          debt_policy_fund: parseInt(debtForm.debt_policy_fund) || 0,
          debt_credit_loan: parseInt(debtForm.debt_credit_loan) || 0,
          debt_secondary_loan: parseInt(debtForm.debt_secondary_loan) || 0,
          debt_card_loan: parseInt(debtForm.debt_card_loan) || 0
        })
      });
      const d = await res.json();
      if (res.ok) {
        setSelectedClient((prev: any) => ({
          ...prev,
          annual_revenue: parseInt(debtForm.annual_revenue) || 0,
          business_years: parseInt(debtForm.business_years) || 0,
          debt: totalDebt,
          debt_policy_fund: parseInt(debtForm.debt_policy_fund) || 0,
          debt_credit_loan: parseInt(debtForm.debt_credit_loan) || 0,
          debt_secondary_loan: parseInt(debtForm.debt_secondary_loan) || 0,
          debt_card_loan: parseInt(debtForm.debt_card_loan) || 0,
          soho_grade: d.soho_grade,
        }));
        setShowDebtEdit(false);
        fetchData();
        alert(`✅ 재무정보가 업데이트됐습니다.\nSOHO등급 자동 재계산: ${d.soho_grade}등급`);
      } else {
        alert(d.error || '저장 실패');
      }
    } catch { alert('저장 중 오류가 발생했습니다.'); }
    finally { setSavingDebt(false); }
  };

  // 계정 관리 모달 열기
  const openAccountModal = (client: any) => {
    setAccountClient(client);
    setNewEmail(client.email || '');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPassword(false);
    setShowAccountModal(true);
  };

  // 이메일(아이디) 변경
  const handleSaveEmail = async () => {
    if (!accountClient) return;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setSavingEmail(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-client-email', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: accountClient.id, email: newEmail })
      });
      const d = await res.json();
      if (res.ok) {
        setAccountClient((prev: any) => ({ ...prev, email: newEmail }));
        if (selectedClient?.id === accountClient.id) {
          setSelectedClient((prev: any) => ({ ...prev, email: newEmail }));
        }
        fetchData();
        alert(`✅ 이메일(아이디)이 변경되었습니다.\n새 아이디: ${newEmail}`);
      } else {
        alert(d.error || '이메일 변경 실패');
      }
    } catch { alert('저장 중 오류가 발생했습니다.'); }
    finally { setSavingEmail(false); }
  };

  // 비밀번호 변경
  const handleSavePassword = async () => {
    if (!accountClient) return;
    if (!newPassword || newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!confirm(`${accountClient.name}님의 비밀번호를 변경하시겠습니까?`)) return;
    setSavingPassword(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/reset-client-password', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: accountClient.id, newPassword })
      });
      const d = await res.json();
      if (res.ok) {
        setNewPassword('');
        setConfirmNewPassword('');
        alert(`✅ 비밀번호가 변경되었습니다.\n클라이언트: ${accountClient.name} (${accountClient.email})`);
      } else {
        alert(d.error || '비밀번호 변경 실패');
      }
    } catch { alert('저장 중 오류가 발생했습니다.'); }
    finally { setSavingPassword(false); }
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
            {/* 로그인된 관리자 이름/연락처 표시 */}
            {(() => {
              try {
                const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
                if (adminData?.name) {
                  return (
                    <div className="hidden md:flex flex-col items-end mr-2">
                      <span className="text-sm font-semibold text-white">👤 {adminData.name}</span>
                      {adminData.phone && (
                        <span className="text-xs text-gray-300">{adminData.phone}</span>
                      )}
                    </div>
                  );
                }
              } catch (e) {}
              return null;
            })()}
            <button
              onClick={() => { setCreateClientForm({ name:'',email:'',password:'',phone:'',age:'',gender:'M',birth_date:'',annual_revenue:'',business_years:'',debt_policy_fund:'0',debt_credit_loan:'0',debt_secondary_loan:'0',debt_card_loan:'0',nice_score:'700',kcb_score:'',has_technology:false,industry:'',is_manufacturing:false }); setCreateClientError(''); setShowCreateClientModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              클라이언트 등록
            </button>
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
                        <div className="flex flex-col gap-1.5 items-end">
                          <div className="flex gap-1.5">
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
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                const url = `/admin/document-editor?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`;
                                window.open(url, '_blank');
                              }}
                              className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 font-medium transition-colors"
                            >
                              📄 서류작성
                            </button>
                            <button
                              onClick={() => openFileVault(client)}
                              className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 font-medium transition-colors"
                            >
                              🗂️ 파일보관함
                            </button>
                            <button
                              onClick={() => openAccountModal(client)}
                              className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-800 font-medium transition-colors"
                            >
                              🔐 계정관리
                            </button>
                          </div>
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
                  <div><label className="text-xs text-gray-500">나이</label>
                    <p className="font-semibold text-gray-900">
                      {selectedClient.birth_date
                        ? (() => {
                            const b = new Date(selectedClient.birth_date);
                            const now = new Date();
                            let a = now.getFullYear() - b.getFullYear();
                            const m = now.getMonth() - b.getMonth();
                            if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
                            return `만 ${a}세`;
                          })()
                        : selectedClient.age ? `${selectedClient.age}세` : '-'}
                      {selectedClient.age && selectedClient.age <= 39 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">청년</span>
                      )}
                    </p>
                  </div>
                  <div><label className="text-xs text-gray-500">성별</label><p className="font-semibold text-gray-900">{selectedClient.gender}</p></div>
                  <div><label className="text-xs text-gray-500">업종</label>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      {selectedClient.industry || (selectedClient.is_manufacturer || selectedClient.is_manufacturing ? '제조업' : '-')}
                      {(selectedClient.is_manufacturer === 1 || selectedClient.is_manufacturing === 1) && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">🏭 제조업</span>
                      )}
                    </p>
                  </div>
                  <div><label className="text-xs text-gray-500">사업연수</label><p className="font-semibold text-gray-900">{selectedClient.business_years || '-'}년</p></div>
                  <div><label className="text-xs text-gray-500">생년월일</label><p className="font-semibold text-gray-900 text-sm">{selectedClient.birth_date || '-'}</p></div>
                  <div><label className="text-xs text-gray-500">가입일</label><p className="font-semibold text-gray-900 text-sm">{new Date(selectedClient.created_at).toLocaleString('ko-KR')}</p></div>
                  {selectedClient.age && selectedClient.age < 39 && (
                    <div className="col-span-2 md:col-span-3">
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-800">
                          🎉 청년창업자금 대상
                          {(selectedClient.is_manufacturing === 1) && selectedClient.age < 39
                            ? ' — 만 39세 미만 + 제조업 → 최대 2억 원, 금리 2.5%'
                            : ' — 만 39세 미만 → 최대 1억 원, 금리 2.5%'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-600">🏆 신용 등급 및 점수</label>
                    <button
                      onClick={() => {
                        setEditingCredit(!editingCredit);
                        setEditKcb(selectedClient.kcb_score?.toString() || '');
                        setEditNice(selectedClient.nice_score?.toString() || '');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${editingCredit ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                      {editingCredit ? '취소' : '✏️ 점수 수정'}
                    </button>
                  </div>

                  {!editingCredit ? (
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
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-orange-600 font-medium mb-2">⚠️ 수정 후 SOHO 등급이 자동 재계산됩니다.</p>
                      <div className="flex gap-2 items-center">
                        <label className="text-xs font-semibold text-blue-700 w-12 flex-shrink-0">KCB</label>
                        <input
                          type="number"
                          value={editKcb}
                          onChange={(e) => setEditKcb(e.target.value)}
                          placeholder={`현재: ${selectedClient.kcb_score || '미입력'}점`}
                          min={0} max={1000}
                          className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-xs text-gray-400">/ 1000점</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="text-xs font-semibold text-purple-700 w-12 flex-shrink-0">NICE</label>
                        <input
                          type="number"
                          value={editNice}
                          onChange={(e) => setEditNice(e.target.value)}
                          placeholder={`현재: ${selectedClient.nice_score || '미입력'}점`}
                          min={0} max={1000}
                          className="flex-1 px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        <span className="text-xs text-gray-400">/ 1000점</span>
                      </div>
                      <button
                        onClick={handleSaveCreditScore}
                        disabled={savingCredit}
                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors mt-1 ${savingCredit ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-900'}`}
                      >
                        {savingCredit ? '저장 중...' : '💾 신용점수 저장 & SOHO 재계산'}
                      </button>
                    </div>
                  )}
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
                    {/* 자금 전체 진행 요약 */}
                    <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {['접수대기','접수완료','진행중','진행완료'].map(s => {
                        const cnt = selectedClient.policy_funds.filter((f: string) =>
                          (selectedClient.fund_statuses?.[f]?.status || '접수대기') === s
                        ).length;
                        const sCfg = STATUS_CONFIG[s];
                        return (
                          <div key={s} className={`text-center p-2 rounded-lg border ${sCfg.bg} ${sCfg.border}`}>
                            <p className={`text-lg font-black ${sCfg.text}`}>{cnt}</p>
                            <p className={`text-xs font-medium ${sCfg.text}`}>{sCfg.icon} {s}</p>
                          </div>
                        );
                      })}
                    </div>

                    {selectedClient.policy_funds.map((fund: string) => {
                      const edit = fundStatusEdits[fund] || { status: '접수대기', notes: '' };
                      const saved = selectedClient.fund_statuses?.[fund];
                      const isSaving = savingFundStatus === fund;
                      const justSaved = savedFundStatus === fund;
                      const savedStatus = saved?.status || '접수대기';
                      const cfg = STATUS_CONFIG[savedStatus] || STATUS_CONFIG['접수대기'];
                      const editCfg = STATUS_CONFIG[edit.status] || STATUS_CONFIG['접수대기'];

                      // 정상 흐름 스텝바
                      const STEPS = ['접수대기','접수완료','진행중','진행완료','집행완료'];
                      const stepIdx = STEPS.indexOf(savedStatus);
                      const isSpecial = savedStatus === '보완' || savedStatus === '반려';

                      return (
                        <div key={fund} className={`border-2 rounded-xl overflow-hidden transition-all shadow-sm ${
                          justSaved ? 'border-green-400 shadow-md' :
                          savedStatus === '집행완료' ? 'border-purple-300' :
                          savedStatus === '진행완료' ? 'border-green-300' :
                          savedStatus === '진행중' ? 'border-yellow-300' :
                          savedStatus === '반려' ? 'border-red-300' :
                          savedStatus === '보완' ? 'border-orange-300' :
                          'border-gray-200'
                        }`}>
                          {/* 자금명 헤더 */}
                          <div className={`flex items-center justify-between px-4 py-3 ${cfg.bg} border-b ${cfg.border}`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`flex-shrink-0 w-3 h-3 rounded-full ${cfg.dot}`} />
                              <span className="font-bold text-gray-800 text-sm truncate">{fund}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {justSaved && (
                                <span className="text-xs text-green-600 font-semibold animate-pulse">✅ 저장됨</span>
                              )}
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                {cfg.icon} {savedStatus}
                              </span>
                            </div>
                          </div>

                          {/* 미니 스텝바 (정상 흐름만) */}
                          {!isSpecial && (
                            <div className="px-4 pt-2.5 pb-1 bg-white border-b border-gray-100">
                              <div className="flex items-center justify-between relative">
                                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" style={{zIndex:0}} />
                                <div
                                  className="absolute top-3 left-0 h-0.5 bg-blue-400 transition-all duration-500"
                                  style={{ width: stepIdx >= 0 ? `${(stepIdx / (STEPS.length - 1)) * 100}%` : '0%', zIndex:1 }}
                                />
                                {STEPS.map((s, i) => {
                                  const sDone = i < stepIdx;
                                  const sCur = i === stepIdx;
                                  return (
                                    <div key={s} className="flex flex-col items-center" style={{zIndex:2}}>
                                      <div
                                        onClick={() => setFundStatusEdits(prev => ({ ...prev, [fund]: { ...prev[fund], status: s } }))}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border-2 transition-all ${
                                          sCur ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow' :
                                          sDone ? 'bg-blue-100 text-blue-600 border-blue-300' :
                                          'bg-white text-gray-400 border-gray-300 hover:border-blue-300'
                                        }`}
                                        title={`${s}로 변경`}
                                      >
                                        {sDone ? '✓' : i + 1}
                                      </div>
                                      <span className={`text-xs mt-0.5 leading-tight text-center ${sCur ? 'text-blue-700 font-bold' : 'text-gray-400'}`} style={{fontSize:'8px', maxWidth:'40px'}}>
                                        {s}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 상태 변경 영역 */}
                          <div className="px-4 py-3 bg-white">
                            {/* 상태 선택 버튼 그룹 */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">상태 변경</label>
                                {edit.status !== savedStatus && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${editCfg.bg} ${editCfg.text} font-semibold`}>
                                    → {edit.status}
                                  </span>
                                )}
                              </div>
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

                            {/* 빠른 다음 단계 버튼 */}
                            {!isSpecial && stepIdx < STEPS.length - 1 && (
                              <div className="mb-3">
                                <button
                                  onClick={async () => {
                                    const nextStatus = STEPS[stepIdx + 1];
                                    setFundStatusEdits(prev => ({ ...prev, [fund]: { ...prev[fund], status: nextStatus } }));
                                    // 즉시 저장
                                    setSavingFundStatus(fund);
                                    const token = localStorage.getItem('adminToken');
                                    try {
                                      const res = await fetch('/api/admin/update-fund-status', {
                                        method: 'PUT',
                                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ clientId: selectedClient.id, fundName: fund, status: nextStatus, notes: fundStatusEdits[fund]?.notes || '' })
                                      });
                                      if (res.ok) {
                                        setSavedFundStatus(fund);
                                        const updatedFundStatuses = { ...selectedClient.fund_statuses, [fund]: { status: nextStatus, notes: fundStatusEdits[fund]?.notes || '', updated_at: new Date().toISOString() } };
                                        setSelectedClient({ ...selectedClient, fund_statuses: updatedFundStatuses });
                                        setTimeout(() => setSavedFundStatus(null), 2000);
                                        fetchData();
                                      }
                                    } catch {}
                                    finally { setSavingFundStatus(null); }
                                  }}
                                  className="w-full py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                                >
                                  ⚡ 다음 단계로: {STEPS[stepIdx + 1]} →
                                </button>
                              </div>
                            )}

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

                            {/* 마지막 수정 시각 + 메모 */}
                            {saved?.updated_at && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <span>🕐 {new Date(saved.updated_at).toLocaleString('ko-KR')}</span>
                                {saved.notes && <span className="text-gray-500 ml-1">「{saved.notes}」</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-xl text-center border-2 border-dashed border-gray-200">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-gray-500 font-semibold mb-2">배정된 정책자금이 없습니다.</p>
                    <p className="text-gray-400 text-sm mb-3">AI 정책자금 평가를 통해 적합한 자금을 추천받고 등록하세요.</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button
                        onClick={() => { setShowClientDetail(false); handleOpenFundEval(selectedClient); }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        🏦 AI 정책자금 평가
                      </button>
                      <button
                        onClick={handleStartEditFunds}
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 font-semibold"
                      >
                        ✏️ 직접 추가
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>{/* /p-6 space-y-6 */}

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 print-hide rounded-b-2xl">
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => handleReanalyzeFunds(selectedClient)}
                  disabled={reanalyzingFunds}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-colors text-sm min-w-[120px] ${reanalyzingFunds ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {reanalyzingFunds ? '⏳ 분석중...' : '🔄 AI 정책자금 재분석'}
                </button>
                <button
                  onClick={() => handleOpenCompanyAnalysis(selectedClient)}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm min-w-[120px]"
                >
                  📊 AI 기업집중분석
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => {
                    const url = `/admin/document-editor?clientId=${selectedClient.id}&clientName=${encodeURIComponent(selectedClient.name)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors text-sm"
                >
                  📄 서류 작성
                </button>
                <button
                  onClick={() => openFileVault(selectedClient)}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors text-sm"
                >
                  🗂️ 파일 보관함
                </button>
                <button
                  onClick={() => openDebtEdit(selectedClient)}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors text-sm"
                >
                  💳 재무정보 수정
                </button>
                <button
                  onClick={() => openAccountModal(selectedClient)}
                  className="flex-1 py-2.5 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors text-sm"
                >
                  🔐 계정 관리
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowClientDetail(false); setSelectedClient(null); setEditingFunds(false); setEditingCredit(false); }}
                  className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors text-sm"
                >
                  닫기
                </button>
                <button
                  onClick={() => handleDeleteClient(selectedClient)}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 수동 클라이언트 등록 모달 ===== */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">클라이언트 직접 등록</h3>
                    <p className="text-indigo-100 text-sm">관리자가 직접 클라이언트 정보를 입력합니다</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateClientModal(false)} className="text-white hover:text-indigo-200 text-2xl font-bold">×</button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {createClientError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">⚠️ {createClientError}</div>
              )}

              {/* 기본 정보 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 pb-1 border-b">기본 정보</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">이름 *</label>
                    <input type="text" value={createClientForm.name}
                      onChange={e => setCreateClientForm(p => ({...p, name: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">연락처</label>
                    <input type="tel" value={createClientForm.phone}
                      onChange={e => setCreateClientForm(p => ({...p, phone: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="010-1234-5678" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">이메일 *</label>
                    <input type="email" value={createClientForm.email}
                      onChange={e => setCreateClientForm(p => ({...p, email: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="client@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">비밀번호 *</label>
                    <input type="password" value={createClientForm.password}
                      onChange={e => setCreateClientForm(p => ({...p, password: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="최소 6자" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">생년월일</label>
                    <input type="date" value={createClientForm.birth_date}
                      onChange={e => {
                        const bd = e.target.value;
                        let age = '';
                        if (bd) {
                          const today = new Date();
                          const birth = new Date(bd);
                          let a = today.getFullYear() - birth.getFullYear();
                          const m = today.getMonth() - birth.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
                          age = String(a);
                        }
                        setCreateClientForm(p => ({...p, birth_date: bd, age}));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">만 나이</label>
                    <input type="number" value={createClientForm.age}
                      onChange={e => setCreateClientForm(p => ({...p, age: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="예: 35" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">성별 *</label>
                    <select value={createClientForm.gender}
                      onChange={e => setCreateClientForm(p => ({...p, gender: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="M">남성</option>
                      <option value="F">여성</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">업종</label>
                    <input type="text" value={createClientForm.industry}
                      onChange={e => setCreateClientForm(p => ({...p, industry: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="예: 제조업, IT, 식품" />
                  </div>
                </div>
                <div className="flex gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={createClientForm.has_technology}
                      onChange={e => setCreateClientForm(p => ({...p, has_technology: e.target.checked}))}
                      className="w-4 h-4 rounded" />
                    <span className="text-gray-700">기술 보유</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={createClientForm.is_manufacturing}
                      onChange={e => setCreateClientForm(p => ({...p, is_manufacturing: e.target.checked}))}
                      className="w-4 h-4 rounded" />
                    <span className="text-gray-700">제조업</span>
                  </label>
                </div>
              </div>

              {/* 재무 정보 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 pb-1 border-b">재무 정보</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">연매출 (원) *</label>
                    <input type="number" value={createClientForm.annual_revenue}
                      onChange={e => setCreateClientForm(p => ({...p, annual_revenue: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="100000000" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">업력 (년) *</label>
                    <input type="number" value={createClientForm.business_years}
                      onChange={e => setCreateClientForm(p => ({...p, business_years: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="3" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">정책자금 부채 (원)</label>
                    <input type="number" value={createClientForm.debt_policy_fund}
                      onChange={e => setCreateClientForm(p => ({...p, debt_policy_fund: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">신용대출 부채 (원)</label>
                    <input type="number" value={createClientForm.debt_credit_loan}
                      onChange={e => setCreateClientForm(p => ({...p, debt_credit_loan: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">2금융 부채 (원)</label>
                    <input type="number" value={createClientForm.debt_secondary_loan}
                      onChange={e => setCreateClientForm(p => ({...p, debt_secondary_loan: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">카드론 부채 (원)</label>
                    <input type="number" value={createClientForm.debt_card_loan}
                      onChange={e => setCreateClientForm(p => ({...p, debt_card_loan: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* 신용점수 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 pb-1 border-b">신용점수</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">NICE 신용점수 *</label>
                    <input type="number" value={createClientForm.nice_score}
                      onChange={e => setCreateClientForm(p => ({...p, nice_score: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="700" min="0" max="1000" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">KCB 신용점수</label>
                    <input type="number" value={createClientForm.kcb_score}
                      onChange={e => setCreateClientForm(p => ({...p, kcb_score: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="700" min="0" max="1000" />
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateClientModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  disabled={createClientLoading}
                  onClick={async () => {
                    setCreateClientError('');
                    const f = createClientForm;
                    if (!f.name.trim()) { setCreateClientError('이름을 입력해주세요.'); return; }
                    if (!f.email || !f.email.includes('@')) { setCreateClientError('올바른 이메일을 입력해주세요.'); return; }
                    if (!f.password || f.password.length < 6) { setCreateClientError('비밀번호는 최소 6자 이상이어야 합니다.'); return; }
                    if (!f.age) { setCreateClientError('나이를 입력해주세요.'); return; }
                    if (!f.annual_revenue) { setCreateClientError('연매출을 입력해주세요.'); return; }
                    if (f.business_years === '') { setCreateClientError('업력을 입력해주세요.'); return; }
                    if (!f.nice_score) { setCreateClientError('NICE 신용점수를 입력해주세요.'); return; }
                    setCreateClientLoading(true);
                    try {
                      const token = localStorage.getItem('adminToken');
                      const totalDebt = (parseInt(f.debt_policy_fund)||0) + (parseInt(f.debt_credit_loan)||0) + (parseInt(f.debt_secondary_loan)||0) + (parseInt(f.debt_card_loan)||0);
                      const res = await fetch('/api/admin/create-client', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          name: f.name.trim(), email: f.email, password: f.password,
                          phone: f.phone || null, age: parseInt(f.age)||0,
                          gender: f.gender, birth_date: f.birth_date || null,
                          annual_revenue: parseInt(f.annual_revenue)||0,
                          debt: totalDebt,
                          debt_policy_fund: parseInt(f.debt_policy_fund)||0,
                          debt_credit_loan: parseInt(f.debt_credit_loan)||0,
                          debt_secondary_loan: parseInt(f.debt_secondary_loan)||0,
                          debt_card_loan: parseInt(f.debt_card_loan)||0,
                          nice_score: parseInt(f.nice_score)||700,
                          kcb_score: f.kcb_score ? parseInt(f.kcb_score) : null,
                          has_technology: f.has_technology,
                          business_years: parseInt(f.business_years)||0,
                          industry: f.industry || null,
                          is_manufacturing: f.is_manufacturing,
                        }),
                      });
                      const result = await res.json();
                      if (res.ok) {
                        alert(`✅ 클라이언트 "${f.name}" 님이 등록되었습니다.`);
                        setShowCreateClientModal(false);
                        fetchData();
                      } else {
                        setCreateClientError(result.error || '등록 실패');
                      }
                    } catch (err) {
                      setCreateClientError('서버 오류가 발생했습니다.');
                    } finally {
                      setCreateClientLoading(false);
                    }
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {createClientLoading ? '등록 중...' : '클라이언트 등록'}
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
              <button onClick={() => { setShowFundEval(false); setFundEvalSelected([]); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                  <div className="grid grid-cols-3 gap-4 mb-5">
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

                  {/* 관리자 등록 안내 배너 */}
                  <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2">
                    <span className="text-indigo-500 text-lg mt-0.5">👆</span>
                    <div>
                      <p className="text-xs font-bold text-indigo-800">조건 충족 자금을 선택하여 클라이언트에게 등록할 수 있습니다.</p>
                      <p className="text-xs text-indigo-600 mt-0.5">✅ 충족된 자금 카드를 클릭하여 선택 → 하단 등록 모드 선택 후 등록하세요.</p>
                    </div>
                  </div>

                  {/* 필터 탭 + 전체 선택 */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {(['all', 'eligible', 'ineligible'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFundFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          fundFilter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {f === 'all' ? `전체 (${fundEvalData.funds?.length})` :
                         f === 'eligible' ? `✅ 충족 (${fundEvalData.funds?.filter((x: any) => x.eligible).length})` :
                         `❌ 미충족 (${fundEvalData.funds?.filter((x: any) => !x.eligible).length})`}
                      </button>
                    ))}
                    {fundEvalData.funds?.some((f: any) => f.eligible) && (
                      <button
                        onClick={() => {
                          const eligibleNames = fundEvalData.funds.filter((f: any) => f.eligible).map((f: any) => f.name);
                          const allSelected = eligibleNames.every((n: string) => fundEvalSelected.includes(n));
                          setFundEvalSelected(allSelected ? [] : eligibleNames);
                        }}
                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                      >
                        {fundEvalData.funds.filter((f: any) => f.eligible).every((f: any) => fundEvalSelected.includes(f.name))
                          ? '선택 전체 해제' : '✅ 충족 전체 선택'}
                      </button>
                    )}
                  </div>

                  {/* 자금별 카드 */}
                  <div className="space-y-3">
                    {fundEvalData.funds
                      ?.filter((fund: any) =>
                        fundFilter === 'all' ? true :
                        fundFilter === 'eligible' ? fund.eligible :
                        !fund.eligible
                      )
                      .map((fund: any, idx: number) => {
                        const isSelected = fundEvalSelected.includes(fund.name);
                        const canSelect = fund.eligible;
                        return (
                          <div
                            key={idx}
                            onClick={() => canSelect && toggleFundEvalSelected(fund.name)}
                            className={`border-2 rounded-xl overflow-hidden transition-all ${
                              canSelect ? 'cursor-pointer' : ''
                            } ${
                              isSelected
                                ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                                : fund.eligible
                                ? 'border-green-300 hover:border-green-400'
                                : 'border-gray-200'
                            }`}
                          >
                            {/* 자금 헤더 */}
                            <div className={`flex items-center justify-between px-4 py-3 ${
                              isSelected ? 'bg-blue-50' : fund.eligible ? 'bg-green-50' : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center gap-2">
                                {/* 체크박스 (충족 자금만) */}
                                {canSelect && (
                                  <div
                                    onClick={(e) => { e.stopPropagation(); toggleFundEvalSelected(fund.name); }}
                                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                )}
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
                                  isSelected ? 'bg-blue-500 text-white' :
                                  fund.eligible ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                  {fund.passCount}/{fund.totalCount}
                                </div>
                              </div>
                            </div>

                            {/* 조건 체크 목록 */}
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
                              {fund.eligible && (
                                <div className={`mt-2 px-3 py-2 rounded-lg border ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                                }`}>
                                  <p className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-green-700'}`}>
                                    {isSelected ? '✅ 선택됨 — 등록 가능' : '✅ 모든 조건 충족'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* 선택된 자금 + 등록 모드 선택 */}
                  {fundEvalSelected.length > 0 && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <p className="text-sm font-bold text-indigo-800 mb-2">
                        📋 선택된 자금: {fundEvalSelected.length}개
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {fundEvalSelected.map(name => (
                          <span
                            key={name}
                            onClick={() => toggleFundEvalSelected(name)}
                            className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium cursor-pointer hover:bg-red-500 transition-colors"
                            title="클릭하여 제거"
                          >
                            {name} ✕
                          </span>
                        ))}
                      </div>
                      {/* 등록 모드 선택 */}
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="registerMode"
                            value="add"
                            checked={registerMode === 'add'}
                            onChange={() => setRegisterMode('add')}
                            className="text-indigo-600"
                          />
                          <span className="text-xs font-medium text-gray-700">기존에 추가</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="registerMode"
                            value="replace"
                            checked={registerMode === 'replace'}
                            onChange={() => setRegisterMode('replace')}
                            className="text-red-600"
                          />
                          <span className="text-xs font-medium text-red-700">기존 교체</span>
                        </label>
                        <p className="text-xs text-gray-500 ml-1 self-center">
                          {registerMode === 'add' ? '(기존 자금에 추가)' : '(기존 자금 모두 교체)'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-400 py-8">데이터를 불러오지 못했습니다.</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex gap-3 flex-wrap">
                {/* 등록 버튼 (선택된 자금 있을 때) */}
                {fundEvalSelected.length > 0 && (
                  <button
                    onClick={handleRegisterFundsFromEval}
                    disabled={registeringFunds}
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors text-sm min-w-[160px] ${
                      registeringFunds
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : registerMode === 'replace'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {registeringFunds ? '등록 중...' : `${registerMode === 'replace' ? '🔄 교체 등록' : '➕ 추가 등록'} (${fundEvalSelected.length}개)`}
                  </button>
                )}
                <button
                  onClick={() => setShowFundEval(false)}
                  className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI 기업집중분석 모달 (상세 보고서 + PDF/프린트) ===== */}
      {showCompanyAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col">

            {/* 헤더 (화면용) */}
            <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI 기업집중분석 보고서</h3>
                  <p className="text-xs text-gray-500">{companyAnalysisData?.clientName || selectedClient?.name} · {companyAnalysisData?.analysis?.reportDate}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {companyAnalysisData?.analysis && (
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    PDF/인쇄
                  </button>
                )}
                <button onClick={() => setShowCompanyAnalysis(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 스크롤 콘텐츠 */}
            <div className="flex-1 overflow-y-auto" id="company-analysis-print">
              {loadingCompanyAnalysis ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-14 h-14 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-600 font-semibold">AI가 기업 데이터를 종합 분석 중입니다...</p>
                  <p className="text-gray-400 text-sm mt-1">매출 · 부채 · 신용 · 직원수 · 업력 5개 지표 분석</p>
                </div>
              ) : companyAnalysisData?.analysis ? (
                (() => {
                  const a = companyAnalysisData.analysis;
                  const clientName = companyAnalysisData.clientName || selectedClient?.name || '';
                  const gradeColor = (g: string) => {
                    if (g === 'S') return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', bar: 'from-purple-500 to-purple-600' };
                    if (g === 'A') return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', bar: 'from-green-500 to-green-600' };
                    if (g === 'B') return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', bar: 'from-blue-500 to-blue-600' };
                    if (g === 'C') return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', bar: 'from-yellow-500 to-yellow-600' };
                    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', bar: 'from-red-400 to-red-500' };
                  };
                  const gc = gradeColor(a.overallGrade);

                  return (
                    <div className="p-6 space-y-6">

                      {/* ── 프린트 헤더 (인쇄 시만 표시) ── */}
                      <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-800">
                        <h1 className="text-2xl font-black text-gray-900">AI 기업집중분석 보고서</h1>
                        <p className="text-sm text-gray-600 mt-1">대상: {clientName} · 작성일: {a.reportDate} · EMFRONTIER LAB</p>
                      </div>

                      {/* ── 종합 등급 배너 ── */}
                      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium opacity-75 mb-1">종합 기업 신용·성장 등급</p>
                            <div className="flex items-baseline gap-3">
                              <span className="text-7xl font-black leading-none">{a.overallGrade}</span>
                              <span className="text-3xl font-bold opacity-90">{a.overallScore}점</span>
                            </div>
                            <p className="text-sm opacity-75 mt-2">{a.summary}</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs opacity-60 mb-1">평가 기준</p>
                            {[
                              ['매출', '30%'], ['부채비율', '25%'], ['신용도', '20%'],
                              ['업력', '15%'], ['직원수', '10%'],
                            ].map(([k, v]) => (
                              <div key={k} className="flex gap-2 justify-end text-xs opacity-80">
                                <span>{k}</span><span className="font-bold">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── 개요 텍스트 ── */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 bg-gray-800 text-white rounded flex items-center justify-center text-xs">①</span>
                          보고서 개요 및 분석 요약
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{a.executiveSummary}</p>
                      </div>

                      {/* ── 5개 지표 상세 분석 ── */}
                      <div>
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 bg-gray-800 text-white rounded flex items-center justify-center text-xs">②</span>
                          5개 핵심 지표 상세 분석
                        </h4>
                        <div className="space-y-4">
                          {[
                            { label: '매출 분석', icon: '💰', weight: '30%', data: a.revenueLevel },
                            { label: '부채(기대출) 분석', icon: '📉', weight: '25%', data: a.debtLevel },
                            { label: '신용도 분석', icon: '⭐', weight: '20%', data: a.creditLevel },
                            { label: '업력 분석', icon: '📅', weight: '15%', data: a.businessAgeLevel },
                            { label: '직원수 분석', icon: '👥', weight: '10%', data: a.employeeLevel },
                          ].map(({ label, icon, weight, data }) => {
                            const c = gradeColor(data.grade);
                            return (
                              <div key={label} className={`border-2 ${c.border} rounded-xl overflow-hidden`}>
                                <div className={`${c.bg} px-4 py-3 flex items-center justify-between`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{icon}</span>
                                    <span className={`font-bold text-sm ${c.text}`}>{label}</span>
                                    <span className="text-xs text-gray-400">(가중치 {weight})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${c.bg} ${c.text} border ${c.border}`}>{data.grade}등급</span>
                                    <span className="text-xs font-bold text-gray-600">{data.score}점</span>
                                  </div>
                                </div>
                                <div className="bg-white px-4 py-3">
                                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                                    <div className={`h-2.5 rounded-full bg-gradient-to-r ${c.bar}`} style={{ width: `${data.score}%` }} />
                                  </div>
                                  <p className="text-xs font-semibold text-gray-500 mb-1">{data.comment}</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{data.detail}</p>
                                  {data.ratio !== undefined && data.ratio > 0 && (
                                    <p className="text-xs text-gray-400 mt-2 font-medium">※ 부채비율: {data.ratio.toFixed(1)}%</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── 리스크 분석 ── */}
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                        <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 bg-orange-600 text-white rounded flex items-center justify-center text-xs">③</span>
                          리스크 분석
                        </h4>
                        <ul className="space-y-2">
                          {a.riskAnalysis?.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-orange-700 leading-relaxed">{r}</li>
                          ))}
                        </ul>
                      </div>

                      {/* ── 강점 / 약점 ── */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center text-xs">④</span>
                            강점 (Strengths)
                          </h4>
                          {a.strengths?.length > 0 ? (
                            <ul className="space-y-2">
                              {a.strengths.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-green-700 flex items-start gap-2 leading-relaxed">
                                  <span className="text-green-500 mt-0.5 flex-shrink-0 font-bold">✓</span>{s}
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-gray-400">분석된 강점이 없습니다.</p>}
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 bg-red-600 text-white rounded flex items-center justify-center text-xs">⑤</span>
                            약점 (Weaknesses)
                          </h4>
                          {a.weaknesses?.length > 0 ? (
                            <ul className="space-y-2">
                              {a.weaknesses.map((w: string, i: number) => (
                                <li key={i} className="text-sm text-red-700 flex items-start gap-2 leading-relaxed">
                                  <span className="text-red-500 mt-0.5 flex-shrink-0 font-bold">✗</span>{w}
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-gray-400">분석된 약점이 없습니다.</p>}
                        </div>
                      </div>

                      {/* ── 전략 제안 ── */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs">⑥</span>
                          전략 제안 (Action Items)
                        </h4>
                        <ul className="space-y-2">
                          {a.suggestions?.map((s: string, i: number) => (
                            <li key={i} className="text-sm text-blue-700 leading-relaxed">{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* ── 정책자금 활용 전략 ── */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                        <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-xs">⑦</span>
                          정책자금 활용 전략 로드맵
                        </h4>
                        <p className="text-sm text-indigo-700 leading-relaxed whitespace-pre-line">{a.fundingStrategy}</p>
                      </div>

                      {/* ── 프린트 푸터 ── */}
                      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
                        본 보고서는 EMFRONTIER LAB AI 분석 시스템이 {a.reportDate}에 자동 생성한 참고용 자료입니다. 실제 금융 상담은 전문 기관을 통해 진행하시기 바랍니다.
                      </div>

                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-gray-400 text-base">데이터를 불러오지 못했습니다.</p>
                  <button
                    onClick={() => selectedClient && handleOpenCompanyAnalysis(selectedClient)}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 rounded-b-2xl print:hidden">
              <div className="flex gap-3">
                {companyAnalysisData?.analysis && (
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    PDF 저장 / 인쇄
                  </button>
                )}
                <button
                  onClick={() => setShowCompanyAnalysis(false)}
                  className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 파일 보관함 모달 ===== */}
      {showFileVault && fileVaultClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-xl">🗂️</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">파일 보관함</h3>
                  <p className="text-xs text-gray-500">{fileVaultClient.name}님 서류 파일 관리</p>
                </div>
              </div>
              <button onClick={() => setShowFileVault(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 업로드 영역 */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-orange-50">
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="*/*" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className={`w-full py-3 border-2 border-dashed rounded-xl font-semibold text-sm transition-all ${
                  uploadingFile
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-orange-400 text-orange-600 hover:bg-orange-100 bg-white cursor-pointer'
                }`}
              >
                {uploadingFile ? '⏳ 업로드 중...' : '📎 파일 선택하여 업로드 (모든 형식 지원)'}
              </button>
            </div>

            {/* 파일 목록 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : clientFiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">📂</p>
                  <p className="text-gray-400 text-sm">업로드된 파일이 없습니다.</p>
                  <p className="text-gray-300 text-xs mt-1">위 버튼으로 파일을 업로드하세요.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientFiles.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">
                          {file.fileType?.startsWith('image/') ? '🖼️' :
                           file.fileType?.includes('pdf') ? '📕' :
                           file.fileType?.includes('word') || file.fileType?.includes('document') ? '📝' :
                           file.fileType?.includes('sheet') || file.fileType?.includes('excel') ? '📊' :
                           '📄'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{file.originalName}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(file.fileSize)} · {new Date(file.uploadedAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleDownloadFile(file.id, file.originalName)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium"
                        >
                          ⬇️ 다운
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 font-medium"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setShowFileVault(false)}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 재무정보 수정 모달 ===== */}
      {showDebtEdit && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl">💳</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">재무정보 수정</h3>
                  <p className="text-xs text-gray-500">{selectedClient.name}님 · 수정 후 SOHO등급 자동 재계산</p>
                </div>
              </div>
              <button onClick={() => setShowDebtEdit(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-xs text-indigo-700 font-semibold">⚠️ 수정 시 부채 합계가 자동 계산되고 SOHO 등급이 재산정됩니다.</p>
              </div>

              {/* 기본 재무 */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">📈 기본 재무 정보</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">연매출 (원)</label>
                    <input
                      type="number"
                      value={debtForm.annual_revenue}
                      onChange={e => setDebtForm(p => ({ ...p, annual_revenue: e.target.value }))}
                      placeholder={`현재: ${(selectedClient.annual_revenue || 0).toLocaleString()}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">사업 연수 (년)</label>
                    <input
                      type="number"
                      value={debtForm.business_years}
                      onChange={e => setDebtForm(p => ({ ...p, business_years: e.target.value }))}
                      placeholder={`현재: ${selectedClient.business_years || 0}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 기대출 내역 */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">📉 기대출 내역 (원)</p>
                <div className="space-y-3">
                  {[
                    { key: 'debt_policy_fund', label: '정책자금 대출', current: selectedClient.debt_policy_fund },
                    { key: 'debt_credit_loan', label: '신용대출', current: selectedClient.debt_credit_loan },
                    { key: 'debt_secondary_loan', label: '2금융권 대출', current: selectedClient.debt_secondary_loan },
                    { key: 'debt_card_loan', label: '카드론', current: selectedClient.debt_card_loan },
                  ].map(({ key, label, current }) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-28 flex-shrink-0 font-medium">{label}</label>
                      <input
                        type="number"
                        value={debtForm[key as keyof typeof debtForm]}
                        onChange={e => setDebtForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={`현재: ${(current || 0).toLocaleString()}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600">부채 합계 (자동계산)</span>
                    <span className="text-base font-black text-indigo-700">
                      {(
                        (parseInt(debtForm.debt_policy_fund) || 0) +
                        (parseInt(debtForm.debt_credit_loan) || 0) +
                        (parseInt(debtForm.debt_secondary_loan) || 0) +
                        (parseInt(debtForm.debt_card_loan) || 0)
                      ).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowDebtEdit(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveDebt}
                disabled={savingDebt}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                  savingDebt ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {savingDebt ? '저장 중...' : '💾 저장 & SOHO 재계산'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 계정 관리 모달 (아이디/비밀번호 변경) ===== */}
      {showAccountModal && accountClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-700 to-gray-800 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-xl">🔐</div>
                <div>
                  <h3 className="text-lg font-bold text-white">계정 관리</h3>
                  <p className="text-xs text-gray-300">{accountClient.name} · 아이디/비밀번호 변경</p>
                </div>
              </div>
              <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* 현재 계정 정보 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold text-blue-700 mb-2">📋 현재 계정 정보</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">이름</span>
                    <span className="text-sm font-semibold text-gray-800">{accountClient.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">현재 아이디(이메일)</span>
                    <span className="text-sm font-semibold text-blue-700">{accountClient.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">가입일</span>
                    <span className="text-sm text-gray-600">{new Date(accountClient.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>

              {/* 아이디(이메일) 변경 */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">@</span>
                  아이디(이메일) 변경
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="새 이메일 입력"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleSaveEmail}
                    disabled={savingEmail || newEmail === accountClient.email}
                    className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${
                      savingEmail || newEmail === accountClient.email
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {savingEmail ? '저장중...' : '변경'}
                  </button>
                </div>
                {newEmail !== accountClient.email && newEmail && (
                  <p className="text-xs text-orange-600 mt-1">⚠️ 변경 시 클라이언트는 새 이메일로 로그인해야 합니다.</p>
                )}
              </div>

              {/* 비밀번호 변경 */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">🔑</span>
                  비밀번호 변경
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="새 비밀번호 (최소 6자)"
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="비밀번호 확인"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 outline-none ${
                      confirmNewPassword && newPassword !== confirmNewPassword
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-gray-500'
                    }`}
                  />
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-xs text-red-500">❌ 비밀번호가 일치하지 않습니다.</p>
                  )}
                  {confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 6 && (
                    <p className="text-xs text-green-600">✅ 비밀번호가 일치합니다.</p>
                  )}
                  <button
                    onClick={handleSavePassword}
                    disabled={savingPassword || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 6}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${
                      savingPassword || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 6
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    {savingPassword ? '변경 중...' : '🔑 비밀번호 변경'}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setShowAccountModal(false)}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
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
