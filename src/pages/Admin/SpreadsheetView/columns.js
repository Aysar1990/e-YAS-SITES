/**
 * Column Definitions for SpreadsheetView
 * Matches columnDefinitions.js (65 columns)
 *
 * IMPORTANT: Keep in sync with columnDefinitions.js
 */

export const ALL_COLUMNS = [
  // ═══════════════════════════════════════════════════════════════════
  // Site Identification (6 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'site_id', headerName: 'Site ID', pinned: 'left', width: 120, editable: false },
  { field: 'final_site_name', headerName: 'Final Site Name', width: 200, editable: true },
  { field: 'site_owner', headerName: 'Site Owner', width: 150, editable: true },
  { field: 'site_code', headerName: 'Site Code', width: 120, editable: true },
  { field: 'site_type', headerName: 'Site Type', width: 120, editable: true },
  { field: 'key_number', headerName: 'Key Number', width: 120, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Location (3 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'longitude', headerName: 'Longitude', width: 120, editable: true, type: 'number' },
  { field: 'latitude', headerName: 'Latitude', width: 120, editable: true, type: 'number' },
  { field: 'governorate', headerName: 'Governorate', width: 150, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Structure & Owner Info (6 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'structure', headerName: 'Structure', width: 150, editable: true },
  { field: 'owner_name', headerName: 'Owner Name', width: 180, editable: true },
  { field: 'owner_contact_number', headerName: 'Owner Contact', width: 150, editable: true },
  { field: 'structure_type', headerName: 'Structure Type', width: 150, editable: true },
  { field: 'height_m', headerName: 'Height (m)', width: 100, editable: true, type: 'number' },
  { field: 'part_of', headerName: 'Part of', width: 150, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Project Info (5 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'phase_name', headerName: 'Phase Name', width: 120, editable: true },
  { field: 'priority', headerName: 'Priority', width: 100, editable: true, type: 'number' },
  { field: 'cluster', headerName: 'Cluster', width: 120, editable: true },
  { field: 'area', headerName: 'Area', width: 150, editable: true },
  { field: 'weekly_plan', headerName: 'Weekly Plan', width: 150, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // TSSR Info (5 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'tss_smp', headerName: 'TSS SMP', width: 150, editable: true },
  { field: 'tssr_subcon', headerName: 'TSSR Subcon', width: 200, editable: true },
  { field: 'new_allocation', headerName: 'NEW Allocation', width: 150, editable: true },
  { field: 'tssr_po', headerName: 'TSSR PO#', width: 120, editable: true },
  { field: 'ts_survey_ac', headerName: 'TS Survey (Ac)', width: 130, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Custom Fields (2 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'abcd', headerName: 'ABCD', width: 100, editable: true },
  { field: 'ab', headerName: 'AB', width: 80, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // 5G Info (5 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'five_g_sectors_names', headerName: '5G Sectors Names', width: 180, editable: true },
  { field: 'five_g_solution', headerName: '5G Solution', width: 150, editable: true },
  { field: 'site_sectors', headerName: 'Site Sectors #', width: 120, editable: true },
  { field: 'ibs_sector', headerName: 'IBS Sector', width: 120, editable: true },
  { field: 'tdd_site', headerName: 'TDD Site', width: 100, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Nokia Status (2 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'nokia_npo_status', headerName: 'Nokia NPO Status', width: 180, editable: true },
  { field: 'nokia_npo_comment', headerName: 'Nokia NPO Comment', width: 200, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // TI Department (3 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'ti_status', headerName: 'TI Status', width: 150, editable: true },
  { field: 'ti_comment', headerName: 'TI Comment', width: 200, editable: true },
  { field: 'cluster_owner_ti', headerName: 'Cluster Owner (TI)', width: 180, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // RF Planning Department (3 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'rf_plan_status', headerName: 'RF Plan Status', width: 150, editable: true },
  { field: 'rf_plan_comment', headerName: 'RF Plan Comment', width: 200, editable: true },
  { field: 'cluster_owner_planning', headerName: 'Cluster Owner (Planning)', width: 200, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // RF Optimization Department (3 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'rf_opt_status', headerName: 'RF Optim Status', width: 150, editable: true },
  { field: 'rf_opt_comment', headerName: 'RF Opt. Comment', width: 200, editable: true },
  { field: 'cluster_owner_optimization', headerName: 'Cluster Owner (Optimization)', width: 220, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Civil Department (3 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'civil_status', headerName: 'Civil Status', width: 150, editable: true },
  { field: 'civil_comment', headerName: 'Civil Comment', width: 200, editable: true },
  { field: 'cluster_owner_civil', headerName: 'Cluster Owner (Civil)', width: 180, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // MW Department (2 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'mw_status', headerName: 'MW Status', width: 150, editable: true },
  { field: 'cluster_owner_mw', headerName: 'Cluster Owner (MW)', width: 180, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Additional Info (4 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'rec_cab_swap', headerName: 'REC. Cab. Swap', width: 140, editable: true },
  { field: 'spoc_readiness', headerName: 'SPOC Readiness', width: 150, editable: true },
  { field: 'version', headerName: 'Version', width: 100, editable: true },
  { field: 'spoc_status', headerName: 'SPOC Status', width: 140, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // TSSR Status (6 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'tssr_overall_status', headerName: 'TSSR Overall Status', width: 200, editable: true },
  { field: 'tssr_status_date', headerName: 'TSSR Status Date', width: 150, editable: true },
  { field: 'spoc_reviewed', headerName: 'SPOC Reviewed', width: 140, editable: true },
  { field: 'week_number', headerName: 'Week Number', width: 120, editable: true },
  { field: 'tssr_remark', headerName: 'TSSR Remark', width: 200, editable: true },
  { field: 'action_age', headerName: 'Action Age', width: 120, editable: true, type: 'number' },

  // ═══════════════════════════════════════════════════════════════════
  // RFI & Approval (5 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'rfi_status', headerName: 'RFI Status', width: 150, editable: true },
  { field: 'gap_analysis', headerName: 'Gap Analysis', width: 150, editable: true },
  { field: 'approved', headerName: 'Approved', width: 100, editable: true },
  { field: 'nokia_site_owner', headerName: 'Nokia Site Owner', width: 180, editable: true },
  { field: 'tssr_ready', headerName: 'TSSR Ready', width: 120, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Dismantle Info (2 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'dismantle_status', headerName: 'Dismantle Status', width: 150, editable: true },
  { field: 'dismantle_date', headerName: 'Dismantle Date', width: 140, editable: true },

  // ═══════════════════════════════════════════════════════════════════
  // Validation & Zone (3 columns)
  // ═══════════════════════════════════════════════════════════════════
  { field: 'validate', headerName: 'Validate', width: 100, editable: true },
  { field: 'red_zone_sites', headerName: 'Red Zone Sites', width: 140, editable: true },
  { field: 'sequence', headerName: 'Sequence', width: 100, editable: true, type: 'number' }
]

// Total: 65 columns (matching columnDefinitions.js)
