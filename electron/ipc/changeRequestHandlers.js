/**
 * Change Request IPC handlers
 * Handles: create-change-request, get-pending-requests, get-my-requests,
 *          approve-change-request, reject-change-request, get-request-history
 * @module electron/ipc/changeRequestHandlers
 */

const dbManager = require('../database/db')

// Field label mapping for human-readable display
const FIELD_LABELS = {
  tssr_overall_status: 'Overall Status',
  ti_status: 'TI Status',
  ti_comment: 'TI Comment',
  rf_plan_status: 'RF Plan Status',
  rf_plan_comment: 'RF Plan Comment',
  rf_optim_status: 'RF Optimization Status',
  rf_opt_comment: 'RF Optimization Comment',
  civil_status: 'Civil Status',
  civil_comment: 'Civil Comment',
  mw_status: 'MW Status',
  mw_comment: 'MW Comment',
  nokia_npo_status: 'Nokia NPO Status',
  nokia_npo_comment: 'Nokia NPO Comment',
  rfi_status: 'RFI Status',
  version: 'Version',
  tssr_remark: 'TSSR Remark',
  priority: 'Priority'
}

/**
 * Registers change request IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database manager instance
 * @param {Object} deps.sitesQueries - Sites queries module
 * @param {Function} deps.logAction - Audit logging function
 * @param {Function} deps.getMainWindow - Function to get main window for notifications
 */
