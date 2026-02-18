'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ClientData {
  id: number;
  name: string;
  email: string;
  annual_revenue: number;
  debt: number;
  kcb_score: number;
  nice_score: number;
  soho_grade: string;
  application?: {
    status: string;
    policy_funds: string[];
    fund_amounts?: { [key: string]: number };
  };
}

export default function DocumentEditor() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [content, setContent] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClientData();
    loadDocument();
    generateQRCode();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const client = data.clients.find((c: ClientData) => c.id === parseInt(clientId));
        if (client) {
          setClientData(client);
          
          // 초기 문서 템플릿
          if (!content) {
            const template = generateTemplate(client);
            setContent(template);
          }
        }
      }
    } catch (error) {
      console.error('클라이언트 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTemplate = (client: ClientData) => {
    const funds = client.application?.policy_funds || [];
    const amounts = client.application?.fund_amounts || {};
    
    let fundsHtml = '';
    funds.forEach(fund => {
      const amount = amounts[fund] || 0;
      fundsHtml += `<li>${fund}: ${amount.toLocaleString()}원</li>`;
    });

    return `
      <h1 style="text-align: center;">정책자금 신청서</h1>
      <br/>
      <h2>신청자 정보</h2>
      <p><strong>이름:</strong> ${client.name}</p>
      <p><strong>이메일:</strong> ${client.email}</p>
      <p><strong>SOHO 등급:</strong> ${client.soho_grade}</p>
      <p><strong>연매출:</strong> ${client.annual_revenue?.toLocaleString()}원</p>
      <p><strong>총부채:</strong> ${client.debt?.toLocaleString()}원</p>
      <p><strong>신용점수:</strong> KCB ${client.kcb_score}, NICE ${client.nice_score}</p>
      <br/>
      <h2>신청 정책자금</h2>
      <ul>
        ${fundsHtml}
      </ul>
      <br/>
      <h2>진행 상태</h2>
      <p><strong>현재 상태:</strong> ${client.application?.status || '접수대기'}</p>
      <br/>
      <h2>비고</h2>
      <p>추가 내용을 입력하세요...</p>
    `;
  };

  const loadDocument = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/document?clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setContent(data.content);
        }
      }
    } catch (error) {
      console.error('문서 로드 오류:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/qr/generate-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clientId: parseInt(clientId) })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
      }
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId: parseInt(clientId),
          content: content
        })
      });

      if (response.ok) {
        alert('문서가 저장되었습니다.');
      } else {
        alert('문서 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('문서 저장 오류:', error);
      alert('문서 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!editorRef.current) return;

    try {
      const canvas = await html2canvas(editorRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${clientData?.name || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean']
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 인쇄용 스타일 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 상단 툴바 */}
      <div className="bg-white border-b p-4 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← 대시보드로 돌아가기
            </button>
            <h1 className="text-2xl font-bold mt-2">
              문서 편집: {clientData?.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? '저장 중...' : '💾 저장'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🖨️ 인쇄
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              📄 PDF 저장
            </button>
          </div>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="print-area" ref={editorRef}>
            {/* QR 코드 - 오른쪽 상단 */}
            {qrCodeUrl && (
              <div className="float-right m-4 p-2 border-2 border-gray-300 rounded bg-white">
                <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                <p className="text-xs text-center text-gray-600 mt-1">관리자 전용 QR</p>
              </div>
            )}
            
            {/* 문서 편집기 */}
            <div className="p-8">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                className="min-h-[600px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
