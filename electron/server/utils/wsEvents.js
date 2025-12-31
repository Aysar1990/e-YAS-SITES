/**
 * WebSocket Event Types
 */

const WS_EVENTS = {
  // Existing events
  SITE_UPDATED: 'site_updated',
  STATUS_CHANGED: 'status_changed',
  NOKIA_REVIEW_UPDATED: 'nokia_review_updated',
  USER_LOGGED_IN: 'user_logged_in',
  DATA_SYNCED: 'data_synced',
  NOTIFICATION: 'notification',
  CONNECTION_STATUS: 'connection_status',

  // Real-time sync events (Day 11)
  SITE_ADDED: 'site_added',
  SITE_DELETED: 'site_deleted',
  SYNC_ERROR: 'sync_error',
  SYNC_STATUS: 'sync_status'
}

module.exports = WS_EVENTS
