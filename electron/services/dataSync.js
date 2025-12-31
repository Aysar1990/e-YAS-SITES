const cron = require('node-cron')
const excelReader = require('./excelReader')
const db = require('../database/db')
const settingsQueries = require('../database/queries/settings')
const rejectionsQueries = require('../database/queries/rejections')

class DataSyncService {
  constructor() {
    this.syncTask = null
    this.isRunning = false
    this.mainWindow = null
  }

  start(mainWindow) {
    this.mainWindow = mainWindow
    const syncInterval = settingsQueries.getSetting('sync_interval') || '5'
    const cronExpression = `*/${syncInterval} * * * *`

    this.syncTask = cron.schedule(cronExpression, () => {
      this.syncData()
    })

    console.log(`⏰ Auto-sync started (every ${syncInterval} minutes)`)
  }

  stop() {
    if (this.syncTask) {
      this.syncTask.stop()
      console.log('⏹️ Auto-sync stopped')
    }
  }

  restart() {
    this.stop()
    this.start(this.mainWindow)
  }

  async syncData() {
    if (this.isRunning) {
      console.log('⚠️ Sync already running, skipping...')
      return { success: false, error: 'Sync already in progress' }
    }

    this.isRunning = true
    console.log('🔄 Starting data sync...')

    try {
      const excelPath = settingsQueries.getSetting('excel_path')

      if (!excelPath) {
        throw new Error('Excel path not configured')
      }

      const sites = excelReader.getAllData(excelPath)

      if (sites.length === 0) {
        throw new Error('No data found in Excel file')
      }

      const database = db.getDB()

      // Use composite key: site_id + phase_name
      const selectStmt = database.prepare('SELECT * FROM sites WHERE site_id = ? AND phase_name = ?')

      // INSERT OR REPLACE using the UNIQUE constraint on (site_id, phase_name)
      const insertStmt = database.prepare(`
        INSERT INTO sites
        (site_id, final_site_name, site_code, site_type, key_number, longitude, latitude,
         governorate, structure, structure_type, part_of, height_m, site_owner, phase_name, priority,
         cluster, area, weekly_plan, tss_smp, tssr_subcon, tssr_po, ts_survey_ac,
         tssr_overall_status, tssr_status_date, tssr_remark, action_age,
         five_g_sectors_names, five_g_solution, site_sectors, ibs_sector, tdd_site, version, rec_cab_swap,
         ti_status, ti_comment, cluster_owner_ti,
         rf_plan_status, rf_plan_comment, cluster_owner_planning,
         rf_opt_status, rf_opt_comment, cluster_owner_optimization,
         civil_status, civil_comment, cluster_owner_civil,
         mw_status, cluster_owner_mw,
         nokia_npo_status, nokia_npo_comment, nokia_site_owner,
         rfi_status, gap_analysis, approved, tssr_ready, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(site_id, phase_name) DO UPDATE SET
          final_site_name = excluded.final_site_name,
          site_code = excluded.site_code,
          site_type = excluded.site_type,
          key_number = excluded.key_number,
          longitude = excluded.longitude,
          latitude = excluded.latitude,
          governorate = excluded.governorate,
          structure = excluded.structure,
          structure_type = excluded.structure_type,
          part_of = excluded.part_of,
          height_m = excluded.height_m,
          site_owner = excluded.site_owner,
          priority = excluded.priority,
          cluster = excluded.cluster,
          area = excluded.area,
          weekly_plan = excluded.weekly_plan,
          tss_smp = excluded.tss_smp,
          tssr_subcon = excluded.tssr_subcon,
          tssr_po = excluded.tssr_po,
          ts_survey_ac = excluded.ts_survey_ac,
          tssr_overall_status = excluded.tssr_overall_status,
          tssr_status_date = excluded.tssr_status_date,
          tssr_remark = excluded.tssr_remark,
          action_age = excluded.action_age,
          five_g_sectors_names = excluded.five_g_sectors_names,
          five_g_solution = excluded.five_g_solution,
          site_sectors = excluded.site_sectors,
          ibs_sector = excluded.ibs_sector,
          tdd_site = excluded.tdd_site,
          version = excluded.version,
          rec_cab_swap = excluded.rec_cab_swap,
          ti_status = excluded.ti_status,
          ti_comment = excluded.ti_comment,
          cluster_owner_ti = excluded.cluster_owner_ti,
          rf_plan_status = excluded.rf_plan_status,
          rf_plan_comment = excluded.rf_plan_comment,
          cluster_owner_planning = excluded.cluster_owner_planning,
          rf_opt_status = excluded.rf_opt_status,
          rf_opt_comment = excluded.rf_opt_comment,
          cluster_owner_optimization = excluded.cluster_owner_optimization,
          civil_status = excluded.civil_status,
          civil_comment = excluded.civil_comment,
          cluster_owner_civil = excluded.cluster_owner_civil,
          mw_status = excluded.mw_status,
          cluster_owner_mw = excluded.cluster_owner_mw,
          nokia_npo_status = excluded.nokia_npo_status,
          nokia_npo_comment = excluded.nokia_npo_comment,
          nokia_site_owner = excluded.nokia_site_owner,
          rfi_status = excluded.rfi_status,
          gap_analysis = excluded.gap_analysis,
          approved = excluded.approved,
          tssr_ready = excluded.tssr_ready,
          updated_at = CURRENT_TIMESTAMP
      `)

      let recordsSynced = 0
      let newRejections = []

      // Debug: Count Part Of values being synced
      const partOfCounts = {}
      sites.forEach(s => {
        const po = s.partOf || 'EMPTY/NULL'
        partOfCounts[po] = (partOfCounts[po] || 0) + 1
      })
      console.log('📊 Part Of values being synced:', JSON.stringify(partOfCounts, null, 2))

      const transaction = database.transaction((sitesArray) => {
        for (const site of sitesArray) {
          // Use composite key for lookup
          const existing = selectStmt.get(site.siteId, site.phaseName || '')

          insertStmt.run(
            site.siteId,
            site.finalSiteName,
            site.siteCode,
            site.siteType,
            site.keyNumber,
            site.longitude,
            site.latitude,
            site.governorate,
            site.structure,
            site.structureType,
            site.partOf,
            site.heightM,
            site.siteOwner,
            site.phaseName || '',
            site.priority,
            site.cluster,
            site.area,
            site.weeklyPlan,
            site.tssSmp,
            site.tssrSubcon,
            site.tssrPo,
            site.tsSurveyAc,
            site.tssrOverallStatus,
            site.tssrStatusDate,
            site.tssrRemark,
            site.actionAge,
            site.fiveGSectorsNames,
            site.fiveGSolution,
            site.siteSectors,
            site.ibsSector,
            site.tddSite,
            site.version,
            site.recCabSwap,
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
              { name: 'MW', status: site.mwStatus, oldStatus: existing.mw_status, comment: '' },
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
      logStmt.run('success', 'Data synced successfully', recordsSynced)

      console.log(`✅ Sync completed: ${recordsSynced} records, ${newRejections.length} new rejections`)

      // Notify renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('sync-complete', {
          success: true,
          recordsSynced,
          newRejections,
          timestamp: new Date().toISOString(),
        })
      }

      return {
        success: true,
        recordsSynced,
        newRejections,
      }
    } catch (error) {
      console.error('❌ Sync error:', error.message)

      // Log error
      try {
        const database = db.getDB()
        const logStmt = database.prepare(`
          INSERT INTO sync_log (status, message, records_synced)
          VALUES (?, ?, ?)
        `)
        logStmt.run('error', error.message, 0)
      } catch (logError) {
        console.error('Failed to log sync error:', logError)
      }

      // Notify renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('sync-complete', {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      }

      return {
        success: false,
        error: error.message,
      }
    } finally {
      this.isRunning = false
    }
  }

  manualSync() {
    return this.syncData()
  }
}

module.exports = new DataSyncService()
