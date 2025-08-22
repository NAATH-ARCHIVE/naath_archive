const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if username already exists
    const existingUsername = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(400).json({
        error: 'Username already exists',
        message: 'This username is already taken. Please choose a different one.'
      });
    }

    // Check if email already exists
    const existingEmail = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'This email is already registered. Please use a different email or try logging in.'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING id, username, email, first_name, last_name, role, created_at`,
      [username, email, passwordHash, firstName, lastName]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        createdAt: newUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred while registering the user'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const result = await query(
      `SELECT id, username, email, password_hash, first_name, last_name, role, is_active
       FROM users WHERE username = $1 OR email = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username/email or password is incorrect'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username/email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred while logging in'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profile retrieval failed',
      message: 'An error occurred while retrieving your profile'
    });
  }
});

/**
 * @route   POST /api/auth/create-contributor
 * @desc    Create a new contributor account (admin only)
 * @access  Private (Admin)
 */
router.post('/create-contributor', [
  authenticateToken,
  requireAdmin,
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { username, email, firstName, lastName } = req.body;

    // Check if username already exists
    const existingUsername = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(400).json({
        error: 'Username already exists',
        message: 'This username is already taken.'
      });
    }

    // Check if email already exists
    const existingEmail = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'This email is already registered.'
      });
    }

    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(randomPassword, saltRounds);

    // Create contributor account
    const result = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, 'contributor')
       RETURNING id, username, email, first_name, last_name, role, created_at`,
      [username, email, passwordHash, firstName, lastName]
    );

    const newContributor = result.rows[0];

    // TODO: Send email to contributor with their credentials
    // For now, return the password in the response (in production, send via email)
    res.status(201).json({
      message: 'Contributor account created successfully',
      contributor: {
        id: newContributor.id,
        username: newContributor.username,
        email: newContributor.email,
        firstName: newContributor.first_name,
        lastName: newContributor.last_name,
        role: newContributor.role,
        createdAt: newContributor.created_at
      },
      temporaryPassword: randomPassword,
      note: 'Please share this password with the contributor securely'
    });

  } catch (error) {
    console.error('Create contributor error:', error);
    res.status(500).json({
      error: 'Contributor creation failed',
      message: 'An error occurred while creating the contributor account'
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: 'Your current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'An error occurred while changing your password'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new JWT token
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing your token'
    });
  }
});

module.exports = router;
