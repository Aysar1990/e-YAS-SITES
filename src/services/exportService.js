/**
 * Export Service for TSSR Monitor
 * Handles exporting database data to Excel files
 */

import * as XLSX from 'xlsx';

// Field display names for Excel headers (database field → Excel column name)
const FIELD_TO_EXCEL = {
  siteId: 'Site ID',
  finalSiteName: 'Final Site Name',
  governorate: 'Governorate',
  tssrOverallStatus: 'TSSR Overall Status',
  siteCode: 'Site Code',
  siteType: 'Site Type',
  keyNumber: 'Key Number',
  longitude: 'Long',
  latitude: 'Lat',
  structure: 'Structure',
  structureType: 'Structure Type',
  partOf: 'Part of',
  heightM: 'Height (m)',
  siteOwner: 'Site Owner',
  phaseName: 'Phase Name',
  priority: 'Priority',
  cluster: 'Cluster',
  area: 'Area',
  weeklyPlan: 'Weekly Plan',
  tssSmp: 'TSS SMP',
  tssrSubcon: 'TSSR Subcon',
  tssrPo: 'TSSR PO#',
  tsSurveyAc: 'TS Survey (Ac)',
  tssrStatusDate: 'TSSR status Date',
  tssrRemark: 'TSSR Remark',
  actionAge: 'Action Age',
  fiveGSectorsNames: '5G sectors Names',
  fiveGSolution: '5G solution',
  siteSectors: 'Site Sectors #',
  ibsSector: 'IBS Sector',
  tddSite: 'TDD Site',
  version: 'Version',
  recCabSwap: 'REC. Cab. Swap',
  tiStatus: 'TI Status',
  tiComment: 'TI Comment',
  clusterOwnerTI: 'Cluster Owner (TI)',
  rfPlanStatus: 'RF Plan. Status',
  rfPlanComment: 'RF Plan. Comment',
  clusterOwnerPlanning: 'Cluster Owner (Planing)',
  rfOptimStatus: 'RF Optim Status',
  rfOptimComment: 'RF Opt. comment',
  clusterOwnerOptimization: 'Cluster Owner (Optimization)',
  civilStatus: 'Civil Status',
  civilComment: 'Civil Comment',
  clusterOwnerCivil: 'Cluster Owner (Civil)',
  mwStatus: 'MW Status',
  mwComment: 'MW Comment',
  clusterOwnerMW: 'Cluster Owner (MW)',
  nokiaNpoStatus: 'Nokia NPO Status',
  nokiaNpoComment: 'Nokia NPO Comment',
  nokiaSiteOwner: 'Nokia Site Owner',
  rfiStatus: 'RFI Status',
  gapAnalysis: 'Gap Analysis',
  approved: 'Approved',
  tssrReady: 'TSSR Ready'
};

// Column order for export (matches original Excel structure)
const COLUMN_ORDER = [
  'siteId',
  'finalSiteName',
  'siteCode',
  'keyNumber',
  'governorate',
  'area',
  'cluster',
  'latitude',
  'longitude',
  'structure',
  'structureType',
  'heightM',
  'partOf',
  'phaseName',
  'priority',
  'siteOwner',
  'weeklyPlan',
  'tssrSubcon',
  'tssrPo',
  'tssSmp',
  'tsSurveyAc',
  'tssrStatusDate',
  'tssrOverallStatus',
  'tiStatus',
  'tiComment',
  'clusterOwnerTI',
  'rfPlanStatus',
  'rfPlanComment',
  'clusterOwnerPlanning',
  'rfOptimStatus',
  'rfOptimComment',
  'clusterOwnerOptimization',
  'civilStatus',
  'civilComment',
  'clusterOwnerCivil',
  'mwStatus',
  'mwComment',
  'clusterOwnerMW',
  'nokiaNpoStatus',
  'nokiaNpoComment',
  'nokiaSiteOwner',
  'fiveGSectorsNames',
  'fiveGSolution',
  'siteSectors',
  'ibsSector',
  'tddSite',
  'version',
  'recCabSwap',
  'rfiStatus',
  'gapAnalysis',
  'tssrRemark',
  'actionAge',
  'approved',
  'tssrReady'
];

