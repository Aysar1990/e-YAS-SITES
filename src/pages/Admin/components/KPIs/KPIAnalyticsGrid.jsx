import React from 'react'
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs'
import PhaseCompletionChart from './PhaseCompletionChart'
import StatusDistributionChart from './StatusDistributionChart'
import ApprovalTimeChart from './ApprovalTimeChart'
import WeeklyTrendChart from './WeeklyTrendChart'
import SubcontractorRanking from './SubcontractorRanking'
import './KPIs.css'

const KPIAnalyticsGrid = () => {
    const { kpiData, loading } = useDashboardKPIs()

    if (loading) return <div className="kpi-loading">Loading Analytics...</div>

    return (
        <div className="kpi-analytics-section">
            {/* Middle Row: Trend & Distribution */}
            <div className="kpi-grid-middle">
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-title">📈 Weekly Performance Trend</div>
                    </div>
                    <WeeklyTrendChart data={kpiData.charts.weeklyTrend} />
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-title">📊 Status Distribution</div>
                    </div>
                    <StatusDistributionChart data={kpiData.charts.statusDistribution} />
                </div>
            </div>

            {/* Bottom Row: Phase, Time, Ranking */}
            <div className="kpi-grid-bottom">
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-title">🏗️ Phase Completion</div>
                    </div>
                    <PhaseCompletionChart data={kpiData.charts.phaseCompletion} />
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-title">⚡ Approx. Approval Days</div>
                    </div>
                    <ApprovalTimeChart data={kpiData.charts.approvalTime} />
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-title">🏆 Top Subcontractors</div>
                    </div>
                    <SubcontractorRanking ranking={kpiData.ranking} />
                </div>
            </div>
        </div>
    )
}

export default KPIAnalyticsGrid
