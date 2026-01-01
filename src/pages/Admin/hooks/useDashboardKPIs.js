import { useMemo } from 'react'
import { useData } from '../../../context/DataContext'

export const useDashboardKPIs = () => {
    const { sites, stats, loading } = useData()

    const kpiData = useMemo(() => {
        // Empty state - no mock data
        const emptyState = {
            cards: { total: 0, completed: 0, pending: 0, avgTime: 0 },
            charts: {
                phaseCompletion: { labels: [], datasets: [] },
                statusDistribution: { labels: [], datasets: [] },
                approvalTime: { labels: [], datasets: [] },
                weeklyTrend: { labels: [], datasets: [] }
            },
            ranking: []
        }

        if (loading || !sites || sites.length === 0) {
            return emptyState
        }

        // 1. KPI Cards Data - Real Data
        const total = sites.length
        const completed = sites.filter(s => 
            s.tssr_overall_status?.toLowerCase().includes('approved')
        ).length
        const pending = total - completed

        // Calculate Avg Time from action_age field
        let totalDays = 0
        let countWithTime = 0
        sites.forEach(s => {
            if (s.tssr_overall_status?.toLowerCase().includes('approved') && s.action_age) {
                totalDays += parseInt(s.action_age) || 0
                countWithTime++
            }
        })
        const avgTime = countWithTime > 0 ? Math.round(totalDays / countWithTime) : 0

        // 2. Phase Completion - Real Data
        const phaseMap = {}
        sites.forEach(s => {
            const p = s.phase_name || 'Unknown'
            if (!phaseMap[p]) phaseMap[p] = { total: 0, completed: 0 }
            phaseMap[p].total++
            if (s.tssr_overall_status?.toLowerCase().includes('approved')) {
                phaseMap[p].completed++
            }
        })

        const phaseLabels = Object.keys(phaseMap).filter(p => p !== 'Unknown')
        const phaseCompletionData = phaseLabels.map(p =>
            phaseMap[p].total > 0 ? Math.round((phaseMap[p].completed / phaseMap[p].total) * 100) : 0
        )

        // 3. Status Distribution - Real Data
        const statusMap = {}
        sites.forEach(s => {
            const st = s.tssr_overall_status || 'Pending'
            statusMap[st] = (statusMap[st] || 0) + 1
        })
        const statusLabels = Object.keys(statusMap)
        const statusValues = Object.values(statusMap)

        // 4. Avg Approval Time by Stage - Real Data from action_age
        // Group by current validation stage
        const stageMap = { 'Subcon': [], 'Nokia': [], 'Zain': [] }
        sites.forEach(s => {
            const status = s.tssr_overall_status?.toLowerCase() || ''
            const age = parseInt(s.action_age) || 0
            
            if (status.includes('subcon')) {
                stageMap['Subcon'].push(age)
            } else if (status.includes('nokia') || status.includes('npo') || status.includes('gsd') || status.includes('rom')) {
                stageMap['Nokia'].push(age)
            } else if (status.includes('zain')) {
                stageMap['Zain'].push(age)
            }
        })

        const deptTimes = {}
        Object.keys(stageMap).forEach(stage => {
            const ages = stageMap[stage]
            if (ages.length > 0) {
                deptTimes[stage] = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
            }
        })

        // 5. Weekly Trend - Real Data from tssr_status_date
        const now = new Date()
        const weeklyData = {}
        
        // Initialize last 8 weeks
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now)
            weekStart.setDate(now.getDate() - (i * 7))
            const weekLabel = `Week ${8 - i}`
            weeklyData[weekLabel] = { submitted: 0, approved: 0 }
        }

        // Count sites by their status date
        sites.forEach(s => {
            if (!s.tssr_status_date) return
            
            const statusDate = new Date(s.tssr_status_date)
            const diffDays = Math.floor((now - statusDate) / (1000 * 60 * 60 * 24))
            const weekIndex = Math.min(Math.floor(diffDays / 7), 7)
            const weekLabel = `Week ${8 - weekIndex}`
            
            if (weeklyData[weekLabel]) {
                if (s.tssr_overall_status?.toLowerCase().includes('approved')) {
                    weeklyData[weekLabel].approved++
                } else {
                    weeklyData[weekLabel].submitted++
                }
            }
        })

        const weeks = Object.keys(weeklyData)
        const submittedTrend = weeks.map(w => weeklyData[w].submitted)
        const approvedTrend = weeks.map(w => weeklyData[w].approved)

        // 6. Subcontractor Ranking - Real Data
        const subconMap = {}
        sites.forEach(s => {
            const sub = s.tssr_subcon || 'Unassigned'
            if (!subconMap[sub]) subconMap[sub] = { name: sub, total: 0, completed: 0 }
            subconMap[sub].total++
            if (s.tssr_overall_status?.toLowerCase().includes('approved')) {
                subconMap[sub].completed++
            }
        })
        
        const ranking = Object.values(subconMap)
            .map(s => ({
                ...s,
                rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
            }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5)

        return {
            cards: { total, completed, pending, avgTime },
            charts: {
                phaseCompletion: {
                    labels: phaseLabels,
                    datasets: phaseLabels.length > 0 ? [{
                        label: 'Completion %',
                        data: phaseCompletionData,
                        backgroundColor: '#8FD9D9',
                        borderRadius: 4
                    }] : []
                },
                statusDistribution: {
                    labels: statusLabels,
                    datasets: statusLabels.length > 0 ? [{
                        data: statusValues,
                        backgroundColor: ['#8FD9D9', '#FBBF24', '#FF8566', '#EF4444', '#6B7280', '#8FD9D9', '#FF8566', '#8B5CF6'],
                        borderWidth: 0
                    }] : []
                },
                approvalTime: {
                    labels: Object.keys(deptTimes),
                    datasets: Object.keys(deptTimes).length > 0 ? [{
                        label: 'Days',
                        data: Object.values(deptTimes),
                        backgroundColor: '#60A5FA',
                        borderRadius: 4
                    }] : []
                },
                weeklyTrend: {
                    labels: weeks,
                    datasets: [
                        {
                            label: 'Submitted',
                            data: submittedTrend,
                            borderColor: '#FBBF24',
                            backgroundColor: 'rgba(251, 191, 36, 0.1)',
                            tension: 0.4,
                            fill: false
                        },
                        {
                            label: 'Approved',
                            data: approvedTrend,
                            borderColor: '#8FD9D9',
                            backgroundColor: 'rgba(143, 217, 217, 0.1)',
                            tension: 0.4,
                            fill: false
                        }
                    ]
                }
            },
            ranking
        }

    }, [sites, stats, loading])

    return { kpiData, loading }
}
