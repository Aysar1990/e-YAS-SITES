/**
 * Performance Report Export Utility
 * 
 * Exports full performance report to Excel with 4 sheets:
 * 1. Summary - Overall statistics
 * 2. Subcontractors - Contractor performance
 * 3. Nokia - GSD, NPO, ROM stages
 * 4. Zain Departments - TI, Planning, Optimization, Civil, MW
 */

import * as XLSX from 'xlsx-js-style'

// YAS Colors for styling
const COLORS = {
    primary: { rgb: '8FD9D9' },      // Turquoise
    secondary: { rgb: 'FF8566' },    // Orange
    header: { rgb: '1F2937' },       // Dark
    approved: { rgb: '10B981' },     // Green
    pending: { rgb: 'F59E0B' },      // Yellow
    rejected: { rgb: 'EF4444' },     // Red
    white: { rgb: 'FFFFFF' },
    lightGray: { rgb: 'F3F4F6' },
}

// Header style
const headerStyle = {
    font: { bold: true, color: COLORS.white, sz: 11 },
    fill: { fgColor: COLORS.header, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: '374151' } },
        bottom: { style: 'thin', color: { rgb: '374151' } },
        left: { style: 'thin', color: { rgb: '374151' } },
        right: { style: 'thin', color: { rgb: '374151' } },
    }
}

// Title style
const titleStyle = {
    font: { bold: true, color: { rgb: '0F172A' }, sz: 14 },
    fill: { fgColor: COLORS.primary, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
}

// Cell style
const cellStyle = {
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    }
}

// Apply styles to worksheet
const applyStyles = (ws, headerRow = 0) => {
    const range = XLSX.utils.decode_range(ws['!ref'])
    
    for (let C = range.s.c; C <= range.e.c; C++) {
        const headerCell = XLSX.utils.encode_cell({ r: headerRow, c: C })
        if (ws[headerCell]) {
            ws[headerCell].s = headerStyle
        }
        
        for (let R = headerRow + 1; R <= range.e.r; R++) {
            const cell = XLSX.utils.encode_cell({ r: R, c: C })
            if (ws[cell]) {
                ws[cell].s = cellStyle
            }
        }
    }
    
    // Auto-fit columns
    const colWidths = []
    for (let C = range.s.c; C <= range.e.c; C++) {
        let maxWidth = 10
        for (let R = range.s.r; R <= range.e.r; R++) {
            const cell = XLSX.utils.encode_cell({ r: R, c: C })
            if (ws[cell] && ws[cell].v) {
                const cellWidth = String(ws[cell].v).length + 2
                maxWidth = Math.max(maxWidth, cellWidth)
            }
        }
        colWidths.push({ wch: Math.min(maxWidth, 30) })
    }
    ws['!cols'] = colWidths
}

/**
 * Create Summary Sheet
 */
const createSummarySheet = (stats) => {
    const data = [
        ['TSSR Performance Report Summary'],
        [''],
        ['Generated', new Date().toLocaleString()],
        ['Period', stats.period === 'all' ? 'All Time' : stats.period],
        [''],
        ['Overall Statistics'],
        ['Metric', 'Value', 'Percentage'],
        ['Total Sites', stats.summary.total, '100%'],
        ['Approved', stats.summary.approved, `${stats.summary.completionRate}%`],
        ['In Progress', stats.summary.inProgress, `${Math.round((stats.summary.inProgress / stats.summary.total) * 100)}%`],
        ['Not Started', stats.summary.notStarted, `${Math.round((stats.summary.notStarted / stats.summary.total) * 100)}%`],
        [''],
        ["Today's Activity"],
        ['Surveyed Today', stats.today?.surveyed || 0],
        ['Submitted Today', stats.today?.submitted || 0],
        ['GSD Processed', stats.today?.gsdProcessed || 0],
        ['NPO Processed', stats.today?.npoProcessed || 0],
        ['ROM Processed', stats.today?.romProcessed || 0],
        ['Final Approved', stats.today?.zainApproved || 0],
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    // Merge title cell
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]
    
    // Apply title style
    ws['A1'].s = titleStyle
    
    // Column widths
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }]
    
    return ws
}

/**
 * Create Subcontractors Sheet
 */
const createSubcontractorsSheet = (subcontractors) => {
    const headers = [
        'Subcontractor',
        'Assigned',
        'Surveyed',
        'Submitted',
        'Pending Survey',
        'Pending Submit',
        'Today Surveyed',
        'Today Submitted',
        'Avg Days',
        'Survey Rate %'
    ]
    
    const data = [headers]
    
    subcontractors.forEach(row => {
        data.push([
            row.name,
            row.assigned,
            row.surveyed,
            row.submitted,
            row.pendingSurvey,
            row.pendingSubmit,
            row.todaySurveyed || 0,
            row.todaySubmitted || 0,
            row.avgDays || 0,
            `${row.surveyRate?.toFixed(1) || 0}%`
        ])
    })
    
    // Add totals row
    const totals = [
        'TOTAL',
        subcontractors.reduce((sum, r) => sum + (r.assigned || 0), 0),
        subcontractors.reduce((sum, r) => sum + (r.surveyed || 0), 0),
        subcontractors.reduce((sum, r) => sum + (r.submitted || 0), 0),
        subcontractors.reduce((sum, r) => sum + (r.pendingSurvey || 0), 0),
        subcontractors.reduce((sum, r) => sum + (r.pendingSubmit || 0), 0),
        subcontractors.reduce((sum, r) => sum + (r.todaySurveyed || 0), 0),
        subcontractors.reduce((sum, r) => sum + (r.todaySubmitted || 0), 0),
        '-',
        '-'
    ]
    data.push(totals)
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    applyStyles(ws, 0)
    
    return ws
}

/**
 * Create Nokia Sheet
 */
