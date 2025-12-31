/**
 * Report Generator Service - Day 13
 *
 * Generates Excel reports matching the original TSSR Tracker structure
 * Uses ExcelJS for advanced Excel features (formatting, formulas, multiple sheets)
 */

const ExcelJS = require('exceljs')
const path = require('path')

// YAS Branding Colors
const COLORS = {
  headerBg: 'FF8FD9D9',      // Turquoise
  headerText: 'FFFFFFFF',     // White
  approved: 'FFC6EFCE',       // Green
  rejected: 'FFFFC7CE',       // Red
  pending: 'FFFFEB9C',        // Yellow
  altRow: 'FFF5F5F5',         // Light gray
  border: 'FFD0D0D0'          // Border gray
}

// Column definitions matching original Excel structure
const COLUMN_HEADERS = [
  { key: 'site_id', header: 'Site ID', width: 15 },
  { key: 'final_site_name', header: 'Final Site Name', width: 25 },
  { key: 'site_code', header: 'Site Code', width: 12 },
  { key: 'site_type', header: 'Site Type', width: 12 },
  { key: 'key_number', header: 'Key Number', width: 12 },
  { key: 'longitude', header: 'long', width: 12 },
  { key: 'latitude', header: 'lat', width: 12 },
  { key: 'governorate', header: 'Governorate', width: 15 },
  { key: 'structure', header: 'Structure', width: 15 },
  { key: 'structure_type', header: 'Structure Type', width: 15 },
  { key: 'part_of', header: 'Part of', width: 20 },
  { key: 'height_m', header: 'Height (m)', width: 12 },
  { key: 'site_owner', header: 'Site Owner', width: 20 },
  { key: 'phase_name', header: 'Phase Name', width: 12 },
  { key: 'priority', header: 'Priority', width: 10 },
  { key: 'cluster', header: 'Cluster', width: 15 },
  { key: 'area', header: 'Area', width: 15 },
  { key: 'weekly_plan', header: 'Weekly Plan', width: 15 },
  { key: 'tss_smp', header: 'TSS SMP', width: 12 },
  { key: 'tssr_subcon', header: 'TSSR Subcon', width: 25 },
  { key: 'tssr_po', header: 'TSSR PO#', width: 15 },
  { key: 'ts_survey_ac', header: 'TS Survey (Ac)', width: 15 },
  { key: 'tssr_overall_status', header: 'TSSR Overall Status', width: 30 },
  { key: 'tssr_status_date', header: 'TSSR status Date', width: 18 },
  { key: 'tssr_remark', header: 'TSSR Remark', width: 30 },
  { key: 'action_age', header: 'Action Age', width: 12 },
  { key: 'five_g_sectors_names', header: '5G sectors Names', width: 20 },
  { key: 'five_g_solution', header: '5G solution', width: 15 },
  { key: 'site_sectors', header: 'Site Sectors #', width: 15 },
  { key: 'ibs_sector', header: 'IBS Sector', width: 12 },
  { key: 'tdd_site', header: 'TDD Site', width: 12 },
  { key: 'version', header: 'Version', width: 12 },
  { key: 'rec_cab_swap', header: 'REC. Cab. Swap', width: 15 },
  { key: 'ti_status', header: 'TI Status', width: 12 },
  { key: 'ti_comment', header: 'TI Comment', width: 25 },
  { key: 'cluster_owner_ti', header: 'Cluster Owner (TI)', width: 20 },
  { key: 'rf_plan_status', header: 'RF Plan. Status', width: 15 },
  { key: 'rf_plan_comment', header: 'RF Plan Comment', width: 25 },
  { key: 'cluster_owner_planning', header: 'Cluster Owner (Planning)', width: 22 },
  { key: 'rf_opt_status', header: 'RF Optim Status', width: 15 },
  { key: 'rf_opt_comment', header: 'RF Opt. comment', width: 25 },
  { key: 'cluster_owner_optimization', header: 'Cluster Owner (Optimization)', width: 25 },
  { key: 'civil_status', header: 'Civil Status', width: 12 },
  { key: 'civil_comment', header: 'Civil Comment', width: 25 },
  { key: 'cluster_owner_civil', header: 'Cluster Owner (Civil)', width: 20 },
  { key: 'mw_status', header: 'MW Status', width: 12 },
  { key: 'mw_comment', header: 'MW Comment', width: 25 },
  { key: 'cluster_owner_mw', header: 'Cluster Owner (MW)', width: 20 },
  { key: 'nokia_npo_status', header: 'NoKia NPO status', width: 15 },
  { key: 'nokia_npo_comment', header: 'Nokia NPO Comment', width: 25 },
  { key: 'nokia_site_owner', header: 'Nokia Site Owner', width: 20 },
  { key: 'rfi_status', header: 'RFI Status', width: 12 },
  { key: 'gap_analysis', header: 'Gap Analysis', width: 15 },
  { key: 'approved', header: 'Approved', width: 10 },
  { key: 'tssr_ready', header: 'TSSR Ready', width: 12 }
]

