/**
 * Authentication Routes
 * Login, verify, logout for Supabase-only server
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Rate limiting for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 20;
const BLOCK_DURATION = 2 * 60 * 1000; // 2 minutes

function isBlocked(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;
  if (attempts.blocked && Date.now() < attempts.blockedUntil) {
    return true;
  }
  if (attempts.blocked && Date.now() >= attempts.blockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  return false;
}

function recordAttempt(ip, success) {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const attempts = loginAttempts.get(ip) || { count: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.blocked = true;
    attempts.blockedUntil = Date.now() + BLOCK_DURATION;
  }

  loginAttempts.set(ip, attempts);
}

function getRemainingAttempts(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - attempts.count);
}

module.exports = function(supabase) {
  const router = express.Router();

  // POST /api/auth/login or /api/login
  router.post('/', async (req, res) => {
    await handleLogin(req, res, supabase);
  });

  router.post('/login', async (req, res) => {
    await handleLogin(req, res, supabase);
  });

  // GET /api/auth/verify
  router.get('/verify', authenticateToken, (req, res) => {
    res.json({
      valid: true,
      user: req.user
    });
  });

  // POST /api/auth/logout
  router.post('/logout', (req, res) => {
    // JWT is stateless, so just confirm logout
    res.json({ success: true, message: 'Logged out successfully' });
  });

  return router;
};

async function handleLogin(req, res, supabase) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Check rate limiting
    if (isBlocked(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: BLOCK_DURATION / 1000
      });
    }

    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Invalid username format'
      });
    }

    // Fetch user from Supabase (case-insensitive)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username.trim())
      .single();

    if (error || !user) {
      recordAttempt(ip, false);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        attemptsRemaining: getRemainingAttempts(ip)
      });
    }

    // Check if user is active
    if (user.is_active === 0) {
      return res.status(401).json({
        success: false,
        error: 'Account is disabled'
      });
    }

    // Verify password
    let passwordValid = false;

    if (user.password.startsWith('$2')) {
      // Bcrypt hash
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain text password - upgrade it
      passwordValid = user.password === password;
      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id);
        console.log(`Upgraded password hash for user: ${username}`);
      }
    }

    if (!passwordValid) {
      recordAttempt(ip, false);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        attemptsRemaining: getRemainingAttempts(ip)
      });
    }

    // Success - generate token
    recordAttempt(ip, true);

    const token = generateToken(user);

    // Log the login
    try {
      await supabase.from('activity_log').insert({
        action: 'LOGIN',
        user_id: user.id,
        details: JSON.stringify({ ip, userAgent: req.headers['user-agent'] })
      });
    } catch (logError) {
      console.error('Failed to log login:', logError);
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        contractor_name: user.contractor_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}