const createNokiaSheet = (nokia) => {
    const headers = [
        'Stage',
        'Received',
        'Approved',
        'Rejected',
        'Pending',
        'Today Processed',
        'Avg Days',
        'Rate %'
    ]
    
    const stages = [
        { key: 'gsd', name: 'GSD Validation', ...nokia.gsd },
        { key: 'npo', name: 'NPO Validation', ...nokia.npo },
        { key: 'rom', name: 'ROM Review', ...nokia.rom }
    ]
    
    const data = [headers]
    
    stages.forEach(row => {
        data.push([
            row.name,
            row.received || 0,
            row.approved || 0,
            row.rejected || 0,
            row.pending || 0,
            row.todayProcessed || 0,
            row.avgDays || 0,
            `${row.rate?.toFixed(1) || 0}%`
        ])
    })
    
    // Add totals row
    const totals = [
        'TOTAL',
        stages.reduce((sum, r) => sum + (r.received || 0), 0),
        stages.reduce((sum, r) => sum + (r.approved || 0), 0),
        stages.reduce((sum, r) => sum + (r.rejected || 0), 0),
        stages.reduce((sum, r) => sum + (r.pending || 0), 0),
        stages.reduce((sum, r) => sum + (r.todayProcessed || 0), 0),
        '-',
        '-'
    ]
    data.push(totals)
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    applyStyles(ws, 0)
    
    return ws
}

/**
 * Create Zain Departments Sheet
 */
const createZainSheet = (zain) => {
    const headers = [
        'Department',
        'Received',
        'Approved',
        'Pending',
        'Rejected',
        'Released',
        'Action Taken',
        'Today Processed',
        'Avg Days',
        'Rate %'
    ]
    
    const departments = [
        { key: 'ti', name: 'TI (Technical Integration)', ...zain.ti },
        { key: 'planning', name: 'RF Planning', ...zain.planning },
        { key: 'optimization', name: 'RF Optimization', ...zain.optimization },
        { key: 'civil', name: 'Civil Works', ...zain.civil },
        { key: 'mw', name: 'Microwave (MW)', ...zain.mw }
    ]
    
    const data = [headers]
    
    departments.forEach(row => {
        data.push([
            row.name,
            row.received || 0,
            row.approved || 0,
            row.pending || 0,
            row.rejected || 0,
            row.released || 0,
            row.actionTaken || 0,
            row.todayProcessed || 0,
            row.avgDays || 0,
            `${row.rate?.toFixed(1) || 0}%`
        ])
    })
    
    // Add totals row
    const totals = [
        'TOTAL',
        departments.reduce((sum, r) => sum + (r.received || 0), 0),
        departments.reduce((sum, r) => sum + (r.approved || 0), 0),
        departments.reduce((sum, r) => sum + (r.pending || 0), 0),
        departments.reduce((sum, r) => sum + (r.rejected || 0), 0),
        departments.reduce((sum, r) => sum + (r.released || 0), 0),
        departments.reduce((sum, r) => sum + (r.actionTaken || 0), 0),
        departments.reduce((sum, r) => sum + (r.todayProcessed || 0), 0),
        '-',
        '-'
    ]
    data.push(totals)
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    applyStyles(ws, 0)
    
    return ws
}

/**
 * Export full performance report
 */
export const exportPerformanceReport = async (stats, filename) => {
    if (!stats) {
        throw new Error('No stats data available for export')
    }
    
    try {
        // Create workbook
        const wb = XLSX.utils.book_new()
        
        // Add sheets
        const summarySheet = createSummarySheet(stats)
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
        
        if (stats.subcontractors && stats.subcontractors.length > 0) {
            const subconSheet = createSubcontractorsSheet(stats.subcontractors)
            XLSX.utils.book_append_sheet(wb, subconSheet, 'Subcontractors')
        }
        
        if (stats.nokia) {
            const nokiaSheet = createNokiaSheet(stats.nokia)
            XLSX.utils.book_append_sheet(wb, nokiaSheet, 'Nokia')
        }
        
        if (stats.zain) {
            const zainSheet = createZainSheet(stats.zain)
            XLSX.utils.book_append_sheet(wb, zainSheet, 'Zain Departments')
        }
        
        // Write file
        XLSX.writeFile(wb, filename)
        
        console.log(`✅ Performance report exported: ${filename}`)
        return true
        
    } catch (error) {
        console.error('Export failed:', error)
        throw error
    }
}

/**
 * Export drill-down sites
 */
export const exportDrillDownSites = (sites, title, filename) => {
    if (!sites || sites.length === 0) {
        throw new Error('No sites data available for export')
    }
    
    const headers = [
        'Site ID',
        'Site Name',
        'Phase',
        'Governorate',
        'Subcontractor',
        'Overall Status',
        'TI Status',
        'RF Plan Status',
        'RF Optim Status',
        'Civil Status',
        'MW Status'
    ]
    
    const data = [headers]
    
    sites.forEach(site => {
        data.push([
            site.site_id || site.siteId || '',
            site.final_site_name || site.finalSiteName || '',
            site.phase_name || site.phaseName || '',
            site.governorate || '',
            site.tssr_subcon || site.tssrSubcon || '',
            site.tssr_overall_status || site.tssrOverallStatus || '',
            site.ti_status || site.tiStatus || '',
            site.rf_plan_status || site.rfPlanStatus || '',
            site.rf_opt_status || site.rfOptimStatus || '',
            site.civil_status || site.civilStatus || '',
            site.mw_status || site.mwStatus || ''
        ])
    })
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    applyStyles(ws, 0)
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31)) // Sheet name max 31 chars
    
    XLSX.writeFile(wb, filename)
    
    return true
}

export default {
    exportPerformanceReport,
    exportDrillDownSites
}
