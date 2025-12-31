/**
 * Reports Page - Configuration and Constants
 */

// Color palette for charts - matches status smoke colors
export const CHART_COLORS = {
  approved: '#8FD9D9',
  underZain: '#EAB308',
  underRom: '#F97316',
  underNokiaNpo: '#3B82F6',
  underNokiaRom: '#E2E8F0',
  underNokiaGsd: '#8B5CF6',
  underSubcon: '#EC4899',
  notSurveyed: '#6B7280',
  needAccess: '#EF4444',
  rejected: '#EF4444',
  pending: '#F59E0B',
  default: '#8FD9D9'
}

export const STATUS_COLORS = [
  '#8FD9D9', '#EAB308', '#F97316', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6B7280', '#EF4444', '#06B6D4', '#14B8A6'
]

// Column mappings - ALL 68 columns from Master Sheet
export const COLUMN_MAP = {
  // Site Information
  'Site ID': 'site_id',
  'Final Site Name': 'final_site_name',
  'Site Code': 'site_code',
  'Site Type': 'site_type',
  'Key Number': 'key_number',
  
  // Location
  'Longitude': 'longitude',
  'Latitude': 'latitude',
  'Governorate': 'governorate',
  
  // Structure
  'Structure Type': 'structure_type',
  'Height (m)': 'height',
  'Part Of': 'part_of',
  
  // Ownership
  'Site Owner': 'site_owner',
  'Owner Name': 'owner_name',
  'Owner Contact Number': 'owner_contact_number',
  
  // Project
  'Phase Name': 'phase_name',
  'Priority': 'priority',
  'Cluster': 'cluster',
  'Area': 'area',
  'Weekly Plan': 'weekly_plan',
  
  // Technical
  'TSS SMP': 'tss_smp',
  'TSSR Subcon': 'tssr_subcon',
  'NEW Allocation': 'new_allocation',
  'TSSR PO#': 'tssr_po',
  
  // 5G Information
  '5G Sectors Names': '5g_sectors_names',
  '5G Solution': '5g_solution',
  'Site Sectors #': 'site_sectors',
  'IBS Sector': 'ibs_sector',
  'TDD Site': 'tdd_site',
  
  // Nokia Status
  'Nokia NPO Status': 'nokia_npo_status',
  'Nokia NPO Comment': 'nokia_npo_comment',
  'Nokia Site Owner': 'nokia_site_owner',
  
  // TI Department
  'TI Status': 'ti_status',
  'TI Comment': 'ti_comment',
  'Cluster Owner (TI)': 'cluster_owner_ti',
  
  // RF Planning Department
  'RF Plan Status': 'rf_plan_status',
  'RF Plan Comment': 'rf_plan_comment',
  'Cluster Owner (Planning)': 'cluster_owner_planning',
  
  // RF Optimization Department
  'RF Optim Status': 'rf_opt_status',
  'RF Opt. Comment': 'rf_opt_comment',
  'Cluster Owner (Optimization)': 'cluster_owner_optimization',
  
  // Civil Department
  'Civil Status': 'civil_status',
  'Civil Comment': 'civil_comment',
  'Cluster Owner (Civil)': 'cluster_owner_civil',
  
  // Microwave Department
  'MW Status': 'mw_status',
  'Cluster Owner (MW)': 'cluster_owner_mw',
  
  // TSSR Status
  'TSSR Overall Status': 'tssr_overall_status',
  'TSSR Status Date': 'tssr_status_date',
  'TSSR Remark': 'tssr_remark',
  'Action Age': 'action_age',
  
  // Additional Fields
  'RFI Status': 'rfi_status',
  'Gap Analysis': 'gap_analysis',
  'Approved': 'approved',
  'TSSR Ready': 'tssr_ready',
  'Dismantle Status': 'dismantle_status',
  'Version': 'version',
  'Structure': 'structure',
}

// Firebase field mappings
export const FIREBASE_MAP = {
  'site_id': 'siteId',
  'final_site_name': 'finalSiteName',
  'governorate': 'governorate',
  'phase_name': 'phaseName',
  'priority': 'priority',
  'tssr_subcon': 'tssrSubcon',
  'tssr_overall_status': 'tssrOverallStatus',
  'ti_status': 'tiStatus',
  'rf_plan_status': 'rfPlanStatus',
  'rf_opt_status': 'rfOptimStatus',
  'civil_status': 'civilStatus',
  'mw_status': 'mwStatus',
  'part_of': 'partOf',
  'version': 'version',
}

// Available columns for custom report
export const AVAILABLE_COLUMNS = Object.keys(COLUMN_MAP)

// Report Templates
export const REPORT_TEMPLATES = [
  {
    id: 'all-approved',
    name: 'All Approved Sites',
    icon: '\u2705',
    description: 'Sites with TSSR Approved status',
    columns: ['Site ID', 'Final Site Name', 'Governorate', 'TSSR Subcon', 'Phase Name', 'Priority'],
    filter: { field: 'tssr_overall_status', operator: 'equals', value: 'Approved' }
  },
  {
    id: 'pending-sites',
    name: 'Pending Approval',
    icon: '\u231B',
    description: 'Sites under review or pending',
    columns: ['Site ID', 'Final Site Name', 'TSSR Overall Status', 'TI Status', 'RF Plan Status', 'Civil Status'],
    filter: { field: 'tssr_overall_status', operator: 'contains', value: 'Under' }
  },
  {
    id: 'rejected-sites',
    name: 'Rejected Sites',
    icon: '\u274C',
    description: 'Sites with rejected department status',
    columns: ['Site ID', 'Final Site Name', 'TI Status', 'RF Plan Status', 'RF Opt Status', 'Civil Status', 'MW Status'],
    filter: { field: 'has_rejection', operator: 'equals', value: true }
  },
  {
    id: 'by-governorate',
    name: 'Sites by Governorate',
    icon: '\uD83D\uDDFA\uFE0F',
    description: 'Summary report grouped by governorate',
    columns: ['Site ID', 'Final Site Name', 'Governorate', 'TSSR Overall Status', 'TSSR Subcon'],
    filter: null
  },
  {
    id: 'by-contractor',
    name: 'Sites by Contractor',
    icon: '\uD83D\uDC77',
    description: 'All sites grouped by contractor',
    columns: ['Site ID', 'Final Site Name', 'TSSR Subcon', 'TSSR Overall Status', 'Priority'],
    filter: null
  },
  {
    id: 'department-status',
    name: 'Department Status',
    icon: '\uD83C\uDFE2',
    description: 'Full department status breakdown',
    columns: ['Site ID', 'Final Site Name', 'TI Status', 'RF Plan Status', 'RF Opt Status', 'Civil Status', 'MW Status'],
    filter: null
  }
]
