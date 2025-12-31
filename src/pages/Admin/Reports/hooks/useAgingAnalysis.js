import { useMemo } from 'react'

export const useAgingAnalysis = (sites, brackets) => {
    const defaultBrackets = [
        { id: 'fresh', label: '< 3 days', min: 0, max: 3, color: '#8FD9D9' },
        { id: 'normal', label: '3-7 days', min: 3, max: 7, color: '#FBBF24' },
        { id: 'warning', label: '7-14 days', min: 7, max: 14, color: '#FF8566' },
        { id: 'critical', label: '> 14 days', min: 14, max: Infinity, color: '#EF4444' }
    ]

    const activeBrackets = brackets || defaultBrackets

    const analysis = useMemo(() => {
        if (!sites || sites.length === 0) {
            return {
                distribution: [],
                byDepartment: [],
                criticalSites: [],
                avgAge: 0
            }
        }

        const today = new Date()
        let totalAge = 0
        let countWithAge = 0

        // Initialize counters
        const distributionMap = activeBrackets.reduce((acc, b) => {
            acc[b.id] = { ...b, count: 0, percentage: 0 }
            return acc
        }, {})

        // Helper to find bracket
        const getBracket = (days) => {
            return activeBrackets.find(b => days >= b.min && days < b.max) || activeBrackets[activeBrackets.length - 1]
        }

        const deptStats = {
            'Subcon': { fresh: 0, normal: 0, warning: 0, critical: 0, totalAge: 0, count: 0 },
            'Nokia GSD': { fresh: 0, normal: 0, warning: 0, critical: 0, totalAge: 0, count: 0 },
            'Nokia NPO': { fresh: 0, normal: 0, warning: 0, critical: 0, totalAge: 0, count: 0 },
            'Nokia ROM': { fresh: 0, normal: 0, warning: 0, critical: 0, totalAge: 0, count: 0 },
            'Zain': { fresh: 0, normal: 0, warning: 0, critical: 0, totalAge: 0, count: 0 },
        }

        const criticalList = []

        sites.forEach(site => {
            // Calculate age based on action_age or status date
            let age = site.action_age
            if (age === undefined || age === null) {
                if (site.tssr_status_date) {
                    const statusDate = new Date(site.tssr_status_date)
                    // Difference in days
                    age = Math.floor((today - statusDate) / (1000 * 60 * 60 * 24))
                } else {
                    age = 0 // Fallback
                }
            }

            // Sanitization
            age = Math.max(0, age)

            totalAge += age
            countWithAge++

            // Distribution
            const bracket = getBracket(age)
            if (bracket && distributionMap[bracket.id]) {
                distributionMap[bracket.id].count++
            }

            // Department Logic (Infer department from status or other fields if not explicit)
            // This logic depends on how 'department' is determined in existing app
            // For now, we use simple string matching on status or tssr_subcon
            let dept = 'Unknown'
            const status = (site.tssr_overall_status || '').toLowerCase()

            if (status.includes('subcon')) dept = 'Subcon'
            else if (status.includes('gsd')) dept = 'Nokia GSD'
            else if (status.includes('npo')) dept = 'Nokia NPO'
            else if (status.includes('rom')) dept = 'Nokia ROM'
            else if (status.includes('zain') || status.includes('ti') || status.includes('civil') || status.includes('mw') || status.includes('opt')) dept = 'Zain'

            if (deptStats[dept]) {
                deptStats[dept].totalAge += age
                deptStats[dept].count++
                if (bracket) deptStats[dept][bracket.id]++
            }

            // Critical List (> max bracket min of last bracket usually)
            const criticalThreshold = activeBrackets[activeBrackets.length - 1].min
            if (age >= criticalThreshold) {
                criticalList.push({
                    ...site,
                    age,
                    current_dept: dept
                })
            }
        })

        // Calculate Percentages
        const totalSites = sites.length
        const distribution = Object.values(distributionMap).map(b => ({
            ...b,
            percentage: totalSites > 0 ? Math.round((b.count / totalSites) * 100) : 0
        }))

        // Format Department Stats
        const byDepartment = Object.entries(deptStats).map(([name, stat]) => ({
            department: name,
            fresh: stat.fresh,
            normal: stat.normal,
            warning: stat.warning,
            critical: stat.critical,
            avgAge: stat.count > 0 ? (stat.totalAge / stat.count).toFixed(1) : 0
        }))

        return {
            distribution,
            byDepartment,
            criticalSites: criticalList.sort((a, b) => b.age - a.age),
            avgAge: countWithAge > 0 ? (totalAge / countWithAge).toFixed(1) : 0
        }

    }, [sites, activeBrackets])

    return analysis
}
