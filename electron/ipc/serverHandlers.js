/**
 * Server mode IPC handlers
 * Handles: start-servers, stop-servers, get-server-info, get-connected-clients, broadcast-update
 * @module electron/ipc/serverHandlers
 */

const os = require('os')

/**
 * Registers server-related IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 * @param {Function} deps.getApiServer - Function to get API server instance
 * @param {Function} deps.setApiServer - Function to set API server instance
 * @param {Function} deps.getWsServer - Function to get WebSocket server instance
 * @param {Function} deps.setWsServer - Function to set WebSocket server instance
 * @param {Object} deps.ApiServer - ApiServer class
 * @param {Object} deps.WebSocketServer - WebSocketServer class
 */
function registerServerHandlers(ipcMain, deps) {
  const { db, getApiServer, setApiServer, getWsServer, setWsServer, ApiServer, WebSocketServer } = deps

  ipcMain.handle('start-servers', async () => {
    try {
      const apiServer = new ApiServer(db)
      await apiServer.start()
      setApiServer(apiServer)

      const wsServer = new WebSocketServer()
      await wsServer.start()
      setWsServer(wsServer)

      return {
        apiRunning: true,
        wsRunning: true
      }
    } catch (error) {
      console.error('Failed to start servers:', error)
      return {
        apiRunning: false,
        wsRunning: false,
        error: error.message
      }
    }
  })

  ipcMain.handle('stop-servers', async () => {
    try {
      const apiServer = getApiServer()
      const wsServer = getWsServer()

      if (apiServer) {
        await apiServer.stop()
        setApiServer(null)
      }
      if (wsServer) {
        await wsServer.stop()
        setWsServer(null)
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to stop servers:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-server-info', () => {
    const interfaces = os.networkInterfaces()
    const addresses = []

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({ name, address: iface.address })
        }
      }
    }

    const wsServer = getWsServer()

    return {
      hostname: os.hostname(),
      addresses,
      apiPort: 3001,
      wsPort: 3002,
      connectedClients: wsServer ? wsServer.getConnectedCount() : 0
    }
  })

  ipcMain.handle('get-connected-clients', () => {
    const wsServer = getWsServer()
    return wsServer ? wsServer.getConnectedClients() : []
  })

  ipcMain.handle('broadcast-update', (event, type, data) => {
    const wsServer = getWsServer()
    if (wsServer) {
      wsServer.notifyDataUpdate(type, data)
      return { success: true }
    }
    return { success: false }
  })
}

module.exports = { registerServerHandlers }