/**
 * Get column headers as array
 */
function getColumnHeaders() {
  return COLUMN_HEADERS.map(col => col.header)
}

/**
 * Map site object to row array
 */
function mapSiteToRow(site) {
  return COLUMN_HEADERS.map(col => {
    const value = site[col.key]
    // Handle dates
    if (col.key === 'tssr_status_date' && value) {
      return new Date(value)
    }
    return value ?? ''
  })
}

/**
 * Calculate summary statistics for sites
 */
function calculateSummary(sites) {
  const total = sites.length
  const approved = sites.filter(s => s.tssr_overall_status === 'Approved').length
  const pending = sites.filter(s =>
    s.tssr_overall_status &&
    (s.tssr_overall_status.includes('Under') || s.tssr_overall_status.includes('Pending'))
  ).length
  const rejected = sites.filter(s =>
    s.tssr_overall_status && s.tssr_overall_status.includes('Rejected')
  ).length
  const notSurveyed = sites.filter(s => s.tssr_overall_status === 'Site not Surveyed').length
  const needAccess = sites.filter(s => s.tssr_overall_status === 'Need Access').length

  // By department
  const departments = ['ti', 'rf_plan', 'rf_opt', 'civil', 'mw', 'nokia_npo']
  const deptStats = {}
  departments.forEach(dept => {
    const field = `${dept}_status`
    deptStats[dept] = {
      approved: sites.filter(s => s[field] === 'Approved').length,
      pending: sites.filter(s => s[field] === 'Pending').length,
      rejected: sites.filter(s => s[field] === 'Rejected').length,
      released: sites.filter(s => s[field] === 'Released').length,
      na: sites.filter(s => s[field] === 'N/A').length
    }
  })

  // By phase
  const phaseStats = {}
  sites.forEach(s => {
    const phase = s.phase_name || 'Unknown'
    if (!phaseStats[phase]) {
      phaseStats[phase] = { total: 0, approved: 0, pending: 0 }
    }
    phaseStats[phase].total++
    if (s.tssr_overall_status === 'Approved') phaseStats[phase].approved++
    if (s.tssr_overall_status && s.tssr_overall_status.includes('Under')) phaseStats[phase].pending++
  })

  // By contractor
  const contractorStats = {}
  sites.forEach(s => {
    const contractor = s.tssr_subcon || 'Unknown'
    if (!contractorStats[contractor]) {
      contractorStats[contractor] = { total: 0, approved: 0, pending: 0, rejected: 0 }
    }
    contractorStats[contractor].total++
    if (s.tssr_overall_status === 'Approved') contractorStats[contractor].approved++
    if (s.tssr_overall_status && s.tssr_overall_status.includes('Rejected')) contractorStats[contractor].rejected++
  })

  return {
    total,
    approved,
    pending,
    rejected,
    notSurveyed,
    needAccess,
    approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
    deptStats,
    phaseStats,
    contractorStats
  }
}

/**
 * Apply formatting to worksheet
 */
