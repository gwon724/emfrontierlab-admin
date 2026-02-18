/* Enhanced AI Report Modal - Comprehensive with QR Code, Print, PDF */

{/* 📊 AI 분석 보고서 모달 */}
{showReportModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      {/* 헤더 with Print & PDF buttons */}
      <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl z-10 print:static" id="report-header">
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

          {/* QR Code (top right) */}
          {selectedClient && (
            <div className="bg-white p-2 rounded-lg ml-4 print:block">
              <canvas id={`qr-canvas-${selectedClient.id}`} className="w-24 h-24"></canvas>
              <p className="text-xs text-center text-gray-600 mt-1">Client ID</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 ml-4 print:hidden">
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

      {/* 로딩 */}
      {loadingReport && (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">AI가 상세 분석 보고서를 생성하고 있습니다...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요 (약 5-10초 소요)</p>
        </div>
      )}

      {/* 보고서 내용 */}
      {!loadingReport && reportData && (
        <div className="p-6 space-y-6" id="report-content">
          {/* 클라이언트 기본 정보 */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
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
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-200">
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

          {/* 신용 분석 (Enhanced) */}
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

          {/* NEW: 부채 분석 */}
          {reportData.debtAnalysis && (
            <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm">
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
                  {reportData.debtAnalysis.debtManagementAdvice.map((advice: string, idx: number) => (
                    <li key={idx}>{advice}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* NEW: 사업 분석 */}
          {reportData.businessAnalysis && (
            <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📈</span>
                사업 분석
              </h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-700 mb-1">안정성 점수</p>
                  <p className="text-2xl font-bold text-green-900">{reportData.businessAnalysis.stabilityScore}점</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 mb-1">성장 잠재력</p>
                  <p className="text-xs font-bold text-blue-900 mt-1">{reportData.businessAnalysis.growthPotential}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-700 mb-1">업계 위치</p>
                  <p className="text-xs font-bold text-purple-900 mt-1">{reportData.businessAnalysis.industryComparison}</p>
                </div>
              </div>
            </div>
          )}

          {/* 소호등급 분석 (Enhanced) */}
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

          {/* 정책자금 분석 (Enhanced) */}
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
                {reportData.fundAnalysis.recommendedFunds.map((fund: any, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-green-500 shadow">
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
                        {fund.recommendationReasons.map((reason: string, ridx: number) => (
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

          {/* NEW: 리스크 평가 */}
          {reportData.riskAssessment && (
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
          )}

          {/* 다음 단계 & 타임라인 */}
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
          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            <p className="font-semibold mb-1">📄 보고서 생성 정보</p>
            <p>생성 시간: {new Date(reportData.generatedAt).toLocaleString('ko-KR')}</p>
            <p className="mt-2 bg-yellow-50 inline-block px-4 py-2 rounded-lg">
              ⚠️ 본 보고서는 AI 기반 자동 분석 결과이며, 참고 자료로만 활용하시기 바랍니다.
            </p>
            <p className="mt-1">최종 의사결정 시에는 전문가 상담을 권장드립니다.</p>
          </div>
        </div>
      )}

      {/* 닫기 버튼 */}
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
