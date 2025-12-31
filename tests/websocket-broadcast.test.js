/**
 * WebSocket Broadcast Tests - Day 5: Week 1 Integration Testing
 *
 * Tests WebSocket server, broadcasts, and multi-client updates
 * Run with: node tests/websocket-broadcast.test.js
 */

const WebSocket = require('ws')
const assert = require('assert')

// Test results tracker
const results = { passed: 0, failed: 0, tests: [] }

function test(name, fn) {
  try {
    fn()
    results.passed++
    results.tests.push({ name, status: 'PASS' })
    console.log(`  ✅ ${name}`)
  } catch (error) {
    results.failed++
    results.tests.push({ name, status: 'FAIL', error: error.message })
    console.log(`  ❌ ${name}: ${error.message}`)
  }
}

async function asyncTest(name, fn, timeout = 10000) {
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ])
    results.passed++
    results.tests.push({ name, status: 'PASS' })
    console.log(`  ✅ ${name}`)
  } catch (error) {
    results.failed++
    results.tests.push({ name, status: 'FAIL', error: error.message })
    console.log(`  ❌ ${name}: ${error.message}`)
  }
}

// Helper to create a mock WebSocket client
function createMockClient(port = 3002) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`)
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
  })
}

// Helper to wait for a message
function waitForMessage(ws, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Message timeout')), timeout)
    ws.once('message', (data) => {
      clearTimeout(timer)
      resolve(JSON.parse(data))
    })
  })
}

// ========== WebSocket Server Unit Tests ==========
async function testWebSocketServerUnit() {
  console.log('\n🔌 WebSocket Server Unit Tests\n')

  const WebSocketServer = require('../electron/server/websocketServer')

  test('WebSocketServer class exists', () => {
    assert.strictEqual(typeof WebSocketServer, 'function')
  })

  test('WebSocketServer has required methods', () => {
    const server = new WebSocketServer()
    assert.strictEqual(typeof server.start, 'function')
    assert.strictEqual(typeof server.stop, 'function')
    assert.strictEqual(typeof server.broadcast, 'function')
    assert.strictEqual(typeof server.broadcastToRole, 'function')
    assert.strictEqual(typeof server.notifyDataUpdate, 'function')
    assert.strictEqual(typeof server.getConnectedCount, 'function')
    assert.strictEqual(typeof server.getConnectedClients, 'function')
  })

  test('Initial state has no clients', () => {
    const server = new WebSocketServer()
    assert.strictEqual(server.getConnectedCount(), 0)
  })

  test('getConnectedClients returns empty array initially', () => {
    const server = new WebSocketServer()
    const clients = server.getConnectedClients()
    assert.ok(Array.isArray(clients))
    assert.strictEqual(clients.length, 0)
  })
}

// ========== WebSocket Server Integration Tests ==========
async function testWebSocketServerIntegration() {
  console.log('\n🌐 WebSocket Server Integration Tests\n')

  const WebSocketServer = require('../electron/server/websocketServer')
  const server = new WebSocketServer()
  let client1 = null
  let client2 = null

  try {
    await asyncTest('Server starts successfully', async () => {
      await server.start()
      assert.ok(server.wss)
    })

    await asyncTest('Client connects to server', async () => {
      client1 = await createMockClient()
      assert.strictEqual(client1.readyState, WebSocket.OPEN)
    })

    await asyncTest('Client authenticates with dev token', async () => {
      client1.send(JSON.stringify({ type: 'auth', token: 'mock-token' }))
      const response = await waitForMessage(client1)
      assert.strictEqual(response.type, 'auth_success')
      assert.strictEqual(response.user.username, 'dev_admin')
    })

    await asyncTest('Server tracks connected client', async () => {
      // Small delay for client registration
      await new Promise(resolve => setTimeout(resolve, 100))
      assert.strictEqual(server.getConnectedCount(), 1)
    })

    await asyncTest('Second client connects and authenticates', async () => {
      client2 = await createMockClient()
      client2.send(JSON.stringify({ type: 'auth', token: 'mock-token' }))
      const response = await waitForMessage(client2)
      assert.strictEqual(response.type, 'auth_success')
    })

    await asyncTest('Broadcast reaches all clients', async () => {
      const testData = { test: 'broadcast_test', value: 123 }

      // Set up message listeners
      const client1Promise = waitForMessage(client1)
      const client2Promise = waitForMessage(client2)

      // Broadcast
      server.broadcast('test_event', testData)

      const [msg1, msg2] = await Promise.all([client1Promise, client2Promise])

      assert.strictEqual(msg1.type, 'test_event')
      assert.strictEqual(msg1.data.test, 'broadcast_test')
      assert.strictEqual(msg2.type, 'test_event')
      assert.strictEqual(msg2.data.value, 123)
    })

    await asyncTest('notifyDataUpdate sends correct structure', async () => {
      const client1Promise = waitForMessage(client1)

      server.notifyDataUpdate('site_update', { site_id: 'S001', action: 'updated' })

      const msg = await client1Promise
      assert.strictEqual(msg.type, 'data_update')
      assert.strictEqual(msg.data.updateType, 'site_update')
      assert.strictEqual(msg.data.site_id, 'S001')
      assert.ok(msg.timestamp)
    })

    await asyncTest('Broadcast includes timestamp', async () => {
      const client1Promise = waitForMessage(client1)

      server.broadcast('timestamp_test', {})

      const msg = await client1Promise
      assert.ok(typeof msg.timestamp === 'number')
      assert.ok(msg.timestamp <= Date.now())
    })

    await asyncTest('getConnectedClients returns user info', async () => {
      const clients = server.getConnectedClients()
      assert.ok(Array.isArray(clients))
      assert.ok(clients.length >= 1)
      assert.ok(clients.some(c => c.username === 'dev_admin'))
    })

    await asyncTest('Client disconnection updates count', async () => {
      const initialCount = server.getConnectedCount()
      client2.close()
      await new Promise(resolve => setTimeout(resolve, 100))
      assert.strictEqual(server.getConnectedCount(), initialCount - 1)
    })

  } finally {
    // Cleanup
    if (client1 && client1.readyState === WebSocket.OPEN) client1.close()
    if (client2 && client2.readyState === WebSocket.OPEN) client2.close()
    await server.stop()
  }
}

// ========== Event Structure Validation Tests ==========
async function testEventStructure() {
  console.log('\n📋 Event Structure Validation Tests\n')

  const WebSocketServer = require('../electron/server/websocketServer')

  test('Broadcast message structure is correct', () => {
    const server = new WebSocketServer()
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: (msg) => {
        const parsed = JSON.parse(msg)
        assert.ok(parsed.type)
        assert.ok(parsed.data !== undefined)
        assert.ok(typeof parsed.timestamp === 'number')
      }
    }
    server.clients.set(mockWs, { username: 'test', role: 'admin' })
    server.broadcast('test', { key: 'value' })
  })

  test('notifySyncComplete includes stats', () => {
    const server = new WebSocketServer()
    const receivedMessages = []
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: (msg) => receivedMessages.push(JSON.parse(msg))
    }
    server.clients.set(mockWs, { username: 'test', role: 'admin' })

    server.notifySyncComplete({ added: 5, updated: 3, deleted: 1 })

    assert.strictEqual(receivedMessages.length, 1)
    assert.strictEqual(receivedMessages[0].type, 'sync_complete')
    assert.strictEqual(receivedMessages[0].data.added, 5)
  })
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  WebSocket Broadcast Integration Tests')
  console.log('  Day 5 - Week 1 Integration Testing')
  console.log('═══════════════════════════════════════════════════')

  const startTime = Date.now()

  await testWebSocketServerUnit()
  await testWebSocketServerIntegration()
  await testEventStructure()

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  Results: ${results.passed} passed, ${results.failed} failed`)
  console.log(`  Duration: ${duration}s`)
  console.log('═══════════════════════════════════════════════════\n')

  process.exit(results.failed > 0 ? 1 : 0)
}

runAllTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