function applyFormatting(worksheet, type = 'master') {
  const headerRow = worksheet.getRow(1)

  // Header formatting
  headerRow.font = { bold: true, color: { argb: COLORS.headerText } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg }
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  headerRow.height = 30

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  // Apply column widths
  COLUMN_HEADERS.forEach((col, index) => {
    const column = worksheet.getColumn(index + 1)
    column.width = col.width
  })

  // Alternate row colors and conditional formatting
  const rowCount = worksheet.rowCount
  for (let i = 2; i <= rowCount; i++) {
    const row = worksheet.getRow(i)

    // Alternate row colors
    if (i % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.altRow }
      }
    }

    // Status column conditional formatting (column W = 23)
    const statusCell = row.getCell(23) // TSSR Overall Status
    const statusValue = statusCell.value ? String(statusCell.value).toLowerCase() : ''

    if (statusValue === 'approved') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.approved }
      }
    } else if (statusValue.includes('rejected')) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.rejected }
      }
    } else if (statusValue.includes('under') || statusValue.includes('pending')) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.pending }
      }
    }

    // Add borders to all cells
    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.border } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        bottom: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } }
      }
    })
  }
}

/**
 * Add auto-filter to worksheet
 */
function addAutoFilter(worksheet, columnCount) {
  const lastColumn = String.fromCharCode(64 + Math.min(columnCount, 26))
  worksheet.autoFilter = `A1:${lastColumn}1`
}

/**
 * Create Master Sheet with all data
 */
function createMasterSheet(workbook, sites) {
  const sheet = workbook.addWorksheet('Master', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }]
  })

  // Add columns
  sheet.columns = COLUMN_HEADERS

  // Add header row
  sheet.addRow(getColumnHeaders())

  // Add data rows
  sites.forEach(site => {
    sheet.addRow(mapSiteToRow(site))
  })

  // Apply formatting
  applyFormatting(sheet, 'master')
  addAutoFilter(sheet, COLUMN_HEADERS.length)

  return sheet
}

/**
 * Create Dashboard Sheet with summary statistics
 */
function createDashboardSheet(workbook, sites, masterSheetName = 'Master') {
  const sheet = workbook.addWorksheet('Dashboard')
  const summary = calculateSummary(sites)

  // Title
  sheet.mergeCells('A1:E1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'TSSR Status Dashboard'
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.headerBg } }
  titleCell.alignment = { horizontal: 'center' }

  // Overall Summary Section
  sheet.getCell('A3').value = 'Overall Summary'
  sheet.getCell('A3').font = { bold: true, size: 12 }

  const summaryData = [
    ['Metric', 'Count', 'Percentage'],
    ['Total Sites', summary.total, '100%'],
    ['Approved', summary.approved, `${summary.approvalRate}%`],
    ['Pending Review', summary.pending, `${((summary.pending / summary.total) * 100).toFixed(1)}%`],
    ['Rejected', summary.rejected, `${((summary.rejected / summary.total) * 100).toFixed(1)}%`],
    ['Not Surveyed', summary.notSurveyed, `${((summary.notSurveyed / summary.total) * 100).toFixed(1)}%`],
    ['Need Access', summary.needAccess, `${((summary.needAccess / summary.total) * 100).toFixed(1)}%`]
  ]

  summaryData.forEach((row, index) => {
    const rowNum = 4 + index
    sheet.getRow(rowNum).values = ['', ...row]
    if (index === 0) {
      sheet.getRow(rowNum).font = { bold: true }
      sheet.getRow(rowNum).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg }
      }
    }
  })

  // Department Stats Section
  sheet.getCell('A13').value = 'Department Status Summary'
  sheet.getCell('A13').font = { bold: true, size: 12 }

  const deptHeaders = ['Department', 'Approved', 'Pending', 'Rejected', 'Released', 'N/A']
  sheet.getRow(14).values = ['', ...deptHeaders]
  sheet.getRow(14).font = { bold: true }
  sheet.getRow(14).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg }
  }

  const deptLabels = {
    ti: 'TI',
    rf_plan: 'RF Planning',
    rf_opt: 'RF Optimization',
    civil: 'Civil',
    mw: 'MW',
    nokia_npo: 'Nokia NPO'
  }

  let row = 15
  Object.entries(summary.deptStats).forEach(([dept, stats]) => {
    sheet.getRow(row).values = [
      '',
      deptLabels[dept] || dept,
      stats.approved,
      stats.pending,
      stats.rejected,
      stats.released,
      stats.na
    ]
    row++
  })

  // Phase Stats Section
  sheet.getCell('A23').value = 'Phase Summary'
  sheet.getCell('A23').font = { bold: true, size: 12 }

  sheet.getRow(24).values = ['', 'Phase', 'Total', 'Approved', 'Pending', 'Approval Rate']
  sheet.getRow(24).font = { bold: true }
  sheet.getRow(24).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg }
  }

  row = 25
  Object.entries(summary.phaseStats).forEach(([phase, stats]) => {
    const rate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0
    sheet.getRow(row).values = ['', phase, stats.total, stats.approved, stats.pending, `${rate}%`]
    row++
  })

  // Set column widths
  sheet.getColumn(2).width = 20
  sheet.getColumn(3).width = 15
  sheet.getColumn(4).width = 15
  sheet.getColumn(5).width = 15
  sheet.getColumn(6).width = 15
  sheet.getColumn(7).width = 15

  return sheet
}

