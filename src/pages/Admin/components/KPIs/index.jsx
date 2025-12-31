import React from 'react'
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs'
import KPICard from './KPICard'
import PhaseCompletionChart from './PhaseCompletionChart'
import StatusDistributionChart from './StatusDistributionChart'
import ApprovalTimeChart from './ApprovalTimeChart'
import WeeklyTrendChart from './WeeklyTrendChart'
import SubcontractorRanking from './SubcontractorRanking'
import './KPIs.css'

const DashboardKPIs = () => {
    const { kpiData, loading } = useDashboardKPIs()

    if (loading) return <div className="kpi-loading">Loading KPIs...</div>

    return (
        <div className="kpi-container">
            {/* Top Row: Cards */}
            <div className="kpi-grid-top">
                <KPICard
                    title="Total Sites"
                    value={kpiData.cards.total}
                    icon="📡"
                    color="#60A5FA"
                    subValue="+12"
                    subLabel="this week"
                />
                <KPICard
                    title="Completed"
                    value={kpiData.cards.completed}
                    icon="✅"
                    color="#10B981"
                    subValue="98%"
                    subLabel="target met"
                />
                <KPICard
                    title="Pending"
                    value={kpiData.cards.pending}
                    icon="⏳"
                    color="#FBBF24"
                    subValue="Delayed"
                    subLabel="5 sites"
                />
                <KPICard
                    title="Avg Approval"
                    value={`${kpiData.cards.avgTime} days`}
                    icon="⏱️"
                    color="#818CF8"
                    subValue="-2 days"
                    subLabel="vs last month"
                />
            </div>

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

export default DashboardKPIs
export { default as KPISummaryCards } from './KPISummaryCards'
export { default as KPIAnalyticsGrid } from './KPIAnalyticsGrid'
