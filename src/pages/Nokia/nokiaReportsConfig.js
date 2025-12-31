/**
 * Nokia Reports Configuration
 * Constants and column mappings
 * Extracted from NokiaReports.jsx
 */

// Column mappings: display name -> database field name
export const COLUMN_MAP = {
  'Site ID': 'site_id',
  'Final Site Name': 'final_site_name',
  'Site Owner': 'site_owner',
  'Site Code': 'site_code',
  'Site Type': 'site_type',
  'Key Number': 'key_number',
  'Longitude': 'longitude',
  'Latitude': 'latitude',
  'Governorate': 'governorate',
  'Structure': 'structure',
  'Structure Type': 'structure_type',
  'Part Of': 'part_of',
  'Phase Name': 'phase_name',
  'Priority': 'priority',
  'Cluster': 'cluster',
  'TSS SMP': 'tss_smp',
  'TSSR Subcon': 'tssr_subcon',
  'TSSR PO': 'tssr_po',
  'TS Survey (Ac)': 'ts_survey_ac',
  '5G Sectors Names': 'five_g_sectors_names',
  '5G Solution': 'five_g_solution',
  'Site Sectors': 'site_sectors',
  'IBS Sector': 'ibs_sector',
  'TDD Site': 'tdd_site',
  'Version': 'version',
  'REC Cab Swap': 'rec_cab_swap',
  'TSSR Overall Status': 'tssr_overall_status',
  'TSSR Status Date': 'tssr_status_date',
  'TI Status': 'ti_status',
  'TI Comment': 'ti_comment',
  'Cluster Owner (TI)': 'cluster_owner_ti',
  'RF Plan Status': 'rf_plan_status',
  'RF Plan Comment': 'rf_plan_comment',
  'Cluster Owner (Planning)': 'cluster_owner_planning',
  'RF Opt Status': 'rf_opt_status',
  'RF Opt Comment': 'rf_opt_comment',
  'Cluster Owner (Optimization)': 'cluster_owner_optimization',
  'Civil Status': 'civil_status',
  'Civil Comment': 'civil_comment',
  'Cluster Owner (Civil)': 'cluster_owner_civil',
  'MW Status': 'mw_status',
  'MW Comment': 'mw_comment',
  'Cluster Owner (MW)': 'cluster_owner_mw',
}

// Column definitions for each report type
export const TSSR_PROGRESS_COLUMNS = [
  'Site ID', 'Final Site Name', 'Site Owner', 'Site Code', 'Site Type',
  'Key Number', 'Longitude', 'Latitude', 'Governorate', 'Structure', 'Part Of',
  'Phase Name', 'Priority', 'Cluster', 'TSS SMP', 'TSSR Subcon', 'TSSR PO',
  'TS Survey (Ac)', '5G Sectors Names', 'IBS Sector', 'TDD Site', 'Version',
  'TSSR Overall Status', 'TSSR Status Date'
]

export const PENDING_COLUMNS = [
  'Site ID', 'Final Site Name', 'Site Owner', 'Site Code', 'Site Type',
  'Key Number', 'Longitude', 'Latitude', 'Governorate', 'Structure', 'Part Of',
  'Phase Name', 'Priority', 'Cluster', 'TI Status', 'TI Comment',
  'Cluster Owner (TI)', 'RF Plan Status', 'RF Plan Comment', 'Cluster Owner (Planning)',
  'RF Opt Status', 'RF Opt Comment', 'Cluster Owner (Optimization)',
  'Civil Status', 'Civil Comment', 'Cluster Owner (Civil)', 'MW Status',
  'Cluster Owner (MW)', 'TSSR Overall Status', 'TSSR Status Date'
]

export const REJECTION_COLUMNS = [
  'Site ID', 'Final Site Name', 'Site Owner', 'Site Code', 'Site Type',
  'Key Number', 'Longitude', 'Latitude', 'Governorate', 'Structure', 'Part Of',
  'Phase Name', 'Priority', 'Cluster', 'TSS SMP', 'TSSR Subcon', 'TSSR PO',
  '5G Sectors Names', '5G Solution', 'Site Sectors', 'IBS Sector', 'TDD Site',
  'TI Status', 'TI Comment', 'RF Plan Status', 'RF Plan Comment',
  'RF Opt Status', 'RF Opt Comment', 'Civil Status', 'Civil Comment',
  'MW Status', 'REC Cab Swap', 'TSSR Overall Status', 'TSSR Status Date'
]

// Report type definitions
export const REPORT_TYPES = [
  {
    id: 'tssrProgress',
    icon: '📊',
    nameKey: 'reports.tssrProgress.title',
    descKey: 'reports.tssrProgress.description',
  },
  {
    id: 'pendingTssr',
    icon: '⏳',
    nameKey: 'reports.pendingTssr.title',
    descKey: 'reports.pendingTssr.description',
  },
  {
    id: 'rejection',
    icon: '❌',
    nameKey: 'reports.rejection.title',
    descKey: 'reports.rejection.description',
  },
]

export default {
  COLUMN_MAP,
  TSSR_PROGRESS_COLUMNS,
  PENDING_COLUMNS,
  REJECTION_COLUMNS,
  REPORT_TYPES
}