/**
 * Create Pending Sheet with sites that have pending actions
 */
function createPendingSheet(workbook, sites) {
  const pendingSites = sites.filter(s => {
    const status = (s.tssr_overall_status || '').toLowerCase()
    return status.includes('under') || status.includes('pending') || status.includes('review')
  })

  const sheet = workbook.addWorksheet('Pending')
  sheet.columns = COLUMN_HEADERS

  sheet.addRow(getColumnHeaders())
  pendingSites.forEach(site => {
    sheet.addRow(mapSiteToRow(site))
  })

  applyFormatting(sheet, 'pending')
  addAutoFilter(sheet, COLUMN_HEADERS.length)

  return sheet
}

/**
 * Create Rejection Sheet with rejected sites
 */
function createRejectionSheet(workbook, sites) {
  const rejectedSites = sites.filter(s => {
    // Check overall status or any department status
    const overall = (s.tssr_overall_status || '').toLowerCase()
    const depts = ['ti_status', 'rf_plan_status', 'rf_opt_status', 'civil_status', 'mw_status', 'nokia_npo_status']
    const hasRejection = depts.some(d => (s[d] || '').toLowerCase() === 'rejected')
    return overall.includes('rejected') || hasRejection
  })

  const sheet = workbook.addWorksheet('Rejections')

  // Rejection-specific columns
  const rejectionColumns = [
    { key: 'site_id', header: 'Site ID', width: 15 },
    { key: 'final_site_name', header: 'Site Name', width: 25 },
    { key: 'phase_name', header: 'Phase', width: 12 },
    { key: 'tssr_subcon', header: 'Contractor', width: 25 },
    { key: 'tssr_overall_status', header: 'Overall Status', width: 30 },
    { key: 'ti_status', header: 'TI', width: 12 },
    { key: 'ti_comment', header: 'TI Comment', width: 30 },
    { key: 'rf_plan_status', header: 'RF Plan', width: 12 },
    { key: 'rf_plan_comment', header: 'RF Plan Comment', width: 30 },
    { key: 'rf_opt_status', header: 'RF Opt', width: 12 },
    { key: 'rf_opt_comment', header: 'RF Opt Comment', width: 30 },
    { key: 'civil_status', header: 'Civil', width: 12 },
    { key: 'civil_comment', header: 'Civil Comment', width: 30 },
    { key: 'mw_status', header: 'MW', width: 12 },
    { key: 'mw_comment', header: 'MW Comment', width: 30 },
    { key: 'nokia_npo_status', header: 'Nokia NPO', width: 12 },
    { key: 'nokia_npo_comment', header: 'Nokia Comment', width: 30 },
    { key: 'action_age', header: 'Age (Days)', width: 12 }
  ]

  sheet.columns = rejectionColumns
  sheet.addRow(rejectionColumns.map(c => c.header))

  rejectedSites.forEach(site => {
    sheet.addRow(rejectionColumns.map(c => site[c.key] ?? ''))
  })

  // Format header
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: COLORS.headerText } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF0000' } // Red header for rejections
  }

  rejectionColumns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width
  })

  return sheet
}

