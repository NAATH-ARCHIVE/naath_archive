const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireContributor, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/oral-histories
 * @desc    Get all oral histories with pagination and filtering
 * @access  Public
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('narrator').optional().isString().withMessage('Narrator name must be a string'),
  query('search').optional().isString().withMessage('Search term must be a string'),
  query('sort').optional().isIn(['newest', 'oldest', 'narrator', 'duration']).withMessage('Invalid sort option'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your query parameters',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 12,
      narrator,
      search,
      sort = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    if (narrator) {
      paramCount++;
      whereClause += ` AND narrator_name ILIKE $${paramCount}`;
      queryParams.push(`%${narrator}%`);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (title ILIKE $${paramCount} OR narrator_name ILIKE $${paramCount} OR summary ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Build ORDER BY clause
    let orderByClause = '';
    switch (sort) {
      case 'oldest':
        orderByClause = 'ORDER BY interview_date ASC';
        break;
      case 'narrator':
        orderByClause = 'ORDER BY narrator_name ASC, interview_date DESC';
        break;
      case 'duration':
        orderByClause = 'ORDER BY duration_minutes DESC, interview_date DESC';
        break;
      default: // newest
        orderByClause = 'ORDER BY interview_date DESC';
    }

    // Get total count
    const countResult = await dbQuery(
      `SELECT COUNT(*) FROM oral_histories ${whereClause}`,
      queryParams
    );
    const totalHistories = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalHistories / limit);

    // Get oral histories
    const historiesResult = await dbQuery(
      `SELECT 
        id, title, narrator_name, narrator_bio, interview_date, location,
        duration_minutes, audio_url, video_url, transcript, summary, tags,
        is_featured, created_at
       FROM oral_histories
       ${whereClause}
       ${orderByClause}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    const histories = historiesResult.rows.map(history => ({
      id: history.id,
      title: history.title,
      narratorName: history.narrator_name,
      narratorBio: history.narrator_bio,
      interviewDate: history.interview_date,
      location: history.location,
      durationMinutes: history.duration_minutes,
      audioUrl: history.audio_url,
      videoUrl: history.video_url,
      transcript: history.transcript,
      summary: history.summary,
      tags: history.tags || [],
      isFeatured: history.is_featured,
      createdAt: history.created_at
    }));

    res.json({
      histories,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalHistories,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get oral histories error:', error);
    res.status(500).json({
      error: 'Failed to retrieve oral histories',
      message: 'An error occurred while retrieving oral histories'
    });
  }
});

/**
 * @route   GET /api/oral-histories/:id
 * @desc    Get a single oral history by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbQuery(
      `SELECT 
        id, title, narrator_name, narrator_bio, interview_date, location,
        duration_minutes, audio_url, video_url, transcript, summary, tags,
        is_featured, created_at, updated_at,
        i.username as interviewer_username, i.first_name as interviewer_first_name, i.last_name as interviewer_last_name
       FROM oral_histories o
       LEFT JOIN users i ON o.interviewer_id = i.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Oral history not found',
        message: 'The requested oral history does not exist'
      });
    }

    const history = result.rows[0];

    const response = {
      id: history.id,
      title: history.title,
      narratorName: history.narrator_name,
      narratorBio: history.narrator_bio,
      interviewDate: history.interview_date,
      location: history.location,
      durationMinutes: history.duration_minutes,
      audioUrl: history.audio_url,
      videoUrl: history.video_url,
      transcript: history.transcript,
      summary: history.summary,
      tags: history.tags || [],
      isFeatured: history.is_featured,
      createdAt: history.created_at,
      updatedAt: history.updated_at,
      interviewer: history.interviewer_username ? {
        username: history.interviewer_username,
        firstName: history.interviewer_first_name,
        lastName: history.interviewer_last_name
      } : null
    };

    res.json(response);

  } catch (error) {
    console.error('Get oral history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve oral history',
      message: 'An error occurred while retrieving the oral history'
    });
  }
});

/**
 * @route   POST /api/oral-histories
 * @desc    Create a new oral history
 * @access  Private (Contributor/Admin)
 */
