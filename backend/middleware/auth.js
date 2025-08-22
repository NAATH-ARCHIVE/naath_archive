const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token expired',
            message: 'Your authentication token has expired. Please log in again.' 
          });
        }
        return res.status(403).json({ 
          error: 'Invalid token',
          message: 'The provided authentication token is invalid' 
        });
      }

      // Get user from database to ensure they still exist and are active
      try {
        const result = await query(
          'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ 
            error: 'User not found',
            message: 'The user associated with this token no longer exists' 
          });
        }

        const user = result.rows[0];
        
        if (!user.is_active) {
          return res.status(401).json({ 
            error: 'Account deactivated',
            message: 'Your account has been deactivated. Please contact support.' 
          });
        }

        req.user = user;
        next();
      } catch (dbError) {
        console.error('Database error in auth middleware:', dbError);
        return res.status(500).json({ 
          error: 'Authentication error',
          message: 'An error occurred while verifying your authentication' 
        });
      }
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An unexpected error occurred during authentication' 
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if user is contributor or admin
 */
const requireContributor = requireRole(['contributor', 'admin']);

/**
 * Middleware to check if user owns the resource or is admin
 */
const requireOwnershipOrAdmin = (resourceTable, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'You must be logged in to access this resource' 
        });
      }

      // Admins can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
      
      if (!resourceId) {
        return res.status(400).json({ 
          error: 'Resource ID required',
          message: 'Resource ID is required to verify ownership' 
        });
      }

      // Check if user owns the resource
      const result = await query(
        `SELECT user_id FROM ${resourceTable} WHERE id = $1`,
        [resourceId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Resource not found',
          message: 'The requested resource does not exist' 
        });
      }

      const resource = result.rows[0];
      
      if (resource.user_id !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only modify your own resources' 
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ 
        error: 'Ownership verification error',
        message: 'An error occurred while verifying resource ownership' 
      });
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (!err) {
          try {
            const result = await query(
              'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1 AND is_active = true',
              [decoded.userId]
            );

            if (result.rows.length > 0) {
              req.user = result.rows[0];
            }
          } catch (dbError) {
            console.error('Database error in optional auth:', dbError);
          }
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireContributor,
  requireOwnershipOrAdmin,
  optionalAuth,
};