/**
 * Create Customer Report Sheet
 */
function createCustomerReportSheet(workbook, sites) {
  const sheet = workbook.addWorksheet('Customer Report')
  const summary = calculateSummary(sites)

  // Title
  sheet.mergeCells('A1:F1')
  sheet.getCell('A1').value = 'TSSR Customer Report'
  sheet.getCell('A1').font = { bold: true, size: 14 }
  sheet.getCell('A1').alignment = { horizontal: 'center' }

  // Report date
  sheet.getCell('A2').value = `Generated: ${new Date().toLocaleDateString()}`

  // Summary by Phase
  sheet.getCell('A4').value = 'Summary by Phase'
  sheet.getCell('A4').font = { bold: true, size: 12 }

  const headers = ['Phase', 'Total Scope', 'Submitted', 'Under Review', 'Approved', 'Approval Rate']
  sheet.getRow(5).values = headers
  sheet.getRow(5).font = { bold: true }
  sheet.getRow(5).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg }
  }

  let row = 6
  Object.entries(summary.phaseStats).forEach(([phase, stats]) => {
    const submitted = sites.filter(s => s.phase_name === phase && s.version).length
    const rate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0
    sheet.getRow(row).values = [phase, stats.total, submitted, stats.pending, stats.approved, `${rate}%`]
    row++
  })

  // Grand total
  sheet.getRow(row).values = [
    'TOTAL',
    summary.total,
    sites.filter(s => s.version).length,
    summary.pending,
    summary.approved,
    `${summary.approvalRate}%`
  ]
  sheet.getRow(row).font = { bold: true }

  // Column widths
  sheet.getColumn(1).width = 15
  sheet.getColumn(2).width = 12
  sheet.getColumn(3).width = 12
  sheet.getColumn(4).width = 15
  sheet.getColumn(5).width = 12
  sheet.getColumn(6).width = 15

  return sheet
}

/**
 * Create Nokia Report Sheet
 */
function createNokiaReportSheet(workbook, sites) {
  const sheet = workbook.addWorksheet('Nokia Report')

  const nokiaColumns = [
    { key: 'site_id', header: 'Site ID', width: 15 },
    { key: 'final_site_name', header: 'Site Name', width: 25 },
    { key: 'phase_name', header: 'Phase', width: 12 },
    { key: 'governorate', header: 'Governorate', width: 15 },
    { key: 'tssr_overall_status', header: 'Overall Status', width: 30 },
    { key: 'nokia_npo_status', header: 'Nokia NPO Status', width: 18 },
    { key: 'nokia_npo_comment', header: 'Nokia Comment', width: 35 },
    { key: 'nokia_site_owner', header: 'Nokia Site Owner', width: 20 },
    { key: 'version', header: 'Version', width: 12 },
    { key: 'action_age', header: 'Age (Days)', width: 12 }
  ]

  sheet.columns = nokiaColumns
  sheet.addRow(nokiaColumns.map(c => c.header))

  sites.forEach(site => {
    sheet.addRow(nokiaColumns.map(c => site[c.key] ?? ''))
  })

  // Format header
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: COLORS.headerText } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' } // Nokia blue
  }

  nokiaColumns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width
  })

  addAutoFilter(sheet, nokiaColumns.length)

  return sheet
}

/**
 * Create Contractor Summary Sheet
 */
