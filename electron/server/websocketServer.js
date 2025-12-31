const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const net = require('net')

const JWT_SECRET = 'tssr-monitor-secret-key-2024'
const WS_PORT = 3002

class WebSocketServer {
  constructor() {
    this.wss = null
    this.clients = new Map()
  }

  // Check if port is available
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.once('listening', () => {
        server.close()
        resolve(true)
      })
      server.listen(port)
    })
  }

  async start() {
    // Check if port is available first
    const portAvailable = await this.isPortAvailable(WS_PORT)
    
    if (!portAvailable) {
      console.log(`[WebSocket Server] Port ${WS_PORT} already in use - skipping (standalone server running)`)
      return null
    }

    return this.startOnPort(WS_PORT)
  }

  startOnPort(port) {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({ port })

        this.wss.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`[WebSocket Server] Port ${port} in use - standalone server running`)
            resolve(null)
          } else {
            console.error('[WebSocket Server] Error:', error)
            reject(error)
          }
        })

        this.wss.on('connection', (ws) => {
          console.log('[WebSocket] New connection')

          const authTimeout = setTimeout(() => {
            if (!this.clients.has(ws)) {
              ws.close(4001, 'Authentication timeout')
            }
          }, 10000)

          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message)

              if (data.type === 'auth') {
                // Development Bypass
                if (data.token === 'mock-token') {
                  clearTimeout(authTimeout)
                  const devUser = { username: 'dev_admin', role: 'admin' }
                  this.clients.set(ws, devUser)
                  ws.send(JSON.stringify({ type: 'auth_success', user: devUser }))
                  console.log(`[WebSocket] Authenticated (Dev Bypass): ${devUser.username}`)
                  return
                }

                jwt.verify(data.token, JWT_SECRET, (err, user) => {
                  if (err) {
                    ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid token' }))
                    ws.close(4002, 'Authentication failed')
                    return
                  }

                  clearTimeout(authTimeout)
                  this.clients.set(ws, user)
                  ws.send(JSON.stringify({ type: 'auth_success', user: { username: user.username, role: user.role } }))
                  console.log(`[WebSocket] Authenticated: ${user.username}`)
                })
              }
            } catch (error) {
              console.error('[WebSocket] Parse error:', error)
            }
          })

          ws.on('close', () => {
            const user = this.clients.get(ws)
            if (user) console.log(`[WebSocket] Disconnected: ${user.username}`)
            this.clients.delete(ws)
            clearTimeout(authTimeout)
          })

          ws.on('error', (error) => {
            console.error('[WebSocket] Connection Error:', error)
            this.clients.delete(ws)
          })
        })

        this.wss.on('listening', () => {
          console.log(`[WebSocket Server] ✅ Running on port ${port}`)
          resolve(this.wss)
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  broadcast(type, data) {
    if (!this.wss) return
    const message = JSON.stringify({ type, data, timestamp: Date.now() })
    this.clients.forEach((user, ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message)
    })
  }

  broadcastToRole(role, type, data) {
    if (!this.wss) return
    const message = JSON.stringify({ type, data, timestamp: Date.now() })
    this.clients.forEach((user, ws) => {
      if (ws.readyState === WebSocket.OPEN && user.role === role) ws.send(message)
    })
  }

  broadcastToContractor(contractorName, type, data) {
    if (!this.wss) return
    const message = JSON.stringify({ type, data, timestamp: Date.now() })
    this.clients.forEach((user, ws) => {
      if (ws.readyState === WebSocket.OPEN && user.contractor_name === contractorName) ws.send(message)
    })
  }

  notifyDataUpdate(updateType, details = {}) {
    this.broadcast('data_update', { updateType, ...details })
  }

  notifySyncComplete(stats) {
    this.broadcast('sync_complete', stats)
  }

  getConnectedCount() {
    return this.clients.size
  }

  getConnectedClients() {
    const clients = []
    this.clients.forEach((user) => {
      clients.push({ username: user.username, role: user.role, contractor_name: user.contractor_name })
    })
    return clients
  }

  stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('[WebSocket Server] Stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

module.exports = WebSocketServer
