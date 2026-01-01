#!/usr/bin/env node

/**
 * TSSR Monitor - Cloud Server (Render.com)
 *
 * Standalone Express server using Supabase only.
 * No SQLite, no Electron dependencies.
 *
 * @author TSSR Monitor Team
 * @version 2.0.0 (Cloud Edition)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import routes
const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const statsRoutes = require('./routes/stats');
const usersRoutes = require('./routes/users');
const contractorsRoutes = require('./routes/contractors');
const auditLogsRoutes = require('./routes/auditLogs');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Configuration
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.error('Please set these environment variables.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  }
});

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration - Secure in production
const corsOptions = {
  origin: (origin, callback) => {
    // Allowed origins (add your production domains here)
    const allowedOrigins = [
      // Production domains
      process.env.FRONTEND_URL,
      'https://tssr-monitor.vercel.app',
      'https://e-yas-tssr.vercel.app',
      // Add other allowed domains as needed
    ].filter(Boolean); // Remove undefined/null

    // Development mode - allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments
    if (origin.includes('vercel.app') || origin.includes('netlify.app')) {
      return callback(null, true);
    }

    // Deny other origins in production
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Attach Supabase client to request
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// ============================================
// HEALTH CHECK & INFO
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { error } = await supabase
      .from('sites')
      .select('site_id', { count: 'exact', head: true })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      status: 'ok',
      mode: 'cloud',
      database: 'supabase',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/server/info', (req, res) => {
  res.json({
    name: 'TSSR Monitor API',
    version: '2.0.0',
    mode: 'cloud',
    database: 'supabase',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// API ROUTES
// ============================================

// Auth routes (public)
app.use('/api/auth', authRoutes(supabase));
app.use('/api/login', authRoutes(supabase));

// Protected routes - require authentication
const auth = authenticateToken;

// Sites routes (includes /phases inside)
app.use('/api/sites', auth, sitesRoutes(supabase));

// Direct /api/phases endpoint - PUBLIC (no auth required)
app.get('/api/phases', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('phase_name')
      .not('phase_name', 'is', null);

    if (error) throw error;

    // Count by phase
    const phaseCounts = {};
    (data || []).forEach(row => {
      const phase = row.phase_name;
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    });

    const phases = Object.entries(phaseCounts).map(([phase_name, count]) => ({
      phase_name,
      count
    })).sort((a, b) => a.phase_name.localeCompare(b.phase_name));

    res.json(phases);
  } catch (error) {
    console.error('Get phases error:', error);
    res.status(500).json({ error: 'Failed to fetch phases' });
  }
});

app.use('/api/stats', auth, statsRoutes(supabase));
app.use('/api/users', auth, usersRoutes(supabase));
app.use('/api/contractors', auth, contractorsRoutes(supabase));
app.use('/api/audit-logs', auth, auditLogsRoutes(supabase));

// Rejections endpoint - sites with rejection status in ANY department
app.get('/api/rejections', auth, async (req, res) => {
  try {
    const { phase, contractor } = req.query;
    const user = req.user;

    // Build query - check for rejections in any department or overall status
    let query = supabase
      .from('sites')
      .select('*')
      .or([
        'tssr_overall_status.ilike.%reject%',
        'tssr_overall_status.ilike.%fail%',
        'ti_status.ilike.%reject%',
        'rf_plan_status.ilike.%reject%',
        'rf_opt_status.ilike.%reject%',
        'civil_status.ilike.%reject%',
        'mw_status.ilike.%reject%',
        'nokia_npo_status.ilike.%reject%'
      ].join(','));

    if (phase && phase !== 'ALL') {
      query = query.eq('phase_name', phase);
    }

    // Contractor filter
    if (user.role === 'contractor' && user.contractor_name) {
      query = query.eq('tssr_subcon', user.contractor_name);
    } else if (contractor) {
      query = query.eq('tssr_subcon', contractor);
    }

    query = query.order('updated_at', { ascending: false }).limit(500);

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get rejections error:', error);
    res.status(500).json({ error: 'Failed to fetch rejections' });
  }
});

// Settings endpoint - PUBLIC (no auth required)
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) throw error;

    const settingsObj = {};
    (data || []).forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Settings error:', error);
    res.json({});
  }
});

// ============================================
// SUPABASE REALTIME ENDPOINT
// ============================================

// Clients can subscribe to Supabase Realtime directly
// This endpoint provides the connection info
app.get('/api/realtime/config', auth, (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    // Only send anon key for client-side realtime
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    channel: 'sites-realtime',
    tables: ['sites', 'users', 'comments']
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  console.log('='.repeat(60));
  console.log('  TSSR Monitor - Cloud Server');
  console.log('='.repeat(60));
  console.log('');

  // Test Supabase connection
  console.log('Testing Supabase connection...');
  try {
    const { count, error } = await supabase
      .from('sites')
      .select('*', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log(`Connected to Supabase (${count || 0} sites found)`);
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
    console.error('Server will start but database operations may fail.');
  }

  // Start Express server
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('='.repeat(60));
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
