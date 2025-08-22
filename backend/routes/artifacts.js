const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireContributor, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/artifacts
 * @desc    Get all artifacts with pagination and filtering
 * @access  Public
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('period').optional().isString().withMessage('Period must be a string'),
  query('search').optional().isString().withMessage('Search term must be a string'),
  query('sort').optional().isIn(['newest', 'oldest', 'name', 'category']).withMessage('Invalid sort option'),
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
      category,
      period,
      search,
      sort = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      whereClause += ` AND category = $${paramCount}`;
      queryParams.push(category);
    }

    if (period) {
      paramCount++;
      whereClause += ` AND period = $${paramCount}`;
      queryParams.push(period);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Build ORDER BY clause
    let orderByClause = '';
    switch (sort) {
      case 'oldest':
        orderByClause = 'ORDER BY created_at ASC';
        break;
      case 'name':
        orderByClause = 'ORDER BY name ASC';
        break;
      case 'category':
        orderByClause = 'ORDER BY category ASC, created_at DESC';
        break;
      default: // newest
        orderByClause = 'ORDER BY created_at DESC';
    }

    // Get total count
    const countResult = await dbQuery(
      `SELECT COUNT(*) FROM artifacts ${whereClause}`,
      queryParams
    );
    const totalArtifacts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalArtifacts / limit);

    // Get artifacts
    const artifactsResult = await dbQuery(
      `SELECT 
        id, name, description, category, period, location,
        image_urls, video_url, audio_url, dimensions, material,
        condition_notes, acquisition_date, is_featured, created_at
       FROM artifacts
       ${whereClause}
       ${orderByClause}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    const artifacts = artifactsResult.rows.map(artifact => ({
      id: artifact.id,
      name: artifact.name,
      description: artifact.description,
      category: artifact.category,
      period: artifact.period,
      location: artifact.location,
      imageUrls: artifact.image_urls || [],
      videoUrl: artifact.video_url,
      audioUrl: artifact.audio_url,
      dimensions: artifact.dimensions,
      material: artifact.material,
      conditionNotes: artifact.condition_notes,
      acquisitionDate: artifact.acquisition_date,
      isFeatured: artifact.is_featured,
      createdAt: artifact.created_at
    }));

    res.json({
      artifacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalArtifacts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get artifacts error:', error);
    res.status(500).json({
      error: 'Failed to retrieve artifacts',
      message: 'An error occurred while retrieving artifacts'
    });
  }
});

/**
 * @route   GET /api/artifacts/:id
 * @desc    Get a single artifact by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbQuery(
      `SELECT 
        id, name, description, category, period, location,
        image_urls, video_url, audio_url, dimensions, material,
        condition_notes, acquisition_date, is_featured, created_at, updated_at,
        d.username as donor_username, d.first_name as donor_first_name, d.last_name as donor_last_name
       FROM artifacts a
       LEFT JOIN users d ON a.donor_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Artifact not found',
        message: 'The requested artifact does not exist'
      });
    }

    const artifact = result.rows[0];

    const response = {
      id: artifact.id,
      name: artifact.name,
      description: artifact.description,
      category: artifact.category,
      period: artifact.period,
      location: artifact.location,
      imageUrls: artifact.image_urls || [],
      videoUrl: artifact.video_url,
      audioUrl: artifact.audio_url,
      dimensions: artifact.dimensions,
      material: artifact.material,
      conditionNotes: artifact.condition_notes,
      acquisitionDate: artifact.acquisition_date,
      isFeatured: artifact.is_featured,
      createdAt: artifact.created_at,
      updatedAt: artifact.updated_at,
      donor: artifact.donor_username ? {
        username: artifact.donor_username,
        firstName: artifact.donor_first_name,
        lastName: artifact.donor_last_name
      } : null
    };

    res.json(response);

  } catch (error) {
    console.error('Get artifact error:', error);
    res.status(500).json({
      error: 'Failed to retrieve artifact',
      message: 'An error occurred while retrieving the artifact'
    });
  }
});

/**
 * @route   POST /api/artifacts
 * @desc    Create a new artifact
 * @access  Private (Contributor/Admin)
 */
router.post('/', [
  authenticateToken,
  requireContributor,
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be less than 255 characters'),
  body('description')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description is required'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category is required and must be less than 100 characters'),
  body('period')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Period must be less than 100 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters'),
  body('imageUrls')
    .optional()
    .isArray()
    .withMessage('Image URLs must be an array'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  body('audioUrl')
    .optional()
    .isURL()
    .withMessage('Audio URL must be a valid URL'),
  body('dimensions')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dimensions must be less than 100 characters'),
  body('material')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Material must be less than 100 characters'),
  body('conditionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Condition notes must be less than 1000 characters'),
  body('acquisitionDate')
    .optional()
    .isISO8601()
    .withMessage('Acquisition date must be a valid date'),
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
      name,
      description,
      category,
      period,
      location,
      imageUrls,
      videoUrl,
      audioUrl,
      dimensions,
      material,
      conditionNotes,
      acquisitionDate
    } = req.body;

    // Create artifact
    const result = await dbQuery(
      `INSERT INTO artifacts (
        name, description, category, period, location, image_urls,
        video_url, audio_url, dimensions, material, condition_notes,
        acquisition_date, donor_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, description, category, period, location,
                image_urls, video_url, audio_url, dimensions, material,
                condition_notes, acquisition_date, created_at`,
      [
        name, description, category, period, location, imageUrls || [],
        videoUrl, audioUrl, dimensions, material, conditionNotes,
        acquisitionDate, req.user.id
      ]
    );

    const newArtifact = result.rows[0];

    res.status(201).json({
      message: 'Artifact created successfully',
      artifact: {
        id: newArtifact.id,
        name: newArtifact.name,
        description: newArtifact.description,
        category: newArtifact.category,
        period: newArtifact.period,
        location: newArtifact.location,
        imageUrls: newArtifact.image_urls || [],
        videoUrl: newArtifact.video_url,
        audioUrl: newArtifact.audio_url,
        dimensions: newArtifact.dimensions,
        material: newArtifact.material,
        conditionNotes: newArtifact.condition_notes,
        acquisitionDate: newArtifact.acquisition_date,
        createdAt: newArtifact.created_at
      }
    });

  } catch (error) {
    console.error('Create artifact error:', error);
    res.status(500).json({
      error: 'Failed to create artifact',
      message: 'An error occurred while creating the artifact'
    });
  }
});

