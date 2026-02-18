import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { performFinancialAnalysis, FinancialStatement } from '@/lib/financial-analysis';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, financialData } = body;
    
    if (!clientId || !financialData) {
      return NextResponse.json({ error: '클라이언트 ID와 재무제표 데이터가 필요합니다.' }, { status: 400 });
    }

    const statements: FinancialStatement[] = financialData;

    console.log('📊 재무제표 AI 분석 시작 (관리자):', clientId);
    console.log('제출된 재무제표:', statements.length + '개년');

    // AI 분석 수행
    const analysis = performFinancialAnalysis(statements);

    console.log('✅ 재무제표 분석 완료:', {
      grade: analysis.sohoGrade,
      limit: analysis.maxLoanLimit,
      healthScore: analysis.financialHealthScore
    });

    initDatabase();
    const db = getDatabase();

    // 재무제표 데이터 저장
    for (const statement of statements) {
      db.prepare('DELETE FROM financial_statements WHERE client_id = ? AND year = ?')
        .run(clientId, statement.year);
      
      db.prepare(`
        INSERT INTO financial_statements 
        (client_id, year, revenue, operating_profit, net_profit, total_assets, total_liabilities, equity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        statement.year,
        statement.revenue,
        statement.operatingProfit,
        statement.netProfit,
        statement.totalAssets,
        statement.totalLiabilities,
        statement.equity
      );
    }

    // 분석 결과 저장
    const existingAnalysis: any = db.prepare(
      'SELECT id FROM financial_analysis WHERE client_id = ?'
    ).get(clientId);

    if (existingAnalysis) {
      db.prepare(`
        UPDATE financial_analysis 
        SET soho_grade = ?,
            max_loan_limit = ?,
            recommended_funds = ?,
            financial_health_score = ?,
            growth_rate = ?,
            profitability_ratio = ?,
            stability_ratio = ?,
            details = ?,
            created_at = datetime('now')
        WHERE client_id = ?
      `).run(
        analysis.sohoGrade,
        analysis.maxLoanLimit,
        JSON.stringify(analysis.recommendedFunds),
        analysis.financialHealthScore,
        analysis.growthRate,
        analysis.profitabilityRatio,
        analysis.stabilityRatio,
        analysis.details,
        clientId
      );
    } else {
      db.prepare(`
        INSERT INTO financial_analysis 
        (client_id, analysis_type, soho_grade, max_loan_limit, recommended_funds, 
         financial_health_score, growth_rate, profitability_ratio, stability_ratio, details)
        VALUES (?, 'financial_statement', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        analysis.sohoGrade,
        analysis.maxLoanLimit,
        JSON.stringify(analysis.recommendedFunds),
        analysis.financialHealthScore,
        analysis.growthRate,
        analysis.profitabilityRatio,
        analysis.stabilityRatio,
        analysis.details
      );
    }

    // 클라이언트 정보 업데이트
    db.prepare(`
      UPDATE clients 
      SET soho_grade = ?, score = ?
      WHERE id = ?
    `).run(
      analysis.sohoGrade,
      analysis.maxLoanLimit,
      clientId
    );

    return NextResponse.json({
      success: true,
      message: '재무제표 AI 분석이 완료되었습니다!',
      analysis: {
        sohoGrade: analysis.sohoGrade,
        maxLoanLimit: analysis.maxLoanLimit,
        recommendedFunds: analysis.recommendedFunds,
        financialHealthScore: analysis.financialHealthScore,
        growthRate: analysis.growthRate,
        profitabilityRatio: analysis.profitabilityRatio,
        stabilityRatio: analysis.stabilityRatio,
        details: analysis.details
      }
    });

  } catch (error: any) {
    console.error('Financial analysis error:', error);
    return NextResponse.json(
      { error: '재무제표 분석 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}


    console.log('📊 재무제표 AI 분석 시작:', payload.id);
    console.log('제출된 재무제표:', statements.length + '개년');

    // AI 분석 수행
    const analysis = performFinancialAnalysis(statements);

    console.log('✅ 재무제표 분석 완료:', {
      grade: analysis.sohoGrade,
      limit: analysis.maxLoanLimit,
      healthScore: analysis.financialHealthScore
    });

    initDatabase();
    const db = getDatabase();

    // 재무제표 데이터 저장
    for (const statement of statements) {
      // 기존 데이터 삭제
      db.prepare('DELETE FROM financial_statements WHERE client_id = ? AND year = ?')
        .run(payload.id, statement.year);
      
      // 새 데이터 삽입
      db.prepare(`
        INSERT INTO financial_statements 
        (client_id, year, revenue, operating_profit, net_profit, total_assets, total_liabilities, equity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        payload.id,
        statement.year,
        statement.revenue,
        statement.operatingProfit,
        statement.netProfit,
        statement.totalAssets,
        statement.totalLiabilities,
        statement.equity
      );
    }

    // 분석 결과 저장
    const existingAnalysis: any = db.prepare(
      'SELECT id FROM financial_analysis WHERE client_id = ?'
    ).get(payload.id);

    if (existingAnalysis) {
      db.prepare(`
        UPDATE financial_analysis 
        SET soho_grade = ?,
            max_loan_limit = ?,
            recommended_funds = ?,
            financial_health_score = ?,
            growth_rate = ?,
            profitability_ratio = ?,
            stability_ratio = ?,
            details = ?,
            created_at = datetime('now')
        WHERE client_id = ?
      `).run(
        analysis.sohoGrade,
        analysis.maxLoanLimit,
        JSON.stringify(analysis.recommendedFunds),
        analysis.financialHealthScore,
        analysis.growthRate,
        analysis.profitabilityRatio,
        analysis.stabilityRatio,
        analysis.details,
        payload.id
      );
    } else {
      db.prepare(`
        INSERT INTO financial_analysis 
        (client_id, analysis_type, soho_grade, max_loan_limit, recommended_funds, 
         financial_health_score, growth_rate, profitability_ratio, stability_ratio, details)
        VALUES (?, 'financial_statement', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        payload.id,
        analysis.sohoGrade,
        analysis.maxLoanLimit,
        JSON.stringify(analysis.recommendedFunds),
        analysis.financialHealthScore,
        analysis.growthRate,
        analysis.profitability_ratio,
        analysis.stabilityRatio,
        analysis.details
      );
    }

    // 클라이언트 정보 업데이트
    db.prepare(`
      UPDATE clients 
      SET soho_grade = ?, score = ?
      WHERE id = ?
    `).run(
      analysis.sohoGrade,
      analysis.maxLoanLimit,
      payload.id
    );

    return NextResponse.json({
      success: true,
      message: '재무제표 AI 분석이 완료되었습니다!',
      analysis: {
        sohoGrade: analysis.sohoGrade,
        maxLoanLimit: analysis.maxLoanLimit,
        recommendedFunds: analysis.recommendedFunds,
        financialHealthScore: analysis.financialHealthScore,
        growthRate: analysis.growthRate,
        profitabilityRatio: analysis.profitabilityRatio,
        stabilityRatio: analysis.stabilityRatio,
        details: analysis.details
      }
    });

  } catch (error: any) {
    console.error('Financial analysis error:', error);
    return NextResponse.json(
      { error: '재무제표 분석 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}