function createContractorSummarySheet(workbook, sites) {
  const sheet = workbook.addWorksheet('Contractor Summary')
  const summary = calculateSummary(sites)

  // Title
  sheet.getCell('A1').value = 'Contractor Performance Summary'
  sheet.getCell('A1').font = { bold: true, size: 14 }

  const headers = ['Contractor', 'Total Sites', 'Approved', 'Pending', 'Rejected', 'Approval Rate']
  sheet.getRow(3).values = headers
  sheet.getRow(3).font = { bold: true }
  sheet.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg }
  }

  let row = 4
  Object.entries(summary.contractorStats)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([contractor, stats]) => {
      const pending = stats.total - stats.approved - stats.rejected
      const rate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0
      sheet.getRow(row).values = [contractor, stats.total, stats.approved, pending, stats.rejected, `${rate}%`]
      row++
    })

  // Column widths
  sheet.getColumn(1).width = 35
  sheet.getColumn(2).width = 12
  sheet.getColumn(3).width = 12
  sheet.getColumn(4).width = 12
  sheet.getColumn(5).width = 12
  sheet.getColumn(6).width = 15

  return sheet
}

/**
 * Create Weekly Plan Sheet
 */
function createWeeklyPlanSheet(workbook, sites) {
  const sheet = workbook.addWorksheet('Weekly Plan')

  // Filter sites with weekly plan
  const plannedSites = sites.filter(s => s.weekly_plan && s.weekly_plan.trim())

  const planColumns = [
    { key: 'site_id', header: 'Site ID', width: 15 },
    { key: 'final_site_name', header: 'Site Name', width: 25 },
    { key: 'phase_name', header: 'Phase', width: 12 },
    { key: 'weekly_plan', header: 'Weekly Plan', width: 20 },
    { key: 'tssr_subcon', header: 'Contractor', width: 25 },
    { key: 'tssr_overall_status', header: 'Status', width: 30 },
    { key: 'governorate', header: 'Governorate', width: 15 },
    { key: 'priority', header: 'Priority', width: 10 }
  ]

  sheet.columns = planColumns
  sheet.addRow(planColumns.map(c => c.header))

  plannedSites.forEach(site => {
    sheet.addRow(planColumns.map(c => site[c.key] ?? ''))
  })

  // Format header
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: COLORS.headerText } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.headerBg }
  }

  planColumns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width
  })

  return sheet
}

/**
 * Generate full report with all sheets
 */