/**
 * @route   PUT /api/artifacts/:id
 * @desc    Update an artifact
 * @access  Private (Artifact owner or Admin)
 */
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('artifacts'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description cannot be empty'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('period')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Period must be less than 100 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters'),
  body('imageUrls')
    .optional()
    .isArray()
    .withMessage('Image URLs must be an array'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  body('audioUrl')
    .optional()
    .isURL()
    .withMessage('Audio URL must be a valid URL'),
  body('dimensions')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dimensions must be less than 100 characters'),
  body('material')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Material must be less than 100 characters'),
  body('conditionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Condition notes must be less than 1000 characters'),
  body('acquisitionDate')
    .optional()
    .isISO8601()
    .withMessage('Acquisition date must be a valid date'),
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
          case 'imageUrls':
            dbField = 'image_urls';
            break;
          case 'videoUrl':
            dbField = 'video_url';
            break;
          case 'audioUrl':
            dbField = 'audio_url';
            break;
          case 'conditionNotes':
            dbField = 'condition_notes';
            break;
          case 'acquisitionDate':
            dbField = 'acquisition_date';
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

    // Add artifact ID to query params
    paramCount++;
    queryParams.push(id);

    // Update artifact
    const result = await dbQuery(
      `UPDATE artifacts 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, name, description, category, period, location,
                 image_urls, video_url, audio_url, dimensions, material,
                 condition_notes, acquisition_date, is_featured, updated_at`,
      queryParams
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Artifact not found',
        message: 'The artifact you are trying to update does not exist'
      });
    }

    const updatedArtifact = result.rows[0];

    res.json({
      message: 'Artifact updated successfully',
      artifact: {
        id: updatedArtifact.id,
        name: updatedArtifact.name,
        description: updatedArtifact.description,
        category: updatedArtifact.category,
        period: updatedArtifact.period,
        location: updatedArtifact.location,
        imageUrls: updatedArtifact.image_urls || [],
        videoUrl: updatedArtifact.video_url,
        audioUrl: updatedArtifact.audio_url,
        dimensions: updatedArtifact.dimensions,
        material: updatedArtifact.material,
        conditionNotes: updatedArtifact.condition_notes,
        acquisitionDate: updatedArtifact.acquisition_date,
        isFeatured: updatedArtifact.is_featured,
        updatedAt: updatedArtifact.updated_at
      }
    });

  } catch (error) {
    console.error('Update artifact error:', error);
    res.status(500).json({
      error: 'Failed to update artifact',
      message: 'An error occurred while updating the artifact'
    });
  }
});

/**
 * @route   DELETE /api/artifacts/:id
 * @desc    Delete an artifact
 * @access  Private (Artifact owner or Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('artifacts')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Delete artifact
    const result = await dbQuery(
      'DELETE FROM artifacts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Artifact not found',
        message: 'The artifact you are trying to delete does not exist'
      });
    }

    res.json({
      message: 'Artifact deleted successfully'
    });

  } catch (error) {
    console.error('Delete artifact error:', error);
    res.status(500).json({
      error: 'Failed to delete artifact',
      message: 'An error occurred while deleting the artifact'
    });
  }
});

/**
 * @route   GET /api/artifacts/categories/all
 * @desc    Get all unique artifact categories
 * @access  Public
 */
router.get('/categories/all', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT DISTINCT category FROM artifacts ORDER BY category'
    );

    const categories = result.rows.map(row => row.category);

    res.json({
      categories,
      count: categories.length
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to retrieve categories',
      message: 'An error occurred while retrieving artifact categories'
    });
  }
});

/**
 * @route   GET /api/artifacts/periods/all
 * @desc    Get all unique artifact periods
 * @access  Public
 */
router.get('/periods/all', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT DISTINCT period FROM artifacts WHERE period IS NOT NULL ORDER BY period'
    );

    const periods = result.rows.map(row => row.period);

    res.json({
      periods,
      count: periods.length
    });

  } catch (error) {
    console.error('Get periods error:', error);
    res.status(500).json({
      error: 'Failed to retrieve periods',
      message: 'An error occurred while retrieving artifact periods'
    });
  }
});

module.exports = router;
