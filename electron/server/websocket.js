/**
 * WebSocket Server with HTTP Status Endpoint
 */

const WebSocket = require('ws')
const http = require('http')
const WS_EVENTS = require('./utils/wsEvents')
const net = require('net')

const WS_PORT = 3002

class WebSocketServer {
  constructor() {
    this.wss = null
    this.httpServer = null
    this.connectedClients = new Map()
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

  // Broadcast to all connected WebSocket clients
  broadcast(event, data, excludeWs = null) {
    if (!this.wss) return

    const message = JSON.stringify({
      event,
      data,
      timestamp: Date.now()
    })

    this.wss.clients.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })

    console.log(`[WS] Broadcast ${event} to ${this.wss.clients.size} clients`)
  }

  // Send to specific client
  sendToClient(ws, event, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data, timestamp: Date.now() }))
    }
  }

  async start() {
    // Check if port is available first
    const portAvailable = await this.isPortAvailable(WS_PORT)
    
    if (!portAvailable) {
      console.log(`[WS Server] Port ${WS_PORT} already in use - skipping`)
      return false
    }

    return this.startOnPort(WS_PORT)
  }

  startOnPort(port) {
    return new Promise((resolve, reject) => {
      try {
        // Create HTTP server for status endpoint
        this.httpServer = http.createServer((req, res) => {
          // CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Type', 'application/json')

          if (req.url === '/status' || req.url === '/') {
            // Status endpoint
            res.writeHead(200)
            res.end(JSON.stringify({
              status: 'online',
              service: 'WebSocket Server',
              port: port,
              connectedClients: this.connectedClients.size,
              uptime: process.uptime(),
              timestamp: new Date().toISOString()
            }))
          } else {
            res.writeHead(404)
            res.end(JSON.stringify({ error: 'Not Found' }))
          }
        })

        // Create WebSocket server on top of HTTP server
        this.wss = new WebSocket.Server({ server: this.httpServer })

        this.httpServer.listen(port, () => {
          console.log(`[WS Server] ✅ Running on port ${port}`)
          console.log(`[WS Server] Status: http://localhost:${port}/status`)
          resolve(true)
        })

        this.wss.on('connection', (ws, req) => {
          const clientId = Date.now().toString(36) + Math.random().toString(36).substr(2)
          this.connectedClients.set(clientId, { ws, connectedAt: new Date() })

          console.log(`[WS] Client connected: ${clientId} (Total: ${this.connectedClients.size})`)

          // Send connection confirmation
          this.sendToClient(ws, WS_EVENTS.CONNECTION_STATUS, {
            connected: true,
            clientId,
            connectedClients: this.connectedClients.size,
            serverTime: new Date().toISOString()
          })

          // Broadcast to others
          this.broadcast(WS_EVENTS.NOTIFICATION, {
            type: 'user_connected',
            message: 'A new user connected',
            connectedClients: this.connectedClients.size
          }, ws)

          // Handle messages
          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message)
              console.log(`[WS] Received from ${clientId}:`, data.type || data.event)

              if (data.type === 'ping') {
                this.sendToClient(ws, 'pong', { timestamp: Date.now() })
              }

              if (data.type === 'request_sync') {
                this.sendToClient(ws, WS_EVENTS.DATA_SYNCED, {
                  message: 'Sync triggered',
                  timestamp: Date.now()
                })
              }
            } catch (e) {
              console.error('[WS] Message parse error:', e)
            }
          })

          // Handle disconnect
          ws.on('close', () => {
            this.connectedClients.delete(clientId)
            console.log(`[WS] Client disconnected: ${clientId} (Remaining: ${this.connectedClients.size})`)

            this.broadcast(WS_EVENTS.NOTIFICATION, {
              type: 'user_disconnected',
              message: 'A user disconnected',
              connectedClients: this.connectedClients.size
            })
          })

          // Handle errors
          ws.on('error', (error) => {
            console.error(`[WS] Client error ${clientId}:`, error.message)
            this.connectedClients.delete(clientId)
          })
        })

        this.httpServer.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`[WS Server] Port ${port} in use`)
            resolve(false)
          } else {
            console.error('[WS Server] Error:', error)
            reject(error)
          }
        })

      } catch (error) {
        console.error('[WS Server] Failed to start:', error)
        reject(error)
      }
    })
  }

  stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.clients.forEach(client => client.close())
        this.wss.close(() => {
          if (this.httpServer) {
            this.httpServer.close(() => {
              console.log('[WS Server] Stopped')
              resolve()
            })
          } else {
            resolve()
          }
        })
        this.wss = null
        this.httpServer = null
      } else {
        resolve()
      }
    })
  }

  getConnectedClientsCount() {
    return this.connectedClients.size
  }
}

module.exports = WebSocketServer
