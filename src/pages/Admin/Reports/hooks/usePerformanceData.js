/**
 * usePerformanceData Hook - Enhanced Version
 * Calculates performance metrics for Subcontractors, Nokia, and Zain departments
 * 
 * Key Changes:
 * - Uses updatedAt for date filtering (tssr_status_date doesn't exist)
 * - Calculates Action Age from updatedAt
 * - Adds Today processed counts with color coding
 * - Adds Average Days calculation
 * - Fixed Released logic for Nokia vs Zain
 */

import { useState, useEffect, useMemo } from 'react'

// Status workflow order for reference
const STATUS_WORKFLOW = {
    'Site not surveyed': 0,
    'TSSR Under Subcon validation': 1,
    'TSSR Under Nokia GSD Validation': 2,
    'TSSR Under Nokia NPO Validation': 3,
    'TSSR Under Nokia ROM Validation': 4,
    'TSSR Under ROM Review': 5,
    'TSSR Under Zain validation': 6,
    'Approved': 7,
    'Rejected': -1,
}

// Statuses that indicate site passed a certain stage
const PASSED_GSD = ['TSSR Under Nokia NPO Validation', 'TSSR Under Nokia ROM Validation', 'TSSR Under ROM Review', 'TSSR Under Zain validation', 'Approved']
const PASSED_NPO = ['TSSR Under Nokia ROM Validation', 'TSSR Under ROM Review', 'TSSR Under Zain validation', 'Approved']
const PASSED_ROM = ['TSSR Under Zain validation', 'Approved']
const SUBMITTED_TO_NOKIA = ['TSSR Under Nokia GSD Validation', ...PASSED_GSD]

/**
 * Parse date from various formats
 */
const parseDate = (dateValue) => {
    if (!dateValue) return null
    
    // Handle Firestore Timestamp
    if (dateValue?.toDate) {
        return dateValue.toDate()
    }
    
    // Handle seconds timestamp
    if (dateValue?.seconds) {
        return new Date(dateValue.seconds * 1000)
    }
    
    // Handle string or Date
    const date = new Date(dateValue)
    return isNaN(date.getTime()) ? null : date
}

/**
 * Calculate days between two dates
 */