router.post('/', [
  authenticateToken,
  requireContributor,
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('narratorName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Narrator name is required and must be less than 255 characters'),
  body('narratorBio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Narrator bio must be less than 1000 characters'),
  body('interviewDate')
    .optional()
    .isISO8601()
    .withMessage('Interview date must be a valid date'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('audioUrl')
    .optional()
    .isURL()
    .withMessage('Audio URL must be a valid URL'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  body('transcript')
    .optional()
    .trim()
    .isLength({ max: 50000 })
    .withMessage('Transcript must be less than 50000 characters'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Summary must be less than 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
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

    const {
      title,
      narratorName,
      narratorBio,
      interviewDate,
      location,
      durationMinutes,
      audioUrl,
      videoUrl,
      transcript,
      summary,
      tags
    } = req.body;

    // Create oral history
    const result = await dbQuery(
      `INSERT INTO oral_histories (
        title, narrator_name, narrator_bio, interview_date, location,
        duration_minutes, audio_url, video_url, transcript, summary,
        tags, interviewer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, narrator_name, narrator_bio, interview_date, location,
                duration_minutes, audio_url, video_url, transcript, summary,
                tags, created_at`,
      [
        title, narratorName, narratorBio, interviewDate, location,
        durationMinutes, audioUrl, videoUrl, transcript, summary,
        tags || [], req.user.id
      ]
    );

    const newHistory = result.rows[0];

    res.status(201).json({
      message: 'Oral history created successfully',
      history: {
        id: newHistory.id,
        title: newHistory.title,
        narratorName: newHistory.narrator_name,
        narratorBio: newHistory.narrator_bio,
        interviewDate: newHistory.interview_date,
        location: newHistory.location,
        durationMinutes: newHistory.duration_minutes,
        audioUrl: newHistory.audio_url,
        videoUrl: newHistory.video_url,
        transcript: newHistory.transcript,
        summary: newHistory.summary,
        tags: newHistory.tags || [],
        createdAt: newHistory.created_at
      }
    });

  } catch (error) {
    console.error('Create oral history error:', error);
    res.status(500).json({
      error: 'Failed to create oral history',
      message: 'An error occurred while creating the oral history'
    });
  }
});

/**
 * @route   PUT /api/oral-histories/:id
 * @desc    Update an oral history
 * @access  Private (History owner or Admin)
 */
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('oral_histories'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('narratorName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Narrator name must be less than 255 characters'),
  body('narratorBio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Narrator bio must be less than 1000 characters'),
  body('interviewDate')
    .optional()
    .isISO8601()
    .withMessage('Interview date must be a valid date'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('audioUrl')
    .optional()
    .isURL()
    .withMessage('Audio URL must be a valid URL'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  body('transcript')
    .optional()
    .trim()
    .isLength({ max: 50000 })
    .withMessage('Transcript must be less than 50000 characters'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Summary must be less than 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
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

    const { id } = req.params;
    const updateData = req.body;

    // Build update query dynamically
    const updateFields = [];
    const queryParams = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        let dbField;
        
        // Map camelCase to snake_case
        switch (key) {
          case 'narratorName':
            dbField = 'narrator_name';
            break;
          case 'narratorBio':
            dbField = 'narrator_bio';
            break;
          case 'interviewDate':
            dbField = 'interview_date';
            break;
          case 'durationMinutes':
            dbField = 'duration_minutes';
            break;
          case 'audioUrl':
            dbField = 'audio_url';
            break;
          case 'videoUrl':
            dbField = 'video_url';
            break;
          case 'isFeatured':
            dbField = 'is_featured';
            break;
          default:
            dbField = key;
        }
        
        updateFields.push(`${dbField} = $${paramCount}`);
        queryParams.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Please provide at least one field to update'
      });
    }

    // Add history ID to query params
    paramCount++;
    queryParams.push(id);

    // Update oral history
    const result = await dbQuery(
      `UPDATE oral_histories 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, title, narrator_name, narrator_bio, interview_date, location,
                 duration_minutes, audio_url, video_url, transcript, summary,
                 tags, is_featured, updated_at`,
      queryParams
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Oral history not found',
        message: 'The oral history you are trying to update does not exist'
      });
    }

    const updatedHistory = result.rows[0];

    res.json({
      message: 'Oral history updated successfully',
      history: {
        id: updatedHistory.id,
        title: updatedHistory.title,
        narratorName: updatedHistory.narrator_name,
        narratorBio: updatedHistory.narrator_bio,
        interviewDate: updatedHistory.interview_date,
        location: updatedHistory.location,
        durationMinutes: updatedHistory.duration_minutes,
        audioUrl: updatedHistory.audio_url,
        videoUrl: updatedHistory.video_url,
        transcript: updatedHistory.transcript,
        summary: updatedHistory.summary,
        tags: updatedHistory.tags || [],
        isFeatured: updatedHistory.is_featured,
        updatedAt: updatedHistory.updated_at
      }
    });

  } catch (error) {
    console.error('Update oral history error:', error);
    res.status(500).json({
      error: 'Failed to update oral history',
      message: 'An error occurred while updating the oral history'
    });
  }
});

/**
 * @route   DELETE /api/oral-histories/:id
 * @desc    Delete an oral history
 * @access  Private (History owner or Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('oral_histories')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Delete oral history
    const result = await dbQuery(
      'DELETE FROM oral_histories WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Oral history not found',
        message: 'The oral history you are trying to delete does not exist'
      });
    }

    res.json({
      message: 'Oral history deleted successfully'
    });

  } catch (error) {
    console.error('Delete oral history error:', error);
    res.status(500).json({
      error: 'Failed to delete oral history',
      message: 'An error occurred while deleting the oral history'
    });
  }
});

module.exports = router;