async function generateFullReport(sites, outputPath) {
  const workbook = new ExcelJS.Workbook()

  // Set workbook properties
  workbook.creator = 'TSSR Monitor'
  workbook.created = new Date()
  workbook.modified = new Date()

  try {
    // Create sheets
    createMasterSheet(workbook, sites)
    createDashboardSheet(workbook, sites)
    createPendingSheet(workbook, sites)
    createRejectionSheet(workbook, sites)
    createCustomerReportSheet(workbook, sites)
    createNokiaReportSheet(workbook, sites)
    createContractorSummarySheet(workbook, sites)
    createWeeklyPlanSheet(workbook, sites)

    // Save workbook
    await workbook.xlsx.writeFile(outputPath)

    return {
      success: true,
      path: outputPath,
      sheetsCreated: workbook.worksheets.length,
      totalRows: sites.length
    }
  } catch (error) {
    console.error('Error generating full report:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate phase-specific report
 */
async function generatePhaseReport(sites, phase, outputPath) {
  const filteredSites = phase && phase !== 'ALL'
    ? sites.filter(s => s.phase_name === phase)
    : sites

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'TSSR Monitor'
  workbook.created = new Date()

  try {
    const summary = calculateSummary(filteredSites)

    // Create single sheet with summary header
    const sheet = workbook.addWorksheet(`Phase ${phase || 'ALL'}`)

    // Add summary at top
    sheet.getCell('A1').value = `Phase: ${phase || 'ALL'}`
    sheet.getCell('A1').font = { bold: true, size: 14 }

    sheet.getCell('A2').value = `Total: ${summary.total} | Approved: ${summary.approved} (${summary.approvalRate}%) | Pending: ${summary.pending}`
    sheet.getCell('A3').value = `Generated: ${new Date().toLocaleString()}`

    // Add data starting from row 5
    sheet.columns = COLUMN_HEADERS.map(col => ({ key: col.key, header: col.header, width: col.width }))

    const headerRow = sheet.getRow(5)
    COLUMN_HEADERS.forEach((col, index) => {
      headerRow.getCell(index + 1).value = col.header
    })
    headerRow.font = { bold: true, color: { argb: COLORS.headerText } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg }
    }

    filteredSites.forEach((site, index) => {
      const row = sheet.getRow(6 + index)
      COLUMN_HEADERS.forEach((col, colIndex) => {
        row.getCell(colIndex + 1).value = site[col.key] ?? ''
      })
    })

    // Set column widths
    COLUMN_HEADERS.forEach((col, index) => {
      sheet.getColumn(index + 1).width = col.width
    })

    await workbook.xlsx.writeFile(outputPath)

    return {
      success: true,
      path: outputPath,
      phase,
      totalRows: filteredSites.length
    }
  } catch (error) {
    console.error('Error generating phase report:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate custom report with user-defined columns and filters
 */
async function generateCustomReport(sites, config, outputPath) {
  const { filters = {}, columns = [], groupBy = null } = config

  // Apply filters
  let filteredSites = [...sites]

  if (filters.governorate && filters.governorate.length > 0) {
    filteredSites = filteredSites.filter(s => filters.governorate.includes(s.governorate))
  }
  if (filters.phase && filters.phase.length > 0) {
    filteredSites = filteredSites.filter(s => filters.phase.includes(s.phase_name))
  }
  if (filters.status && filters.status.length > 0) {
    filteredSites = filteredSites.filter(s => filters.status.includes(s.tssr_overall_status))
  }
  if (filters.contractor && filters.contractor.length > 0) {
    filteredSites = filteredSites.filter(s => filters.contractor.includes(s.tssr_subcon))
  }

  // Determine columns to use
  const selectedColumns = columns.length > 0
    ? COLUMN_HEADERS.filter(col => columns.includes(col.key))
    : COLUMN_HEADERS

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'TSSR Monitor'
  workbook.created = new Date()

  try {
    if (groupBy && ['governorate', 'phase_name', 'tssr_subcon'].includes(groupBy)) {
      // Group data into separate sheets
      const groups = {}
      filteredSites.forEach(site => {
        const groupValue = site[groupBy] || 'Unknown'
        if (!groups[groupValue]) groups[groupValue] = []
        groups[groupValue].push(site)
      })

      Object.entries(groups).forEach(([groupName, groupSites]) => {
        const sheetName = groupName.substring(0, 31) // Excel sheet name limit
        const sheet = workbook.addWorksheet(sheetName)

        sheet.columns = selectedColumns
        sheet.addRow(selectedColumns.map(c => c.header))

        groupSites.forEach(site => {
          sheet.addRow(selectedColumns.map(c => site[c.key] ?? ''))
        })

        // Format header
        const headerRow = sheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: COLORS.headerText } }
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.headerBg }
        }

        selectedColumns.forEach((col, index) => {
          sheet.getColumn(index + 1).width = col.width
        })
      })
    } else {
      // Single sheet
      const sheet = workbook.addWorksheet('Custom Export')

      sheet.columns = selectedColumns
      sheet.addRow(selectedColumns.map(c => c.header))

      filteredSites.forEach(site => {
        sheet.addRow(selectedColumns.map(c => site[c.key] ?? ''))
      })

      // Format header
      const headerRow = sheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: COLORS.headerText } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg }
      }

      selectedColumns.forEach((col, index) => {
        sheet.getColumn(index + 1).width = col.width
      })

      addAutoFilter(sheet, selectedColumns.length)
    }

    await workbook.xlsx.writeFile(outputPath)

    return {
      success: true,
      path: outputPath,
      totalRows: filteredSites.length,
      sheetsCreated: workbook.worksheets.length
    }
  } catch (error) {
    console.error('Error generating custom report:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate default filename with timestamp
 */
function generateFilename(prefix = 'TSSR_Report') {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:T]/g, '').substring(0, 15)
  return `${prefix}_${timestamp}.xlsx`
}

module.exports = {
  generateFullReport,
  generatePhaseReport,
  generateCustomReport,
  generateFilename,
  getColumnHeaders,
  mapSiteToRow,
  calculateSummary,
  applyFormatting,
  COLUMN_HEADERS,
  COLORS
}
