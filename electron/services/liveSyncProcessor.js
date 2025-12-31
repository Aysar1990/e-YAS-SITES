/**
 * YAS TSSR Monitor - Live Sync Data Processor
 * Processes JSON data from Excel and updates the database
 */

const db = require('../database/db')
const rejectionsQueries = require('../database/queries/rejections')

class LiveSyncProcessor {
  constructor() {
    this.lastProcessedTime = null
  }

  /**
   * Process incoming data from Excel JSON
   */
  processData(jsonData) {
    if (!jsonData || !jsonData.data || jsonData.data.length === 0) {
      console.log('⚠️ No data to process')
      return { success: false, error: 'No data' }
    }

    const startTime = Date.now()
    console.log(`🔄 Processing ${jsonData.data.length} records from Excel...`)

    try {
      const database = db.getDB()
      const sites = this.transformData(jsonData.data)

      // Prepare statements
      const selectStmt = database.prepare('SELECT * FROM sites WHERE site_id = ?')
      const insertStmt = database.prepare(`
        INSERT OR REPLACE INTO sites
        (site_id, final_site_name, site_code, site_type, longitude, latitude,
         governorate, structure_type, height_m, site_owner, phase_name, priority,
         cluster, area, weekly_plan, tssr_subcon, tssr_overall_status, tssr_status_date,
         tssr_remark, action_age, ti_status, ti_comment, cluster_owner_ti,
         rf_plan_status, rf_plan_comment, cluster_owner_planning,
         rf_opt_status, rf_opt_comment, cluster_owner_optimization,
         civil_status, civil_comment, cluster_owner_civil,
         mw_status, mw_comment, cluster_owner_mw,
         nokia_npo_status, nokia_npo_comment, nokia_site_owner,
         rfi_status, gap_analysis, approved, tssr_ready, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)

      let recordsSynced = 0
      let newRejections = []

      const transaction = database.transaction((sitesArray) => {
        for (const site of sitesArray) {
          const existing = selectStmt.get(site.siteId)

          insertStmt.run(
            site.siteId,
            site.finalSiteName,
            site.siteCode,
            site.siteType,
            site.longitude,
            site.latitude,
            site.governorate,
            site.structureType,
            site.heightM,
            site.siteOwner,
            site.phaseName,
            site.priority,
            site.cluster,
            site.area,
            site.weeklyPlan,
            site.tssrSubcon,
            site.tssrOverallStatus,
            site.tssrStatusDate,
            site.tssrRemark,
            site.actionAge,
            site.tiStatus,
            site.tiComment,
            site.clusterOwnerTi,
            site.rfPlanStatus,
            site.rfPlanComment,
            site.clusterOwnerPlanning,
            site.rfOptStatus,
            site.rfOptComment,
            site.clusterOwnerOptimization,
            site.civilStatus,
            site.civilComment,
            site.clusterOwnerCivil,
            site.mwStatus,
            site.mwComment,
            site.clusterOwnerMw,
            site.nokiaNpoStatus,
            site.nokiaNpoComment,
            site.nokiaSiteOwner,
            site.rfiStatus,
            site.gapAnalysis,
            site.approved,
            site.tssrReady
          )

          recordsSynced++

          // Check for new rejections
          if (existing && site.tssrSubcon) {
            const departments = [
              { name: 'TI', status: site.tiStatus, oldStatus: existing.ti_status, comment: site.tiComment },
              { name: 'RF Planning', status: site.rfPlanStatus, oldStatus: existing.rf_plan_status, comment: site.rfPlanComment },
              { name: 'RF Optimization', status: site.rfOptStatus, oldStatus: existing.rf_opt_status, comment: site.rfOptComment },
              { name: 'Civil', status: site.civilStatus, oldStatus: existing.civil_status, comment: site.civilComment },
              { name: 'MW', status: site.mwStatus, oldStatus: existing.mw_status, comment: site.mwComment },
            ]

            departments.forEach((dept) => {
              if (dept.status === 'Rejected' && dept.oldStatus !== 'Rejected') {
                rejectionsQueries.insertRejection(
                  site.siteId,
                  site.tssrSubcon,
                  dept.name,
                  new Date().toISOString(),
                  dept.comment
                )

                newRejections.push({
                  siteId: site.siteId,
                  contractor: site.tssrSubcon,
                  department: dept.name,
                  comment: dept.comment,
                })
              }
            })
          }
        }
      })

      transaction(sites)

      // Log sync
      const logStmt = database.prepare(`
        INSERT INTO sync_log (status, message, records_synced)
        VALUES (?, ?, ?)
      `)
      logStmt.run('success', 'Live sync from Excel', recordsSynced)

      this.lastProcessedTime = new Date()
      const duration = Date.now() - startTime

      console.log(`✅ Live sync completed: ${recordsSynced} records in ${duration}ms`)
      
      if (newRejections.length > 0) {
        console.log(`🔴 ${newRejections.length} new rejections detected`)
      }

      return {
        success: true,
        recordsSynced,
        newRejections,
        duration
      }

    } catch (error) {
      console.error('❌ Live sync processing error:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Transform JSON data to match database schema
   */
  transformData(rawData) {
    return rawData.map(row => ({
      siteId: String(row.Site_ID || row.site_id || '').trim(),
      finalSiteName: row.Final_Site_Name || row.final_site_name || '',
      siteCode: row.Site_Code || row.site_code || '',
      siteType: row.Site_Type || row.site_type || '',
      longitude: parseFloat(row.Longitude || row.longitude) || null,
      latitude: parseFloat(row.Latitude || row.latitude) || null,
      governorate: row.Governorate || row.governorate || '',
      structureType: row.Structure_Type || row.structure_type || '',
      heightM: parseFloat(row.Height_m || row.height_m) || null,
      siteOwner: row.Site_Owner || row.site_owner || '',
      phaseName: row.Phase_Name || row.phase_name || '',
      priority: parseInt(row.Priority || row.priority) || 0,
      cluster: row.Cluster || row.cluster || '',
      area: row.Area || row.area || '',
      weeklyPlan: row.Weekly_Plan || row.weekly_plan || '',
      tssrSubcon: row.TSSR_Subcon || row.tssr_subcon || '',
      tssrOverallStatus: row.TSSR_Overall_Status || row.tssr_overall_status || '',
      tssrStatusDate: row.TSSR_Status_Date || row.tssr_status_date || '',
      tssrRemark: row.TSSR_Remark || row.tssr_remark || '',
      actionAge: parseInt(row.Action_Age || row.action_age) || 0,
      tiStatus: row.TI_Status || row.ti_status || '',
      tiComment: row.TI_Comment || row.ti_comment || '',
      clusterOwnerTi: row.Cluster_Owner_TI || row.cluster_owner_ti || '',
      rfPlanStatus: row.RF_Plan_Status || row.rf_plan_status || '',
      rfPlanComment: row.RF_Plan_Comment || row.rf_plan_comment || '',
      clusterOwnerPlanning: row.Cluster_Owner_Planning || row.cluster_owner_planning || '',
      rfOptStatus: row.RF_Optim_Status || row.RF_Opt_Status || row.rf_opt_status || '',
      rfOptComment: row.RF_Opt_Comment || row.rf_opt_comment || '',
      clusterOwnerOptimization: row.Cluster_Owner_Optimization || row.cluster_owner_optimization || '',
      civilStatus: row.Civil_Status || row.civil_status || '',
      civilComment: row.Civil_Comment || row.civil_comment || '',
      clusterOwnerCivil: row.Cluster_Owner_Civil || row.cluster_owner_civil || '',
      mwStatus: row.MW_Status || row.mw_status || '',
      mwComment: row.MW_Comment || row.mw_comment || '',
      clusterOwnerMw: row.Cluster_Owner_MW || row.cluster_owner_mw || '',
      nokiaNpoStatus: row.Nokia_NPO_Status || row.nokia_npo_status || '',
      nokiaNpoComment: row.Nokia_NPO_Comment || row.nokia_npo_comment || '',
      nokiaSiteOwner: row.Nokia_Site_Owner || row.nokia_site_owner || '',
      rfiStatus: row.RFI_Status || row.rfi_status || '',
      gapAnalysis: row.Gap_Analysis || row.gap_analysis || '',
      approved: row.Approved || row.approved ? 1 : 0,
      tssrReady: row.TSSR_Ready || row.tssr_ready ? 1 : 0,
    })).filter(site => site.siteId)
  }
}

module.exports = new LiveSyncProcessor()
