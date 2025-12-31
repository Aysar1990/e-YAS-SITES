import { useMemo } from 'react'
import { useData } from '../../../context/DataContext'

export const usePredictions = () => {
    const { sites, loading } = useData()

    const predictions = useMemo(() => {
        if (!sites || sites.length === 0) return null

        // 1. Calculate Velocity (Approved sites in last 7 days)
        const today = new Date()
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

        let approvedLast7Days = 0
        let approvedTotal = 0
        let pendingTotal = 0

        sites.forEach(site => {
            const status = (site.tssr_overall_status || '').toLowerCase()
            const isApproved = status.includes('approved')

            if (isApproved) {
                approvedTotal++
                // Check date if available
                if (site.tssr_status_date) {
                    const date = new Date(site.tssr_status_date)
                    if (date >= sevenDaysAgo) approvedLast7Days++
                }
            } else {
                pendingTotal++
            }
        })

        // Velocity (sites/week)
        const velocity = Math.max(1, approvedLast7Days)

        // Estimated Weeks Remaining
        const weeksRemaining = Math.ceil(pendingTotal / velocity)

        // Estimated Date
        const estimatedDate = new Date()
        estimatedDate.setDate(today.getDate() + (weeksRemaining * 7))

        // Phase Breakdown
        const phases = {}
        sites.forEach(site => {
            const p = site.phase_name || 'Unknown'
            if (!phases[p]) phases[p] = { total: 0, completed: 0, pending: 0 }
            phases[p].total++
            if ((site.tssr_overall_status || '').toLowerCase().includes('approved')) {
                phases[p].completed++
            } else {
                phases[p].pending++
            }
        })

        const phasePredictions = Object.entries(phases).map(([name, stats]) => {
            const pWeeks = Math.ceil(stats.pending / velocity)
            const pDate = new Date()
            pDate.setDate(today.getDate() + (pWeeks * 7))

            return {
                name,
                ...stats,
                estimatedDate: pDate.toLocaleDateString(),
                weeksReturning: pWeeks
            }
        })

        return {
            velocity,
            approvedTotal,
            pendingTotal,
            weeksRemaining,
            estimatedCompletionDate: estimatedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            phasePredictions
        }

    }, [sites])

    return { predictions, loading }
}