function registerChangeRequestHandlers(ipcMain, deps) {
  const { db, sitesQueries, logAction, getMainWindow } = deps

  /**
   * Create a new change request (Client/Contractor)
   */
  ipcMain.handle('create-change-request', async (event, data) => {
    try {
      const { siteId, phaseName, fieldName, oldValue, newValue, requestedBy, requestedByRole } = data

      console.log(`📝 Creating change request: site=${siteId}, field=${fieldName}, by=${requestedBy}`)

      // Validate required fields
      if (!siteId || !fieldName || newValue === undefined || !requestedBy) {
        return { success: false, error: 'Missing required fields' }
      }

      // Get field label
      const fieldLabel = FIELD_LABELS[fieldName] || fieldName

      // Get Supabase client
      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required for change requests' }
      }

      const supabase = adapter.getSupabase()

      // Insert the change request
      const { data: insertedData, error } = await supabase
        .from('change_requests')
        .insert({
          site_id: siteId,
          phase_name: phaseName || null,
          field_name: fieldName,
          field_label: fieldLabel,
          old_value: oldValue !== undefined ? String(oldValue) : null,
          new_value: String(newValue),
          requested_by: requestedBy,
          requested_by_role: requestedByRole || 'contractor',
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Change request insert error:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Change request created: ID=${insertedData.id}`)

      // Log the action
      if (logAction) {
        logAction('change_request_created', {
          requestId: insertedData.id,
          siteId,
          fieldName,
          requestedBy
        })
      }

      // Notify admin (send to main window)
      const mainWindow = getMainWindow && getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('change-request-created', {
          request: insertedData,
          message: `New change request from ${requestedBy} for site ${siteId}`
        })
      }

      return { success: true, request: insertedData }
    } catch (error) {
      console.error('Create change request error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get all pending change requests (Admin)
   */
  ipcMain.handle('get-pending-requests', async (event, data = {}) => {
    try {
      const { limit = 100, offset = 0 } = data

      console.log(`📋 Getting pending change requests: limit=${limit}, offset=${offset}`)

      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required' }
      }

      const supabase = adapter.getSupabase()

      const { data: requests, error, count } = await supabase
        .from('change_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('❌ Get pending requests error:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Found ${requests.length} pending requests`)

      return { success: true, requests, total: count }
    } catch (error) {
      console.error('Get pending requests error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get requests for a specific user (Client view their own requests)
   */
  ipcMain.handle('get-my-requests', async (event, data) => {
    try {
      const { username, status, limit = 50 } = data

      if (!username) {
        return { success: false, error: 'Username required' }
      }

      console.log(`📋 Getting requests for user: ${username}, status=${status || 'all'}`)

      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required' }
      }

      const supabase = adapter.getSupabase()

      let query = supabase
        .from('change_requests')
        .select('*')
        .eq('requested_by', username)
        .order('requested_at', { ascending: false })
        .limit(limit)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: requests, error } = await query

      if (error) {
        console.error('❌ Get my requests error:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Found ${requests.length} requests for ${username}`)

      return { success: true, requests }
    } catch (error) {
      console.error('Get my requests error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Approve a change request (Admin)
   * Applies the change to the sites table
   */
  ipcMain.handle('approve-change-request', async (event, data) => {
    try {
      const { requestId, reviewedBy, comment } = data

      if (!requestId || !reviewedBy) {
        return { success: false, error: 'Request ID and reviewer required' }
      }

      console.log(`✅ Approving change request: ID=${requestId}, by=${reviewedBy}`)

      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required' }
      }

      const supabase = adapter.getSupabase()

      // 1. Get the change request
      const { data: request, error: fetchError } = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError || !request) {
        return { success: false, error: 'Change request not found' }
      }

      if (request.status !== 'pending') {
        return { success: false, error: `Request already ${request.status}` }
      }

      // 2. Apply the change to the sites table
      const updateData = {
        [request.field_name]: request.new_value
      }

      let siteQuery = supabase
        .from('sites')
        .update(updateData)
        .eq('site_id', request.site_id)

      if (request.phase_name) {
        siteQuery = siteQuery.eq('phase_name', request.phase_name)
      }

      const { error: updateError } = await siteQuery

      if (updateError) {
        console.error('❌ Site update error:', updateError)
        return { success: false, error: `Failed to apply change: ${updateError.message}` }
      }

      // 3. Update the change request status
      const { data: updatedRequest, error: statusError } = await supabase
        .from('change_requests')
        .update({
          status: 'approved',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          review_comment: comment || null
        })
        .eq('id', requestId)
        .select()
        .single()

      if (statusError) {
        console.error('❌ Status update error:', statusError)
        return { success: false, error: statusError.message }
      }

      console.log(`✅ Change request ${requestId} approved and applied`)

      // Log the action
      if (logAction) {
        logAction('change_request_approved', {
          requestId,
          siteId: request.site_id,
          fieldName: request.field_name,
          reviewedBy
        })
      }

      // Notify the requester
      const mainWindow = getMainWindow && getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('change-request-reviewed', {
          request: updatedRequest,
          action: 'approved',
          message: `Your change request for site ${request.site_id} has been approved`
        })
      }

      return { success: true, request: updatedRequest }
    } catch (error) {
      console.error('Approve change request error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Reject a change request (Admin)
   */
  ipcMain.handle('reject-change-request', async (event, data) => {
    try {
      const { requestId, reviewedBy, comment } = data

      if (!requestId || !reviewedBy) {
        return { success: false, error: 'Request ID and reviewer required' }
      }

      console.log(`❌ Rejecting change request: ID=${requestId}, by=${reviewedBy}`)

      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required' }
      }

      const supabase = adapter.getSupabase()

      // 1. Get the change request first
      const { data: request, error: fetchError } = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError || !request) {
        return { success: false, error: 'Change request not found' }
      }

      if (request.status !== 'pending') {
        return { success: false, error: `Request already ${request.status}` }
      }

      // 2. Update the change request status to rejected
      const { data: updatedRequest, error: updateError } = await supabase
        .from('change_requests')
        .update({
          status: 'rejected',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          review_comment: comment || 'Rejected by admin'
        })
        .eq('id', requestId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Reject update error:', updateError)
        return { success: false, error: updateError.message }
      }

      console.log(`✅ Change request ${requestId} rejected`)

      // Log the action
      if (logAction) {
        logAction('change_request_rejected', {
          requestId,
          siteId: request.site_id,
          fieldName: request.field_name,
          reviewedBy,
          reason: comment
        })
      }

      // Notify the requester
      const mainWindow = getMainWindow && getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('change-request-reviewed', {
          request: updatedRequest,
          action: 'rejected',
          message: `Your change request for site ${request.site_id} has been rejected`
        })
      }

      return { success: true, request: updatedRequest }
    } catch (error) {
      console.error('Reject change request error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get change request history with filters
   */
  ipcMain.handle('get-request-history', async (event, data = {}) => {
    try {
      const { status, siteId, requestedBy, fromDate, toDate, limit = 100, offset = 0 } = data

      console.log(`📋 Getting request history: status=${status}, site=${siteId}`)

      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required' }
      }

      const supabase = adapter.getSupabase()

      let query = supabase
        .from('change_requests')
        .select('*', { count: 'exact' })
        .order('requested_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (siteId) {
        query = query.eq('site_id', siteId)
      }
      if (requestedBy) {
        query = query.eq('requested_by', requestedBy)
      }
      if (fromDate) {
        query = query.gte('requested_at', fromDate)
      }
      if (toDate) {
        query = query.lte('requested_at', toDate)
      }

      const { data: requests, error, count } = await query

      if (error) {
        console.error('❌ Get request history error:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Found ${requests.length} requests in history`)

      return { success: true, requests, total: count }
    } catch (error) {
      console.error('Get request history error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get change request counts (for badges/notifications)
   */
  ipcMain.handle('get-request-counts', async () => {
    try {
      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required' }
      }

      const supabase = adapter.getSupabase()

      // Get pending count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('change_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (pendingError) {
        return { success: false, error: pendingError.message }
      }

      return {
        success: true,
        counts: {
          pending: pendingCount || 0
        }
      }
    } catch (error) {
      console.error('Get request counts error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Subscribe to real-time change request updates
   */
  ipcMain.handle('subscribe-change-requests', async () => {
    try {
      const adapter = db.getAdapter()
      if (!adapter || adapter.getType() !== 'supabase') {
        return { success: false, error: 'Supabase connection required' }
      }

      const supabase = adapter.getSupabase()

      // Subscribe to changes
      const channel = supabase
        .channel('change_requests_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'change_requests' },
          (payload) => {
            console.log('📡 Change request realtime update:', payload.eventType)
            const mainWindow = getMainWindow && getMainWindow()
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('change-request-update', {
                type: payload.eventType,
                data: payload.new || payload.old
              })
            }
          }
        )
        .subscribe()

      console.log('✅ Subscribed to change_requests realtime')

      return { success: true, channel: channel.topic }
    } catch (error) {
      console.error('Subscribe change requests error:', error)
      return { success: false, error: error.message }
    }
  })

  console.log('   📝 Change request handlers registered')
}

module.exports = { registerChangeRequestHandlers, FIELD_LABELS }
