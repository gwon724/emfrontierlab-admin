'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import ClientInfoReport from '../../../client_info_report';

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
  const [editingDebt, setEditingDebt] = useState(false);
  const [debtData, setDebtData] = useState({
    total_debt: 0,
    debt_policy_fund: 0,
    debt_credit_loan: 0,
    debt_secondary_loan: 0,
    debt_card_loan: 0
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
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
  
  // 한도 조회 관련 state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitData, setLimitData] = useState<any>(null);
  const [loadingLimit, setLoadingLimit] = useState(false);
  
  // 파일 첨부 관련 state
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 알림톡 발송 관련 state
  const [showAlimtalkModal, setShowAlimtalkModal] = useState(false);
  const [sendingAlimtalk, setSendingAlimtalk] = useState(false);
  const [alimtalkType, setAlimtalkType] = useState('application_received');
  const [alimtalkParams, setAlimtalkParams] = useState({
    amount: '',
    approvedAmount: '',
    supplementContent: '',
    deadline: '',
    rejectionReason: ''
  });

  // AI 분석 보고서 관련 state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // 전화번호 수정 관련 state
  const [editingClientPhone, setEditingClientPhone] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState('');

  // 이메일 수정 관련 state
  const [editingClientEmail, setEditingClientEmail] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');

  // 재무제표 AI 분석 관련 state
  const [showFinancialAnalysis, setShowFinancialAnalysis] = useState(false);
  const [financialData, setFinancialData] = useState([
    { year: '2023', revenue: 0, operatingProfit: 0, netProfit: 0, totalAssets: 0, totalLiabilities: 0, equity: 0 },
    { year: '2022', revenue: 0, operatingProfit: 0, netProfit: 0, totalAssets: 0, totalLiabilities: 0, equity: 0 },
    { year: '2021', revenue: 0, operatingProfit: 0, netProfit: 0, totalAssets: 0, totalLiabilities: 0, equity: 0 },
  ]);
  const [showFinancialResult, setShowFinancialResult] = useState(false);
  const [financialResult, setFinancialResult] = useState<any>(null);
  const [loadingFinancialAnalysis, setLoadingFinancialAnalysis] = useState(false);

  // 비밀번호 재설정 관련 state
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 고객정보 보고서 관련 state
  const [showClientInfoReport, setShowClientInfoReport] = useState(false);

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
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        setShowClientDetail(true);
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

  // 최대 한도 조회
  const handleCalculateLimit = async (clientId: number) => {
    setLoadingLimit(true);
    setShowLimitModal(true);
    setLimitData(null);

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/calculate-limit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId })
      });

      if (res.ok) {
        const data = await res.json();
        setLimitData(data);
      } else {
        alert('한도 조회에 실패했습니다.');
        setShowLimitModal(false);
      }
    } catch (error) {
      console.error('Error calculating limit:', error);
      alert('한도 조회 중 오류가 발생했습니다.');
      setShowLimitModal(false);
    } finally {
      setLoadingLimit(false);
    }
  };

  // 파일 목록 조회
  const fetchClientFiles = async (clientId: number) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/upload-file?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setClientFiles(data.files || []);
      }
    } catch (error) {
      console.error('파일 목록 조회 오류:', error);
    }
  };

  // 파일 업로드
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClient) return;

    setUploadingFile(true);
    const token = localStorage.getItem('adminToken');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', selectedClient.id.toString());

      const res = await fetch('/api/admin/upload-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert('파일이 업로드되었습니다.');
        fetchClientFiles(selectedClient.id);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const data = await res.json();
        alert(data.error || '파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingFile(false);
    }
  };

  // 파일 삭제
  const handleFileDelete = async (fileId: number) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/delete-file', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId })
      });

      if (res.ok) {
        alert('파일이 삭제되었습니다.');
        fetchClientFiles(selectedClient!.id);
      } else {
        alert('파일 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  // 파일 다운로드
  const handleFileDownload = async (fileId: number, originalName: string) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/download-file?fileId=${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('파일 다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 부채 정보 수정 시작
  const handleStartEditDebt = () => {
    setDebtData({
      total_debt: selectedClient.total_debt || 0,
      debt_policy_fund: selectedClient.debt_policy_fund || 0,
      debt_credit_loan: selectedClient.debt_credit_loan || 0,
      debt_secondary_loan: selectedClient.debt_secondary_loan || 0,
      debt_card_loan: selectedClient.debt_card_loan || 0
    });
    setEditingDebt(true);
  };

  // 부채 정보 수정 취소
  const handleCancelEditDebt = () => {
    setEditingDebt(false);
  };

  // 부채 정보 저장
  const handleSaveDebt = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-debt', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          ...debtData
        })
      });

      if (res.ok) {
        alert('부채 정보가 업데이트되었습니다.');
        setEditingDebt(false);
        fetchData();
        
        // 선택된 클라이언트 정보도 업데이트
        setSelectedClient({
          ...selectedClient,
          ...debtData
        });
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating debt:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 공유 링크 생성
  const handleGenerateShareLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/share/${selectedClient.id}`;
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

  // 재무제표 데이터 변경 핸들러
  const handleFinancialDataChange = (yearIndex: number, field: string, value: string) => {
    const newData = [...financialData];
    newData[yearIndex] = {
      ...newData[yearIndex],
      [field]: parseInt(value) || 0
    };
    setFinancialData(newData);
  };

  // 재무제표 AI 분석 실행
  const handleFinancialAnalysis = async () => {
    if (!selectedClient) {
      alert('클라이언트를 선택해주세요.');
      return;
    }

    // 데이터 검증
    const hasData = financialData.some(year => 
      year.revenue > 0 || year.operatingProfit > 0 || year.netProfit > 0
    );
    
    if (!hasData) {
      alert('최소 한 개년의 재무 데이터를 입력해주세요.');
      return;
    }

    if (!confirm('입력하신 재무제표를 기반으로 AI 분석을 진행하시겠습니까?')) {
      return;
    }

    setLoadingFinancialAnalysis(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch('/api/admin/financial-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          clientId: selectedClient.id,
          financialData 
        })
      });

      const result = await res.json();
      
      if (res.ok && result.success) {
        setFinancialResult(result.analysis);
        setShowFinancialResult(true);
        setShowFinancialAnalysis(false);
        fetchData(); // 데이터 새로고침
      } else {
        alert(result.error || '재무제표 분석에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error analyzing financial statements:', error);
      alert('재무제표 분석 중 오류가 발생했습니다.');
    } finally {
      setLoadingFinancialAnalysis(false);
    }
  };

  // 클라이언트 전화번호 수정
  const handleUpdateClientPhone = async () => {
    if (!selectedClient) {
      alert('클라이언트를 선택해주세요.');
      return;
    }

    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!newClientPhone || !phoneRegex.test(newClientPhone.replace(/-/g, ''))) {
      alert('올바른 전화번호 형식으로 입력해주세요. (예: 010-1234-5678)');
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-client-phone', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          clientId: selectedClient.id,
          phone: newClientPhone 
        })
      });

      if (res.ok) {
        alert('전화번호가 변경되었습니다.');
        setEditingClientPhone(false);
        setNewClientPhone('');
        fetchData(); // 데이터 새로고침
        // selectedClient 업데이트
        setSelectedClient({
          ...selectedClient,
          phone: newClientPhone
        });
      } else {
        const data = await res.json();
        alert(data.error || '전화번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating phone:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 클라이언트 이메일 수정
  const handleUpdateClientEmail = async () => {
    if (!selectedClient) {
      alert('클라이언트를 선택해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newClientEmail || !emailRegex.test(newClientEmail)) {
      alert('올바른 이메일 형식으로 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/update-client-email', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          clientId: selectedClient.id,
          email: newClientEmail 
        })
      });

      const result = await res.json();

      if (res.ok) {
        alert('이메일이 변경되었습니다.');
        setEditingClientEmail(false);
        setNewClientEmail('');
        fetchData(); // 데이터 새로고침
        // selectedClient 업데이트
        setSelectedClient({
          ...selectedClient,
          email: newClientEmail
        });
      } else {
        alert(result.error || '이메일 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 클라이언트 비밀번호 재설정
  const handleResetClientPassword = async () => {
    if (!selectedClient) {
      alert('클라이언트를 선택해주세요.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!confirm(`정말로 "${selectedClient.name}" 클라이언트의 비밀번호를 재설정하시겠습니까?`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/reset-client-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          clientId: selectedClient.id,
          newPassword: newPassword
        })
      });

      const result = await res.json();

      if (res.ok) {
        alert('비밀번호가 재설정되었습니다.');
        setShowPasswordResetModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(result.error || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 알림톡 발송
  const handleSendAlimtalk = async () => {
    if (!selectedClient) {
      alert('클라이언트를 선택해주세요.');
      return;
    }

    if (!selectedClient.phone) {
      alert('해당 클라이언트의 전화번호가 등록되지 않았습니다.\n전화번호를 먼저 등록해주세요.');
      return;
    }

    // 필수 파라미터 검증
    if (alimtalkType === 'application_received' && !alimtalkParams.amount) {
      alert('신청금액을 입력해주세요.');
      return;
    }
    if (alimtalkType === 'approved' && !alimtalkParams.approvedAmount) {
      alert('승인금액을 입력해주세요.');
      return;
    }
    if (alimtalkType === 'supplement' && (!alimtalkParams.supplementContent || !alimtalkParams.deadline)) {
      alert('보완 내용과 제출 기한을 입력해주세요.');
      return;
    }
    if (alimtalkType === 'rejected' && !alimtalkParams.rejectionReason) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    setSendingAlimtalk(true);

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/send-alimtalk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          messageType: alimtalkType,
          customParams: alimtalkParams
        })
      });

      const result = await res.json();
      
      if (res.ok) {
        alert(`✅ ${result.message}\n\n수신자: ${selectedClient.name} (${selectedClient.phone})`);
        setShowAlimtalkModal(false);
        // 파라미터 초기화
        setAlimtalkParams({
          amount: '',
          approvedAmount: '',
          supplementContent: '',
          deadline: '',
          rejectionReason: ''
        });
      } else {
        alert(`❌ ${result.message || result.error || '알림톡 전송에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('Error sending alimtalk:', error);
      alert('알림톡 전송 중 오류가 발생했습니다.');
    } finally {
      setSendingAlimtalk(false);
    }
  };

  // AI 분석 보고서 생성
  const handleGenerateReport = async () => {
    if (!selectedClient) {
      alert('클라이언트를 선택해주세요.');
      return;
    }

    setLoadingReport(true);
    setShowReportModal(true);

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/generate-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id
        })
      });

      const result = await res.json();
      
      if (res.ok) {
        setReportData(result.report);
      } else {
        alert(`보고서 생성 실패: ${result.error || '알 수 없는 오류'}`);
        setShowReportModal(false);
      }
    } catch (error) {
      console.error('보고서 생성 오류:', error);
      alert('보고서 생성 중 오류가 발생했습니다.');
      setShowReportModal(false);
    } finally {
      setLoadingReport(false);
    }
  };

  // QR 코드 생성 (보고서용 - 화면 및 프린트)
  useEffect(() => {
    if (showReportModal && selectedClient && !loadingReport) {
      const shareUrl = `${window.location.origin}/app/share/${selectedClient.id}`;
      
      // 화면용 QR 코드 (헤더)
      const canvas = document.getElementById(`qr-canvas-${selectedClient.id}`) as HTMLCanvasElement;
      if (canvas) {
        QRCode.toCanvas(canvas, shareUrl, {
          width: 96,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).catch(err => console.error('QR 생성 오류:', err));
      }
      
      // 프린트용 QR 코드 (각 페이지 헤더)
      const printCanvas = document.getElementById(`qr-canvas-print-${selectedClient.id}`) as HTMLCanvasElement;
      if (printCanvas) {
        QRCode.toCanvas(printCanvas, shareUrl, {
          width: 60,  // 프린트용 작은 크기
          margin: 0,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).catch(err => console.error('프린트 QR 생성 오류:', err));
      }
    }
  }, [showReportModal, selectedClient, loadingReport]);

  // PDF 다운로드 핸들러
  const handleDownloadPDF = () => {
    if (!selectedClient) return;
    
    // 프린트 CSS 스타일 적용 후 프린트 대화상자 열기
    window.print();
    
    // 또는 HTML to PDF 라이브러리 사용 가능 (예: jspdf, html2pdf)
    // 여기서는 간단히 브라우저 프린트 기능 사용
    // 사용자가 "PDF로 저장" 옵션 선택 가능
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
          phone: '',
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
              className="px-4 py-2 bg-black rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              새 클라이언트
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-2 bg-black rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              QR 스캔
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-black rounded-lg hover:bg-gray-700 transition-colors"
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
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
                            <span className="px-3 py-1 bg-gray-800 text-white rounded-full font-bold text-sm">
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
                              fetchClientFiles(client.id);
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
                className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
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
                  className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
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
              className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
                  <label className="text-sm font-medium text-gray-600 mb-1 block">이메일 (로그인 ID)</label>
                  {editingClientEmail ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none text-sm"
                        placeholder="example@email.com"
                      />
                      <button
                        onClick={handleUpdateClientEmail}
                        className="px-4 py-2 bg-black text-white hover:bg-gray-700 transition-all text-sm font-medium"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditingClientEmail(false);
                          setNewClientEmail('');
                        }}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">{selectedClient.email}</p>
                      <button
                        onClick={() => {
                          setEditingClientEmail(true);
                          setNewClientEmail(selectedClient.email);
                        }}
                        className="px-3 py-1 bg-black text-white rounded text-xs font-medium hover:bg-gray-700 transition-all"
                      >
                        수정
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">전화번호</label>
                  {editingClientPhone ? (
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                        placeholder="010-1234-5678"
                      />
                      <button
                        onClick={handleUpdateClientPhone}
                        className="px-4 py-2 bg-black text-white hover:bg-gray-700 transition-all text-sm font-medium"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditingClientPhone(false);
                          setNewClientPhone('');
                        }}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">{selectedClient.phone || '미등록'}</p>
                      <button
                        onClick={() => {
                          setEditingClientPhone(true);
                          setNewClientPhone(selectedClient.phone || '');
                        }}
                        className="px-3 py-1 bg-black text-white rounded text-xs font-medium hover:bg-gray-700 transition-all"
                      >
                        수정
                      </button>
                    </div>
                  )}
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
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">로그인 비밀번호</label>
                  <button
                    onClick={() => {
                      setShowPasswordResetModal(true);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 bg-black text-white hover:bg-gray-700 transition-all text-sm font-medium"
                  >
                    🔑 비밀번호 재설정
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    클라이언트의 비밀번호를 새로 설정할 수 있습니다
                  </p>
                </div>
              </div>

              {/* 신용 등급 및 점수 (한 줄로 표시) */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-3 block">🏆 신용 등급 및 점수</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">SOHO 등급</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-bold text-lg shadow-md">
                      {selectedClient.soho_grade}등급
                    </span>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">KCB</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-bold text-lg shadow-md">
                      {selectedClient.kcb_score || '-'}점
                    </span>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">NICE</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-bold text-lg shadow-md">
                      {selectedClient.nice_score}점
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 재무 정보 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                <h4 className="text-lg font-semibold text-gray-800">
                  💰 재무 정보
                </h4>
                {!editingDebt ? (
                  <button
                    onClick={handleStartEditDebt}
                    className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    ✏️ 수정
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEditDebt}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveDebt}
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      저장
                    </button>
                  </div>
                )}
              </div>

              {!editingDebt ? (
                <>
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
                        {(selectedClient.total_debt || 0).toLocaleString()}원
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
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연매출 (수정 불가)
                    </label>
                    <input
                      type="text"
                      value={selectedClient.annual_revenue?.toLocaleString()}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      총 부채 *
                    </label>
                    <input
                      type="number"
                      value={debtData.total_debt}
                      onChange={(e) => setDebtData({...debtData, total_debt: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        정책자금 대출
                      </label>
                      <input
                        type="number"
                        value={debtData.debt_policy_fund}
                        onChange={(e) => setDebtData({...debtData, debt_policy_fund: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        신용 대출
                      </label>
                      <input
                        type="number"
                        value={debtData.debt_credit_loan}
                        onChange={(e) => setDebtData({...debtData, debt_credit_loan: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2금융권 대출
                      </label>
                      <input
                        type="number"
                        value={debtData.debt_secondary_loan}
                        onChange={(e) => setDebtData({...debtData, debt_secondary_loan: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        카드론
                      </label>
                      <input
                        type="number"
                        value={debtData.debt_card_loan}
                        onChange={(e) => setDebtData({...debtData, debt_card_loan: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                    <div className="flex gap-2">
                      <button
                        onClick={handleStartEditFunds}
                        className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={handleStartEditFunds}
                        className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md"
                      >
                        ➕ 수동 추가
                      </button>
                    </div>
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
                        className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500 mb-3">선택한 정책자금이 없습니다.</p>
                  <button
                    onClick={handleStartEditFunds}
                    className="px-6 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md"
                  >
                    ➕ 정책자금 수동 추가
                  </button>
                </div>
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
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md"
                    >
                      🤖 AI 진단
                    </button>

                    {/* 재무제표 AI 분석 버튼 */}
                    <button
                      onClick={() => setShowFinancialAnalysis(true)}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md"
                    >
                      📈 재무제표 AI 분석
                    </button>
                    
                    {!editingFundAmounts ? (
                      <button
                        onClick={handleStartEditFundAmounts}
                        className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
                          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
                        <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-green-200 rounded-lg">
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
                className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-lg"
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
                  className="w-full py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  재심사 요청하기
                </button>
              )}

              {/* 파일 첨부 섹션 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h4 className="text-lg font-semibold text-gray-800">
                    📎 첨부 파일 ({clientFiles.length}개)
                  </h4>
                  <label className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer">
                    📤 파일 업로드
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadingFile && (
                  <div className="text-center py-4 text-gray-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    업로드 중...
                  </div>
                )}

                {clientFiles.length > 0 ? (
                  <div className="space-y-2">
                    {clientFiles.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-2xl">
                            {file.fileType?.includes('pdf') ? '📄' :
                             file.fileType?.includes('image') ? '🖼️' :
                             file.fileType?.includes('word') || file.fileType?.includes('document') ? '📝' :
                             file.fileType?.includes('excel') || file.fileType?.includes('spreadsheet') ? '📊' :
                             '📁'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.originalName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.fileSize / 1024).toFixed(1)} KB · {new Date(file.uploadedAt).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFileDownload(file.id, file.originalName)}
                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="다운로드"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleFileDelete(file.id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !uploadingFile && (
                  <div className="text-center py-8 text-gray-500">
                    첨부된 파일이 없습니다
                  </div>
                )}
              </div>

              {/* 한도 조회 및 문서 편집 버튼 */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCalculateLimit(selectedClient.id)}
                  className="py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  💰 한도 조회
                </button>
                <button
                  onClick={() => router.push(`/admin/document-editor/${selectedClient.id}`)}
                  className="py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  📝 문서 편집
                </button>
              </div>

              {/* 📊 AI 분석 보고서 버튼 */}
              <button
                onClick={handleGenerateReport}
                className="w-full py-3 px-4 bg-black text-white hover:bg-gray-700 transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                📊 AI 분석 보고서
              </button>

              {/* 📄 고객정보 보고서 버튼 */}
              <button
                onClick={() => setShowClientInfoReport(true)}
                className="w-full py-3 px-4 bg-black text-white hover:bg-gray-700 transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                📄 고객정보 보고서
              </button>

              {/* 📱 카카오 알림톡 발송 버튼 */}
              <button
                onClick={() => setShowAlimtalkModal(true)}
                className="w-full py-3 px-4 bg-black text-white rounded-lg font-bold hover:bg-gray-700 transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 5.58 2 10c0 2.5 1.37 4.77 3.5 6.36V22l5.5-3.29c.98.19 2.03.29 3 .29 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
                📱 카카오 알림톡 발송
              </button>

              {/* 클라이언트 삭제 버튼 */}
              <button
                onClick={() => handleDeleteClient(selectedClient.id, selectedClient.name)}
                className="w-full py-2 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
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
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold whitespace-nowrap"
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
              className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
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
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-purple-200">
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
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md"
                  >
                    확인
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 한도 조회 모달 */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              💰 최대 대출 한도 조회
            </h3>
            
            {loadingLimit ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <div className="text-lg text-gray-600">한도 계산 중...</div>
              </div>
            ) : limitData ? (
              <div>
                {/* 기본 정보 */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">고객명:</span>
                      <span className="ml-2 font-medium">{limitData.clientName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">SOHO 등급:</span>
                      <span className="ml-2 font-bold text-blue-600">{limitData.sohoGrade}등급</span>
                    </div>
                    <div>
                      <span className="text-gray-600">신용점수(NICE):</span>
                      <span className="ml-2 font-medium">{limitData.clientInfo?.niceScore || 0}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">연매출:</span>
                      <span className="ml-2 font-medium">{(limitData.clientInfo?.annualRevenue || 0).toLocaleString()}원</span>
                    </div>
                    <div>
                      <span className="text-gray-600">총부채:</span>
                      <span className="ml-2 font-medium">{(limitData.clientInfo?.debt || 0).toLocaleString()}원</span>
                    </div>
                    <div>
                      <span className="text-gray-600">기술력:</span>
                      <span className="ml-2 font-medium">{limitData.clientInfo?.hasTechnology ? '보유' : '미보유'}</span>
                    </div>
                  </div>
                </div>

                {/* 전체 최대 한도 */}
                <div className="mb-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-green-300">
                  <h4 className="font-bold text-xl mb-2 text-green-800">전체 최대 대출 가능 한도</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {(limitData.maxLoanLimit || 0).toLocaleString()}원
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    신용점수, 매출, 부채비율, 기술력을 종합 분석한 결과입니다.
                  </p>
                </div>

                {/* 정책자금별 세부 한도 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3">정책자금별 세부 한도</h4>
                  <div className="space-y-3">
                    {limitData.fundLimits && limitData.fundLimits.length > 0 ? (
                      limitData.fundLimits.map((fund: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-semibold text-gray-800">{fund.fundName}</h5>
                              <p className="text-xs text-gray-500">{fund.category}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                최대 {(fund.maxLimit || 0).toLocaleString()}원
                              </div>
                              <div className="text-xs text-gray-500">
                                금리 {fund.interestRate || 'N/A'}% | {fund.repaymentPeriod || 'N/A'}개월
                              </div>
                            </div>
                          </div>
                          {fund.eligibility && (
                            <p className="text-xs text-gray-600 mt-2">
                              <span className="font-medium">대상:</span> {fund.eligibility}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                        <p className="text-yellow-800">
                          현재 신청 가능한 정책자금이 없습니다. 신용점수 또는 자격 요건을 확인해주세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600">
                한도 정보를 불러오지 못했습니다.
              </div>
            )}

            <button
              onClick={() => {
                setShowLimitModal(false);
                setLimitData(null);
              }}
              className="w-full mt-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
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
                      전화번호 (선택)
                    </label>
                    <input
                      type="tel"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                      placeholder="010-1234-5678"
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
                className="flex-1 py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 카카오 알림톡 발송 모달 */}
      {showAlimtalkModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 5.58 2 10c0 2.5 1.37 4.77 3.5 6.36V22l5.5-3.29c.98.19 2.03.29 3 .29 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                  </svg>
                  <div>
                    <h2 className="text-2xl font-bold text-white">카카오 알림톡 발송</h2>
                    <p className="text-sm text-gray-200 mt-1">
                      수신자: {selectedClient.name} ({selectedClient.phone || '전화번호 없음'})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAlimtalkModal(false)}
                  className="text-white hover:text-gray-300 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 전화번호 없음 경고 */}
              {!selectedClient.phone && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 font-semibold">
                      전화번호가 등록되지 않았습니다. 알림톡을 발송할 수 없습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* 메시지 타입 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  알림 유형 선택 *
                </label>
                <select
                  value={alimtalkType}
                  onChange={(e) => setAlimtalkType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-lg"
                  disabled={!selectedClient.phone}
                >
                  <option value="application_received">📋 신청 접수 알림</option>
                  <option value="in_progress">⏳ 심사 진행 알림</option>
                  <option value="approved">✅ 승인 완료 알림</option>
                  <option value="supplement">📄 서류 보완 요청</option>
                  <option value="rejected">❌ 반려 알림</option>
                </select>
              </div>

              {/* 동적 파라미터 입력 */}
              {alimtalkType === 'application_received' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    신청금액 *
                  </label>
                  <input
                    type="text"
                    value={alimtalkParams.amount}
                    onChange={(e) => setAlimtalkParams({...alimtalkParams, amount: e.target.value})}
                    placeholder="예: 5,000만원"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                    disabled={!selectedClient.phone}
                  />
                </div>
              )}

              {alimtalkType === 'approved' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    승인금액 *
                  </label>
                  <input
                    type="text"
                    value={alimtalkParams.approvedAmount}
                    onChange={(e) => setAlimtalkParams({...alimtalkParams, approvedAmount: e.target.value})}
                    placeholder="예: 5,000만원"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                    disabled={!selectedClient.phone}
                  />
                </div>
              )}

              {alimtalkType === 'supplement' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      보완 내용 *
                    </label>
                    <textarea
                      value={alimtalkParams.supplementContent}
                      onChange={(e) => setAlimtalkParams({...alimtalkParams, supplementContent: e.target.value})}
                      placeholder="예: 사업자등록증 사본, 최근 3개월 매출 증빙서류"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none"
                      disabled={!selectedClient.phone}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      제출 기한 *
                    </label>
                    <input
                      type="text"
                      value={alimtalkParams.deadline}
                      onChange={(e) => setAlimtalkParams({...alimtalkParams, deadline: e.target.value})}
                      placeholder="예: 2026-02-25까지"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                      disabled={!selectedClient.phone}
                    />
                  </div>
                </>
              )}

              {alimtalkType === 'rejected' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    반려 사유 *
                  </label>
                  <textarea
                    value={alimtalkParams.rejectionReason}
                    onChange={(e) => setAlimtalkParams({...alimtalkParams, rejectionReason: e.target.value})}
                    placeholder="예: 신용점수 미달 (최소 700점 이상 필요)"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none"
                    disabled={!selectedClient.phone}
                  />
                </div>
              )}

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">💡 알림톡 발송 안내</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>친구 추가 없이 전화번호만으로 발송 가능</li>
                      <li>발송 전 카카오 비즈니스 인증 및 템플릿 승인 필요</li>
                      <li>현재 테스트 모드: 실제 발송되지 않음</li>
                      <li>실제 운영 시 .env에 API 키 설정 필요</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAlimtalkModal(false)}
                  className="flex-1 py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSendAlimtalk}
                  disabled={sendingAlimtalk || !selectedClient.phone}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                    sendingAlimtalk || !selectedClient.phone
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-700'
                  }`}
                >
                  {sendingAlimtalk ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      발송 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                      알림톡 발송
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

/* Enhanced AI Report Modal - Comprehensive with QR Code, Print, PDF */

/* Enhanced AI Report Modal - A4 Print Optimized with Page Breaks */

{/* 📊 AI 분석 보고서 모달 */}
{showReportModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto print:bg-white print:block print:p-0" id="report-modal-overlay">
    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-w-full print:shadow-none print:rounded-none report-page" id="report-modal-container">
      
      {/* 헤더 - Only show on screen, not in print */}
      <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl z-10 print:hidden" id="report-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-white">AI 종합 분석 보고서</h2>
              <p className="text-sm text-gray-300 mt-1">
                {selectedClient && `${selectedClient.name}님의 상세 신용 및 정책자금 분석`}
              </p>
            </div>
          </div>

          {/* Action buttons - screen only */}
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
              title="프린트"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              인쇄
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
              title="PDF 저장"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => setShowReportModal(false)}
              className="text-white hover:text-gray-300 text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Print Header - Shows on every printed page */}
      <div className="hidden print:block print-page-header" style={{position: 'relative', marginBottom: '20pt'}}>
        <div>
          <h1 style={{fontSize: '18pt', fontWeight: 'bold', margin: 0}}>EMFRONTIER AI 분석 보고서</h1>
          <p style={{fontSize: '10pt', color: '#666', marginTop: '4pt'}}>
            {selectedClient && `${selectedClient.name}님 | 생성일: ${new Date().toLocaleDateString('ko-KR')}`}
          </p>
        </div>
        {/* QR Code in header - shows on every page */}
        {selectedClient && (
          <div style={{position: 'absolute', top: 0, right: 0}}>
            <canvas id={`qr-canvas-print-${selectedClient.id}`} style={{width: '60pt', height: '60pt'}}></canvas>
          </div>
        )}
      </div>

      {/* 로딩 */}
      {loadingReport && (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">AI가 상세 분석 보고서를 생성하고 있습니다...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요 (약 5-10초 소요)</p>
        </div>
      )}

      {/* 보고서 내용 - A4 페이지 최적화 */}
      {!loadingReport && reportData && (
        <div className="p-6 print:p-0" id="report-content">
          
          {/* PAGE 1: 고객 정보 + 종합 평가 */}
          <div className="avoid-break mb-6">
            {/* 클라이언트 기본 정보 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300 mb-6 avoid-break">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                고객 기본 정보
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">이름</p>
                  <p className="text-sm font-bold text-gray-900">{reportData.clientInfo.name}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">나이/성별</p>
                  <p className="text-sm font-bold text-gray-900">{reportData.clientInfo.age}세 / {reportData.clientInfo.gender}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">업력</p>
                  <p className="text-sm font-bold text-gray-900">{reportData.clientInfo.businessYears}년</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">연매출</p>
                  <p className="text-sm font-bold text-blue-900">{(reportData.clientInfo.annualRevenue / 100000000).toFixed(1)}억원</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">총부채</p>
                  <p className="text-sm font-bold text-red-900">{(reportData.clientInfo.totalDebt / 100000000).toFixed(2)}억원</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">부채비율</p>
                  <p className="text-sm font-bold text-orange-900">{reportData.clientInfo.debtRatio}%</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">소호등급</p>
                  <p className="text-sm font-bold text-purple-900">{reportData.clientInfo.sohoGrade}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">기술기업</p>
                  <p className="text-sm font-bold text-green-900">{reportData.clientInfo.hasTechnology ? '인증 ✓' : '미인증'}</p>
                </div>
              </div>
            </div>

            {/* 종합 평가 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-200 avoid-break">
              <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                종합 평가
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-sm text-gray-600 mb-1">종합 점수</p>
                  <p className="text-3xl font-bold text-indigo-600">{reportData.overallAssessment.score}점</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-sm text-gray-600 mb-1">등급</p>
                  <p className="text-3xl font-bold text-purple-600">{reportData.overallAssessment.level}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">📋 기본 요약</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {reportData.overallAssessment.summary}
                </p>
              </div>
              {reportData.overallAssessment.detailedSummary && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">📊 상세 분석</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {reportData.overallAssessment.detailedSummary}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PAGE BREAK */}
          <div className="page-break"></div>

          {/* PAGE 2: 신용 분석 */}
          <div className="avoid-break mb-6">
            <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💳</span>
                신용 분석
              </h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-700 mb-1">KCB 점수</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.clientInfo.kcbScore || 'N/A'}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-700 mb-1">NICE 점수</p>
                  <p className="text-2xl font-bold text-purple-900">{reportData.clientInfo.niceScore || 'N/A'}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-700 mb-1">평균</p>
                  <p className="text-2xl font-bold text-indigo-900">{reportData.clientInfo.avgCreditScore}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-3">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  신용등급: <span className="text-blue-600">{reportData.creditAnalysis.level}</span>
                </p>
                <p className="text-sm text-gray-700">{reportData.creditAnalysis.summary}</p>
              </div>

              {reportData.creditAnalysis.detailedAnalysis && (
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm font-semibold text-gray-800 mb-2">🔍 상세 신용 분석</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{reportData.creditAnalysis.detailedAnalysis}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-800 mb-2">✅ 강점</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {reportData.creditAnalysis.strengths.map((item: string, idx: number) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-800 mb-2">⚠️ 약점</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {reportData.creditAnalysis.weaknesses.map((item: string, idx: number) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {reportData.creditAnalysis.improvements && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 개선 방안</p>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    {reportData.creditAnalysis.improvements.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* PAGE BREAK */}
          <div className="page-break"></div>

          {/* PAGE 3: 부채 분석 + 사업 분석 */}
          {reportData.debtAnalysis && (
            <div className="avoid-break mb-6">
              <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm mb-6">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  부채 구조 분석
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-1">정책자금</p>
                    <p className="text-lg font-bold text-blue-900">
                      {(reportData.debtAnalysis.debtBreakdown.policyFund / 100000000).toFixed(2)}억
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-yellow-700 mb-1">신용대출</p>
                    <p className="text-lg font-bold text-yellow-900">
                      {(reportData.debtAnalysis.debtBreakdown.creditLoan / 100000000).toFixed(2)}억
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-orange-700 mb-1">제2금융</p>
                    <p className="text-lg font-bold text-orange-900">
                      {(reportData.debtAnalysis.debtBreakdown.secondaryLoan / 100000000).toFixed(2)}억
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-700 mb-1">카드론</p>
                    <p className="text-lg font-bold text-red-900">
                      {(reportData.debtAnalysis.debtBreakdown.cardLoan / 100000000).toFixed(2)}억
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">📊 부채 관리 조언</p>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    {reportData.debtAnalysis.debtManagementAdvice.slice(0, 3).map((advice: string, idx: number) => (
                      <li key={idx}>{advice}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 사업 분석 */}
              {reportData.businessAnalysis && (
                <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm avoid-break">
                  <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    사업 분석
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-700 mb-1">안정성 점수</p>
                      <p className="text-2xl font-bold text-green-900">{reportData.businessAnalysis.stabilityScore}점</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-700 mb-1">성장 잠재력</p>
                      <p className="text-xs font-bold text-blue-900 mt-2">{reportData.businessAnalysis.growthPotential}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-purple-700 mb-1">업계 위치</p>
                      <p className="text-xs font-bold text-purple-900 mt-2">{reportData.businessAnalysis.industryComparison.substring(0, 50)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE BREAK */}
          <div className="page-break"></div>

          {/* PAGE 4: 소호등급 분석 */}
          <div className="avoid-break mb-6">
            <div className="bg-white rounded-xl p-6 border-2 border-yellow-200 shadow-sm">
              <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                소호등급 분석
              </h3>
              
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl p-6 text-white text-center mb-4">
                <p className="text-sm font-semibold mb-2 opacity-90">현재 등급</p>
                <p className="text-5xl font-bold">{reportData.sohoAnalysis.grade}</p>
              </div>

              <p className="text-gray-700 mb-4 bg-yellow-50 rounded-lg p-3">
                {reportData.sohoAnalysis.description}
              </p>

              {reportData.sohoAnalysis.detailedAssessment && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">📋 상세 평가</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{reportData.sohoAnalysis.detailedAssessment}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">📌 특성</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {reportData.sohoAnalysis.characteristics.map((item: string, idx: number) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-900 mb-2">💡 권장사항</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {reportData.sohoAnalysis.recommendations.map((item: string, idx: number) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE BREAK */}
          <div className="page-break"></div>

          {/* PAGE 5: 정책자금 분석 */}
          <div className="avoid-break mb-6">
            <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                추천 정책자금 상세 분석
              </h3>

              <div className="mb-4 flex gap-3">
                <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-700 mb-1">총 추천</p>
                  <p className="text-2xl font-bold text-green-900">{reportData.fundAnalysis.totalRecommendations}개</p>
                </div>
                <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-700 mb-1">신청 중</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.fundAnalysis.appliedFunds}개</p>
                </div>
              </div>

              {reportData.fundAnalysis.detailedRecommendations && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">🤖 AI 종합 추천 의견</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{reportData.fundAnalysis.detailedRecommendations}</p>
                </div>
              )}

              {reportData.fundAnalysis.recommendedFunds.length > 0 ? (
                <div className="space-y-4">
                  {reportData.fundAnalysis.recommendedFunds.slice(0, 2).map((fund: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-green-500 shadow avoid-break">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg mb-1">{fund.name}</h4>
                          <p className="text-sm text-gray-600">{fund.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-white rounded-lg px-3 py-1 shadow">
                            <p className="text-xs text-gray-600">적합도</p>
                            <p className="text-2xl font-bold text-green-600">{fund.suitabilityScore}점</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-600">최대한도</p>
                          <p className="text-sm font-bold text-blue-900">{fund.maxAmount}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-600">금리</p>
                          <p className="text-sm font-bold text-purple-900">{fund.interestRate}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 mb-2">
                        <p className="text-xs font-semibold text-green-800 mb-2">🤖 AI 추천 이유</p>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {fund.recommendationReasons.slice(0, 3).map((reason: string, ridx: number) => (
                            <li key={ridx}>{reason}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">승인 가능성</span>
                        <span className={`text-sm font-bold ${
                          fund.approvalProbability.includes('높음') ? 'text-green-600' :
                          fund.approvalProbability.includes('보통') ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {fund.approvalProbability}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  추천 가능한 정책자금이 없습니다. AI 진단을 먼저 실시해주세요.
                </div>
              )}
            </div>
          </div>

          {/* Continue with more funds on next page if needed */}
          {reportData.fundAnalysis.recommendedFunds.length > 2 && (
            <>
              <div className="page-break"></div>
              <div className="avoid-break mb-6">
                <div className="space-y-4">
                  {reportData.fundAnalysis.recommendedFunds.slice(2).map((fund: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-green-500 shadow avoid-break">
                      {/* Same fund card structure as above */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg mb-1">{fund.name}</h4>
                          <p className="text-sm text-gray-600">{fund.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-white rounded-lg px-3 py-1 shadow">
                            <p className="text-xs text-gray-600">적합도</p>
                            <p className="text-2xl font-bold text-green-600">{fund.suitabilityScore}점</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-600">최대한도</p>
                          <p className="text-sm font-bold text-blue-900">{fund.maxAmount}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-600">금리</p>
                          <p className="text-sm font-bold text-purple-900">{fund.interestRate}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 mb-2">
                        <p className="text-xs font-semibold text-green-800 mb-2">🤖 AI 추천 이유</p>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {fund.recommendationReasons.slice(0, 3).map((reason: string, ridx: number) => (
                            <li key={ridx}>{reason}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">승인 가능성</span>
                        <span className={`text-sm font-bold ${
                          fund.approvalProbability.includes('높음') ? 'text-green-600' :
                          fund.approvalProbability.includes('보통') ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {fund.approvalProbability}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PAGE BREAK */}
          <div className="page-break"></div>

          {/* PAGE 6: 리스크 평가 */}
          {reportData.riskAssessment && (
            <div className="avoid-break mb-6">
              <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-sm">
                <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  리스크 평가 및 완화 전략
                </h3>
                
                <div className="bg-orange-50 rounded-lg p-4 mb-4 text-center">
                  <p className="text-sm text-orange-700 mb-1">전체 리스크 수준</p>
                  <p className="text-2xl font-bold text-orange-900">{reportData.riskAssessment.overallRisk}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-orange-900 mb-2">🔍 리스크 요인</p>
                  <ul className="text-sm text-gray-700 space-y-1.5 bg-orange-50 rounded-lg p-3">
                    {reportData.riskAssessment.riskFactors.map((risk: string, idx: number) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-green-900 mb-2">💡 완화 전략</p>
                  <ul className="text-sm text-gray-700 space-y-1.5 bg-green-50 rounded-lg p-3">
                    {reportData.riskAssessment.mitigationStrategies.map((strategy: string, idx: number) => (
                      <li key={idx}>{strategy}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* PAGE BREAK */}
          <div className="page-break"></div>

          {/* FINAL PAGE: 다음 단계 & 타임라인 */}
          <div className="avoid-break mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                실행 계획 및 다음 단계
              </h3>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-purple-800 mb-2">📋 즉시 실행 항목</p>
                {reportData.overallAssessment.nextSteps.map((step: string, idx: number) => (
                  <div key={idx} className="bg-white rounded-lg p-3 flex items-start gap-3 shadow-sm">
                    <span className="text-purple-600 font-bold">{idx + 1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{step}</p>
                  </div>
                ))}
              </div>

              {reportData.overallAssessment.timelineRecommendations && (
                <div>
                  <p className="text-sm font-semibold text-purple-800 mb-2">📅 타임라인 계획</p>
                  <div className="space-y-2">
                    {reportData.overallAssessment.timelineRecommendations.map((timeline: string, idx: number) => (
                      <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-700">{timeline}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 생성 정보 */}
            <div className="text-center text-xs text-gray-500 pt-4 border-t mt-6">
              <p className="font-semibold mb-1">📄 보고서 생성 정보</p>
              <p>생성 시간: {new Date(reportData.generatedAt).toLocaleString('ko-KR')}</p>
              <p className="mt-2 bg-yellow-50 inline-block px-4 py-2 rounded-lg">
                ⚠️ 본 보고서는 AI 기반 자동 분석 결과이며, 참고 자료로만 활용하시기 바랍니다.
              </p>
              <p className="mt-1">최종 의사결정 시에는 전문가 상담을 권장드립니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 닫기 버튼 - Screen only */}
      <div className="sticky bottom-0 bg-white p-4 border-t print:hidden">
        <button
          onClick={() => setShowReportModal(false)}
          className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
)}


      {/* 비밀번호 재설정 모달 */}
      {showPasswordResetModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                🔑 비밀번호 재설정
              </h3>
              <button
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong className="font-semibold">{selectedClient.name}</strong> 님의 비밀번호를 재설정합니다.
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  이메일: <strong>{selectedClient.email}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                    placeholder="최소 6자 이상"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                    placeholder="비밀번호 재입력"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  ⚠️ 비밀번호 재설정 후 클라이언트는 새 비밀번호로 로그인해야 합니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleResetClientPassword}
                className="flex-1 py-3 bg-black text-white hover:bg-gray-700 transition-all font-medium"
              >
                비밀번호 재설정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 고객정보 보고서 */}
      {showClientInfoReport && selectedClient && (
        <ClientInfoReport
          client={selectedClient}
          onClose={() => setShowClientInfoReport(false)}
        />
      )}

      {/* 재무제표 AI 분석 입력 모달 */}
      {showFinancialAnalysis && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg z-10">
              <h3 className="text-2xl font-bold">📈 재무제표 AI 분석</h3>
              <p className="text-green-50 mt-1">고객: {selectedClient.name} | 최근 3개년 재무제표를 입력하시면 AI가 정밀 분석하여 최적의 대출 한도를 산출해드립니다.</p>
            </div>

            <div className="p-6">
              {loadingFinancialAnalysis ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mb-4"></div>
                  <p className="text-lg text-gray-600">AI가 재무제표를 분석하고 있습니다...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {financialData.map((yearData, index) => (
                      <div key={index} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                        <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {yearData.year}년
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">매출액 (원)</label>
                            <input
                              type="number"
                              value={yearData.revenue || ''}
                              onChange={(e) => handleFinancialDataChange(index, 'revenue', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">영업이익 (원)</label>
                            <input
                              type="number"
                              value={yearData.operatingProfit || ''}
                              onChange={(e) => handleFinancialDataChange(index, 'operatingProfit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">순이익 (원)</label>
                            <input
                              type="number"
                              value={yearData.netProfit || ''}
                              onChange={(e) => handleFinancialDataChange(index, 'netProfit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">총자산 (원)</label>
                            <input
                              type="number"
                              value={yearData.totalAssets || ''}
                              onChange={(e) => handleFinancialDataChange(index, 'totalAssets', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">총부채 (원)</label>
                            <input
                              type="number"
                              value={yearData.totalLiabilities || ''}
                              onChange={(e) => handleFinancialDataChange(index, 'totalLiabilities', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">자본금 (원)</label>
                            <input
                              type="number"
                              value={yearData.equity || ''}
                              onChange={(e) => handleFinancialDataChange(index, 'equity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> 재무제표의 부채, 매출, 순이익 등을 정확히 입력하시면 더욱 정밀한 AI 진단 결과를 받으실 수 있습니다.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleFinancialAnalysis}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                    >
                      🤖 AI 분석 시작
                    </button>
                    <button
                      onClick={() => {
                        setShowFinancialAnalysis(false);
                        setFinancialData([
                          { year: '2023', revenue: 0, operatingProfit: 0, netProfit: 0, totalAssets: 0, totalLiabilities: 0, equity: 0 },
                          { year: '2022', revenue: 0, operatingProfit: 0, netProfit: 0, totalAssets: 0, totalLiabilities: 0, equity: 0 },
                          { year: '2021', revenue: 0, operatingProfit: 0, netProfit: 0, totalAssets: 0, totalLiabilities: 0, equity: 0 },
                        ]);
                      }}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 재무제표 AI 분석 결과 모달 */}
      {showFinancialResult && financialResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg z-10">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                재무제표 AI 분석 결과
              </h3>
              <p className="text-green-50 mt-1">3개년 재무제표 기반 정밀 분석 완료</p>
            </div>

            <div className="p-6">
              {/* 핵심 지표 요약 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">SOHO 등급</p>
                  <p className="text-3xl font-bold text-blue-800">{financialResult.sohoGrade}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">최대 대출 한도</p>
                  <p className="text-2xl font-bold text-green-800">{financialResult.maxLoanLimit?.toLocaleString()}원</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-1">재무건전성 점수</p>
                  <p className="text-3xl font-bold text-purple-800">{financialResult.financialHealthScore?.toFixed(1)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-200">
                  <p className="text-sm text-orange-600 font-medium mb-1">성장률</p>
                  <p className="text-3xl font-bold text-orange-800">{(financialResult.growthRate * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* 재무 비율 상세 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    수익성 지표
                  </h4>
                  <p className="text-sm text-gray-700">수익성 비율: <span className="font-semibold">{(financialResult.profitabilityRatio * 100).toFixed(2)}%</span></p>
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    안정성 지표
                  </h4>
                  <p className="text-sm text-gray-700">안정성 비율: <span className="font-semibold">{(financialResult.stabilityRatio * 100).toFixed(2)}%</span></p>
                </div>
              </div>

              {/* 추천 정책자금 */}
              {financialResult.recommendedFunds && financialResult.recommendedFunds.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">💼 추천 정책자금</h4>
                  <div className="space-y-3">
                    {financialResult.recommendedFunds.map((fundName: string, idx: number) => (
                      <div key={idx} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{idx + 1}. {fundName}</p>
                            <p className="text-xs text-gray-600 mt-1">재무제표 기반 추천 자금</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-600 font-medium">최대 1억원</p>
                            <p className="text-xs text-gray-500">금리 2.5% | 60개월</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상세 분석 내용 */}
              {financialResult.details && (
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    상세 분석 내용
                  </h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{financialResult.details}</pre>
                </div>
              )}

              {/* 버튼 영역 */}
              <button
                onClick={() => {
                  setShowFinancialResult(false);
                  setFinancialResult(null);
                }}
                className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
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
