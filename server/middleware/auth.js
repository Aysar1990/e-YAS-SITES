/**
 * JWT Authentication Middleware
 * For Render.com Cloud Server
 */

const jwt = require('jsonwebtoken');

// SECURITY: JWT_SECRET must be set in production
// In development, a default is used but with a warning
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: JWT_SECRET environment variable is not set in production!');
      console.error('Authentication will fail. Please set JWT_SECRET.');
      // Use a random secret that changes on restart - this will invalidate all tokens
      return require('crypto').randomBytes(64).toString('hex');
    }
    // Development only - log warning
    console.warn('WARNING: JWT_SECRET not set. Using development default. DO NOT use in production!');
    return 'tssr-dev-secret-not-for-production';
  }

  return secret;
})();

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      contractor_name: user.contractor_name
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
}

/**
 * Middleware to check admin role
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}

/**
 * Middleware to check management role
 */
function requireManagement(req, res, next) {
  if (!['admin', 'management'].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      error: 'Management access required'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  generateToken,
  requireAdmin,
  requireManagement,
  JWT_SECRET
};