const daysBetween = (date1, date2) => {
    if (!date1 || !date2) return 0
    const diffTime = Math.abs(date2 - date1)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get start of day
 */
const startOfDay = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Get start of week (Sunday)
 */
const startOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Get start of month
 */
const startOfMonth = (date) => {
    const d = new Date(date)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Main Hook
 */
export const usePerformanceData = (sites, period, customRange) => {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)

    // Get the date field from site (try multiple fields)
    const getSiteDate = (site) => {
        return parseDate(site.updatedAt) || 
               parseDate(site.tssr_status_date) || 
               parseDate(site.lastModified) ||
               parseDate(site.createdAt)
    }

    // Filter sites by period
    const getDateRange = (period, customRange) => {
        const now = new Date()
        const todayStart = startOfDay(now)
        const todayEnd = new Date(todayStart)
        todayEnd.setHours(23, 59, 59, 999)

        switch (period) {
            case 'today':
                return { start: todayStart, end: todayEnd }
            case 'week':
                return { start: startOfWeek(now), end: todayEnd }
            case 'month':
                return { start: startOfMonth(now), end: todayEnd }
            case 'custom':
                return {
                    start: customRange?.start ? startOfDay(new Date(customRange.start)) : todayStart,
                    end: customRange?.end ? new Date(new Date(customRange.end).setHours(23, 59, 59, 999)) : todayEnd
                }
            case 'all':
            default:
                return { start: null, end: null }
        }
    }

    // Filter sites by date range
    const filteredSites = useMemo(() => {
        if (!sites || sites.length === 0) return []
        if (period === 'all') return sites

        const { start, end } = getDateRange(period, customRange)
        if (!start) return sites

        return sites.filter(site => {
            const siteDate = getSiteDate(site)
            if (!siteDate) return period === 'all' // Include sites without date only in "all" view
            return siteDate >= start && siteDate <= end
        })
    }, [sites, period, customRange])

    // Get today's sites (always today, regardless of filter)
    const todaySites = useMemo(() => {
        if (!sites || sites.length === 0) return []
        const todayStart = startOfDay(new Date())
        
        return sites.filter(site => {
            const siteDate = getSiteDate(site)
            return siteDate && siteDate >= todayStart
        })
    }, [sites])

    useEffect(() => {
        setLoading(true)

        const calculateStats = () => {
            if (!sites || sites.length === 0) {
                setStats(null)
                setLoading(false)
                return
            }

            const now = new Date()

            // ═══════════════════════════════════════════════════════════════
            // 1. OVERALL SUMMARY (uses ALL sites, not filtered)
            // ═══════════════════════════════════════════════════════════════
            const total = sites.length
            const approved = sites.filter(s => 
                s.tssr_overall_status === 'Approved' || 
                s.tssrOverallStatus === 'Approved'
            ).length
            
            const notStarted = sites.filter(s => {
                const status = s.tssr_overall_status || s.tssrOverallStatus || ''
                return status === 'Site not surveyed' || status === ''
            }).length
            
            const inProgress = total - approved - notStarted

            // ═══════════════════════════════════════════════════════════════
            // 2. TODAY'S ACTIVITY
            // ═══════════════════════════════════════════════════════════════
            const getStatus = (site) => site.tssr_overall_status || site.tssrOverallStatus || ''
            
            const todayStats = {
                surveyed: todaySites.filter(s => {
                    const status = getStatus(s)
                    return status !== 'Site not surveyed' && status !== ''
                }).length,
                submitted: todaySites.filter(s => SUBMITTED_TO_NOKIA.includes(getStatus(s))).length,
                gsdProcessed: todaySites.filter(s => PASSED_GSD.includes(getStatus(s))).length,
                npoProcessed: todaySites.filter(s => PASSED_NPO.includes(getStatus(s))).length,
                romProcessed: todaySites.filter(s => PASSED_ROM.includes(getStatus(s))).length,
                zainApproved: todaySites.filter(s => getStatus(s) === 'Approved').length,
                total: todaySites.length
            }

            // ═══════════════════════════════════════════════════════════════
            // 3. SUBCONTRACTOR STATS (uses filteredSites)
            // ═══════════════════════════════════════════════════════════════
            const getSubcon = (site) => site.tssr_subcon || site.tssrSubcon || ''
            const subcons = [...new Set(sites.map(getSubcon).filter(Boolean))]
            
            const subconStats = subcons.map(name => {
                // All sites for this subcon (for totals)
                const allSubconSites = sites.filter(s => getSubcon(s) === name)
                // Filtered sites for this subcon (for period-specific stats)
                const periodSubconSites = filteredSites.filter(s => getSubcon(s) === name)
                // Today's sites for this subcon
                const todaySubconSites = todaySites.filter(s => getSubcon(s) === name)
                
                const surveyed = allSubconSites.filter(s => {
                    const status = getStatus(s)
                    return status !== 'Site not surveyed' && status !== ''
                })
                
                const submitted = allSubconSites.filter(s => SUBMITTED_TO_NOKIA.includes(getStatus(s)))
                
                // Today counts
                const todaySurveyed = todaySubconSites.filter(s => {
                    const status = getStatus(s)
                    return status !== 'Site not surveyed' && status !== ''
                }).length
                
                const todaySubmitted = todaySubconSites.filter(s => 
                    SUBMITTED_TO_NOKIA.includes(getStatus(s))
                ).length

                // Calculate average days (from survey to submit)
                let totalDays = 0
                let countWithDates = 0
                submitted.forEach(site => {
                    const siteDate = getSiteDate(site)
                    if (siteDate) {
                        totalDays += daysBetween(siteDate, now)
                        countWithDates++
                    }
                })
                const avgDays = countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0

                return {
                    name,
                    assigned: allSubconSites.length,
                    surveyed: surveyed.length,
                    submitted: submitted.length,
                    pendingSurvey: allSubconSites.length - surveyed.length,
                    pendingSubmit: surveyed.length - submitted.length,
                    surveyRate: allSubconSites.length ? (surveyed.length / allSubconSites.length) * 100 : 0,
                    submitRate: surveyed.length ? (submitted.length / surveyed.length) * 100 : 0,
                    todaySurveyed,
                    todaySubmitted,
                    avgDays,
                    // Raw sites for drill-down
                    rawSites: allSubconSites,
                    rawSites_surveyed: surveyed,
                    rawSites_submitted: submitted,
                    rawSites_pendingSurvey: allSubconSites.filter(s => {
                        const status = getStatus(s)
                        return status === 'Site not surveyed' || status === ''
                    }),
                    rawSites_pendingSubmit: surveyed.filter(s => !SUBMITTED_TO_NOKIA.includes(getStatus(s)))
                }
            }).sort((a, b) => b.assigned - a.assigned)

            // ═══════════════════════════════════════════════════════════════
            // 4. NOKIA STATS (GSD, NPO, ROM)
            // ═══════════════════════════════════════════════════════════════
            const calculateNokiaStage = (currentStatus, passedStatuses, stageName) => {
                // Received = sites at this stage OR passed it
                const received = sites.filter(s => 
                    getStatus(s) === currentStatus || passedStatuses.includes(getStatus(s))
                )
                
                // Approved = sites that passed this stage
                const approved = sites.filter(s => passedStatuses.includes(getStatus(s)))
                
                // Pending = sites currently at this stage
                const pending = sites.filter(s => getStatus(s) === currentStatus)
                
                // Rejected - check for rejected status
                const rejected = sites.filter(s => {
                    const status = getStatus(s)
                    return status.toLowerCase().includes('rejected')
                })

                // Today processed
                const todayProcessed = todaySites.filter(s => 
                    passedStatuses.includes(getStatus(s))
                ).length

                // Average days at this stage
                let totalDays = 0
                let countWithDates = 0
                pending.forEach(site => {
                    const siteDate = getSiteDate(site)
                    if (siteDate) {
                        totalDays += daysBetween(siteDate, now)
                        countWithDates++
                    }
                })
                const avgDays = countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0

                return {
                    stage: stageName,
                    received: received.length,
                    approved: approved.length,
                    rejected: rejected.length,
                    pending: pending.length,
                    todayProcessed,
                    avgDays,
                    rate: received.length ? (approved.length / received.length) * 100 : 0,
                    // Raw sites for drill-down
                    rawSites_received: received,
                    rawSites_approved: approved,
                    rawSites_pending: pending,
                    rawSites_rejected: rejected
                }
            }

            const nokiaStats = {
                gsd: calculateNokiaStage('TSSR Under Nokia GSD Validation', PASSED_GSD, 'GSD'),
                npo: calculateNokiaStage('TSSR Under Nokia NPO Validation', PASSED_NPO, 'NPO'),
                rom: calculateNokiaStage('TSSR Under Nokia ROM Validation', PASSED_ROM, 'ROM')
            }

            // ═══════════════════════════════════════════════════════════════
            // 5. ZAIN DEPARTMENT STATS
            // ═══════════════════════════════════════════════════════════════
            const calculateDeptStats = (field, displayName) => {
                // Get field value (handle both snake_case and camelCase)
                const getFieldValue = (site) => {
                    return site[field] || site[field.replace(/_/g, '')] || ''
                }

                // Only consider sites that have reached Zain validation or are approved
                const relevantSites = sites.filter(s => {
                    const status = getStatus(s)
                    return status === 'TSSR Under Zain validation' || 
                           status === 'Approved' ||
                           getFieldValue(s) // Has department status
                })

                const approved = relevantSites.filter(s => 
                    getFieldValue(s).toLowerCase() === 'approved'
                )
                const pending = relevantSites.filter(s => 
                    getFieldValue(s).toLowerCase() === 'pending'
                )
                const rejected = relevantSites.filter(s => 
                    getFieldValue(s).toLowerCase() === 'rejected'
                )
                const released = relevantSites.filter(s => 
                    getFieldValue(s).toLowerCase() === 'released'
                )

                // Action Taken = Approved + Rejected + Released (for Zain, Released counts!)
                const actionTaken = approved.length + rejected.length + released.length

                // Today processed
                const todayDeptSites = todaySites.filter(s => {
                    const val = getFieldValue(s).toLowerCase()
                    return val === 'approved' || val === 'rejected' || val === 'released'
                })

                // Average days
                let totalDays = 0
                let countWithDates = 0
                pending.forEach(site => {
                    const siteDate = getSiteDate(site)
                    if (siteDate) {
                        totalDays += daysBetween(siteDate, now)
                        countWithDates++
                    }
                })
                const avgDays = countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0

                return {
                    department: displayName,
                    field,
                    received: relevantSites.length,
                    approved: approved.length,
                    pending: pending.length,
                    rejected: rejected.length,
                    released: released.length,
                    actionTaken,
                    todayProcessed: todayDeptSites.length,
                    avgDays,
                    rate: relevantSites.length ? (actionTaken / relevantSites.length) * 100 : 0,
                    // Raw sites for drill-down
                    rawSites_received: relevantSites,
                    rawSites_approved: approved,
                    rawSites_pending: pending,
                    rawSites_rejected: rejected,
                    rawSites_released: released
                }
            }

            const zainStats = {
                ti: calculateDeptStats('ti_status', 'TI'),
                planning: calculateDeptStats('rf_plan_status', 'RF Planning'),
                optimization: calculateDeptStats('rf_opt_status', 'RF Optimization'),
                civil: calculateDeptStats('civil_status', 'Civil'),
                mw: calculateDeptStats('mw_status', 'Microwave')
            }

            // ═══════════════════════════════════════════════════════════════
            // SET FINAL STATS
            // ═══════════════════════════════════════════════════════════════
            setStats({
                summary: { 
                    total, 
                    approved, 
                    inProgress, 
                    notStarted,
                    completionRate: total ? Math.round((approved / total) * 100) : 0
                },
                today: todayStats,
                subcontractors: subconStats,
                nokia: nokiaStats,
                zain: zainStats,
                period,
                lastCalculated: new Date().toISOString()
            })
            
            setLoading(false)
        }

        // Small delay to prevent UI blocking
        const timer = setTimeout(calculateStats, 100)
        return () => clearTimeout(timer)

    }, [sites, filteredSites, todaySites, period, customRange])

    return { loading, stats, filteredSites, todaySites }
}

export default usePerformanceData
