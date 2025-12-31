/**
 * ManagementReports Configuration
 * Constants and templates for reports page
 */

// Color palette for charts
export const CHART_COLORS = {
  approved: '#8FD9D9',
  pending: '#f59e0b',
  rejected: '#ef4444',
  underReview: '#FF8566',
  notSurveyed: '#6b7280',
  default: '#8b5cf6'
}

export const STATUS_COLORS = [
  '#8FD9D9', '#f59e0b', '#ef4444', '#FF8566', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#14b8a6'
]

// Column mappings
export const COLUMN_MAP = {
  'Site ID': 'site_id',
  'Final Site Name': 'final_site_name',
  'Site Owner': 'site_owner',
  'Governorate': 'governorate',
  'Phase Name': 'phase_name',
  'Priority': 'priority',
  'TSSR Subcon': 'tssr_subcon',
  'TSSR Overall Status': 'tssr_overall_status',
  'TI Status': 'ti_status',
  'RF Plan Status': 'rf_plan_status',
  'RF Opt Status': 'rf_opt_status',
  'Civil Status': 'civil_status',
  'MW Status': 'mw_status',
  'Part Of': 'part_of',
  'Version': 'version',
}

// Report Templates
export const REPORT_TEMPLATES = [
  {
    id: 'all-approved',
    name: 'All Approved Sites',
    icon: '✅',
    description: 'Sites with TSSR Approved status',
    columns: ['Site ID', 'Final Site Name', 'Governorate', 'TSSR Subcon', 'Phase Name', 'Priority'],
    filter: { field: 'tssr_overall_status', operator: 'equals', value: 'Approved' }
  },
  {
    id: 'pending-sites',
    name: 'Pending Approval',
    icon: '⏳',
    description: 'Sites under review or pending',
    columns: ['Site ID', 'Final Site Name', 'TSSR Overall Status', 'TI Status', 'RF Plan Status', 'Civil Status'],
    filter: { field: 'tssr_overall_status', operator: 'contains', value: 'Under' }
  },
  {
    id: 'by-governorate',
    name: 'Sites by Governorate',
    icon: '🗺️',
    description: 'Summary report grouped by governorate',
    columns: ['Site ID', 'Final Site Name', 'Governorate', 'TSSR Overall Status', 'TSSR Subcon'],
    filter: null
  },
  {
    id: 'department-status',
    name: 'Department Status',
    icon: '🏢',
    description: 'Full department status breakdown',
    columns: ['Site ID', 'Final Site Name', 'TI Status', 'RF Plan Status', 'RF Opt Status', 'Civil Status', 'MW Status'],
    filter: null
  }
]