/**
 * Convert Firebase sites to Excel rows
 * @param {Array} sites - Array of Firebase site documents
 * @returns {Array} Array of row objects with Excel headers
 */
const convertSitesToRows = (sites) => {
  return sites.map(site => {
    const row = {};
    COLUMN_ORDER.forEach(field => {
      const excelHeader = FIELD_TO_EXCEL[field] || field;
      row[excelHeader] = site[field] ?? '';
    });
    return row;
  });
};

/**
 * Export sites to Excel file
 * @param {Array} sites - Array of Firebase site documents
 * @param {string} phase - Phase name for filename
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<{success: boolean, filename?: string, error?: string}>}
 */
export const exportToExcel = async (sites, phase = 'RO4', onProgress = null) => {
  try {
    if (!sites || sites.length === 0) {
      return { success: false, error: 'No sites to export' };
    }

    if (onProgress) onProgress({ status: 'preparing', progress: 0 });

    // Convert sites to Excel rows
    const rows = convertSitesToRows(sites);

    if (onProgress) onProgress({ status: 'converting', progress: 30 });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    const colWidths = COLUMN_ORDER.map(field => {
      const header = FIELD_TO_EXCEL[field] || field;
      return { wch: Math.max(header.length, 15) };
    });
    ws['!cols'] = colWidths;

    if (onProgress) onProgress({ status: 'creating', progress: 60 });

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TSSR Data');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `TSSR_Export_${phase}_${timestamp}.xlsx`;

    if (onProgress) onProgress({ status: 'saving', progress: 80 });

    // Write file
    XLSX.writeFile(wb, filename);

    if (onProgress) onProgress({ status: 'complete', progress: 100 });

    return {
      success: true,
      filename,
      sitesCount: sites.length
    };
  } catch (error) {
    console.error('[ExportService] Export error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export sites to Excel and trigger download in browser
 * @param {Array} sites - Array of Firebase site documents
 * @param {string} phase - Phase name for filename
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<{success: boolean, filename?: string, error?: string}>}
 */
export const exportToExcelDownload = async (sites, phase = 'RO4', onProgress = null) => {
  try {
    if (!sites || sites.length === 0) {
      return { success: false, error: 'No sites to export' };
    }

    if (onProgress) onProgress({ status: 'preparing', progress: 0, message: 'Preparing data...' });

    // Convert sites to Excel rows
    const rows = convertSitesToRows(sites);

    if (onProgress) onProgress({ status: 'converting', progress: 30, message: 'Converting data...' });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    const colWidths = COLUMN_ORDER.map(field => {
      const header = FIELD_TO_EXCEL[field] || field;
      return { wch: Math.max(header.length, 15) };
    });
    ws['!cols'] = colWidths;

    // Style header row (bold)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
      if (cell) {
        cell.s = { font: { bold: true } };
      }
    }

    if (onProgress) onProgress({ status: 'creating', progress: 60, message: 'Creating workbook...' });

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TSSR Data');

    // Add metadata sheet
    const metaData = [
      { Field: 'Export Date', Value: new Date().toLocaleString() },
      { Field: 'Phase', Value: phase },
      { Field: 'Total Sites', Value: sites.length },
      { Field: 'Exported By', Value: 'TSSR Monitor' }
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, 'Export Info');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `TSSR_Export_${phase}_${timestamp}.xlsx`;

    if (onProgress) onProgress({ status: 'saving', progress: 80, message: 'Generating file...' });

    // Generate buffer and create download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onProgress) onProgress({ status: 'complete', progress: 100, message: 'Export complete!' });

    return {
      success: true,
      filename,
      sitesCount: sites.length
    };
  } catch (error) {
    console.error('[ExportService] Export error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  exportToExcel,
  exportToExcelDownload,
  FIELD_TO_EXCEL,
  COLUMN_ORDER
};
