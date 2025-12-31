import React from 'react'
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs'
import KPICard from './KPICard'
import './KPIs.css'

const KPISummaryCards = () => {
    const { kpiData, loading } = useDashboardKPIs()

    if (loading) return <div className="kpi-loading-small"></div>

    return (
        <div className="kpi-grid-top" style={{ marginBottom: '24px' }}>
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
    )
}

export default KPISummaryCards
