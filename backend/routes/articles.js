const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireContributor, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/articles
 * @desc    Get all published articles with pagination and filtering
 * @access  Public
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('author').optional().isUUID().withMessage('Author ID must be a valid UUID'),
  query('search').optional().isString().withMessage('Search term must be a string'),
  query('sort').optional().isIn(['newest', 'oldest', 'title', 'views']).withMessage('Invalid sort option'),
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
      limit = 10,
      category,
      author,
      search,
      sort = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = "WHERE status = 'published'";
    const queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      whereClause += ` AND $${paramCount} = ANY(tags)`;
      queryParams.push(category);
    }

    if (author) {
      paramCount++;
      whereClause += ` AND author_id = $${paramCount}`;
      queryParams.push(author);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount} OR excerpt ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Build ORDER BY clause
    let orderByClause = '';
    switch (sort) {
      case 'oldest':
        orderByClause = 'ORDER BY published_at ASC';
        break;
      case 'title':
        orderByClause = 'ORDER BY title ASC';
        break;
      case 'views':
        orderByClause = 'ORDER BY view_count DESC';
        break;
      default: // newest
        orderByClause = 'ORDER BY published_at DESC';
    }

    // Get total count
    const countResult = await dbQuery(
      `SELECT COUNT(*) FROM articles ${whereClause}`,
      queryParams
    );
    const totalArticles = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalArticles / limit);

    // Get articles
    const articlesResult = await dbQuery(
      `SELECT 
        a.id, a.title, a.slug, a.excerpt, a.featured_image_url, 
        a.tags, a.view_count, a.published_at, a.created_at,
        u.username as author_username, u.first_name as author_first_name, u.last_name as author_last_name
       FROM articles a
       JOIN users u ON a.author_id = u.id
       ${whereClause}
       ${orderByClause}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    const articles = articlesResult.rows.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      featuredImageUrl: article.featured_image_url,
      tags: article.tags || [],
      viewCount: article.view_count,
      publishedAt: article.published_at,
      createdAt: article.created_at,
      author: {
        username: article.author_username,
        firstName: article.author_first_name,
        lastName: article.author_last_name
      }
    }));

    res.json({
      articles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalArticles,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      error: 'Failed to retrieve articles',
      message: 'An error occurred while retrieving articles'
    });
  }
});

/**
 * @route   GET /api/articles/:slug
 * @desc    Get a single article by slug
 * @access  Public
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get article with author info
    const result = await dbQuery(
      `SELECT 
        a.id, a.title, a.slug, a.content, a.excerpt, a.featured_image_url,
        a.tags, a.view_count, a.published_at, a.created_at, a.updated_at,
        u.id as author_id, u.username as author_username, u.first_name as author_first_name, u.last_name as author_last_name
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.slug = $1 AND a.status = 'published'`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Article not found',
        message: 'The requested article does not exist or is not published'
      });
    }

    const article = result.rows[0];

    // Increment view count
    await dbQuery(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
      [article.id]
    );

    // Get comments count
    const commentsResult = await dbQuery(
      'SELECT COUNT(*) FROM comments WHERE article_id = $1 AND is_approved = true',
      [article.id]
    );

    const response = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      featuredImageUrl: article.featured_image_url,
      tags: article.tags || [],
      viewCount: article.view_count + 1, // Include the increment
      publishedAt: article.published_at,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      author: {
        id: article.author_id,
        username: article.author_username,
        firstName: article.author_first_name,
        lastName: article.author_last_name
      },
      commentsCount: parseInt(commentsResult.rows[0].count)
    };

    res.json(response);

  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      error: 'Failed to retrieve article',
      message: 'An error occurred while retrieving the article'
    });
  }
});

/**
 * @route   POST /api/articles
 * @desc    Create a new article
 * @access  Private (Contributor/Admin)
 */
router.post('/', [
  authenticateToken,
  requireContributor,
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be less than 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('featuredImageUrl')
    .optional()
    .isURL()
    .withMessage('Featured image URL must be a valid URL'),
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

    const { title, content, excerpt, tags, featuredImageUrl } = req.body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug already exists
    const existingSlug = await dbQuery(
      'SELECT id FROM articles WHERE slug = $1',
      [slug]
    );

    if (existingSlug.rows.length > 0) {
      return res.status(400).json({
        error: 'Slug already exists',
        message: 'An article with this title already exists. Please choose a different title.'
      });
    }

    // Create article
    const result = await dbQuery(
      `INSERT INTO articles (title, slug, content, excerpt, featured_image_url, tags, author_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
       RETURNING id, title, slug, content, excerpt, featured_image_url, tags, status, created_at`,
      [title, slug, content, excerpt, featuredImageUrl, tags || [], req.user.id]
    );

    const newArticle = result.rows[0];

    res.status(201).json({
      message: 'Article created successfully',
      article: {
        id: newArticle.id,
        title: newArticle.title,
        slug: newArticle.slug,
        content: newArticle.content,
        excerpt: newArticle.excerpt,
        featuredImageUrl: newArticle.featured_image_url,
        tags: newArticle.tags || [],
        status: newArticle.status,
        createdAt: newArticle.created_at
      }
    });

  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      error: 'Failed to create article',
      message: 'An error occurred while creating the article'
    });
  }
});

/**
 * @route   PUT /api/articles/:id
 * @desc    Update an article
 * @access  Private (Article owner or Admin)
 */
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('articles'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content cannot be empty'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be less than 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('featuredImageUrl')
    .optional()
    .isURL()
    .withMessage('Featured image URL must be a valid URL'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
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
    const { title, content, excerpt, tags, featuredImageUrl, status } = req.body;

    // Build update query dynamically
    const updateFields = [];
    const queryParams = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updateFields.push(`title = $${paramCount}`);
      queryParams.push(title);
    }

    if (content !== undefined) {
      paramCount++;
      updateFields.push(`content = $${paramCount}`);
      queryParams.push(content);
    }

    if (excerpt !== undefined) {
      paramCount++;
      updateFields.push(`excerpt = $${paramCount}`);
      queryParams.push(excerpt);
    }

    if (tags !== undefined) {
      paramCount++;
      updateFields.push(`tags = $${paramCount}`);
      queryParams.push(tags);
    }

    if (featuredImageUrl !== undefined) {
      paramCount++;
      updateFields.push(`featured_image_url = $${paramCount}`);
      queryParams.push(featuredImageUrl);
    }

    if (status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      queryParams.push(status);
      
      // Set published_at if status is being changed to published
      if (status === 'published') {
        paramCount++;
        updateFields.push(`published_at = $${paramCount}`);
        queryParams.push(new Date());
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Please provide at least one field to update'
      });
    }

    // Add article ID to query params
    paramCount++;
    queryParams.push(id);

    // Update article
    const result = await dbQuery(
      `UPDATE articles 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, title, slug, content, excerpt, featured_image_url, tags, status, updated_at`,
      queryParams
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Article not found',
        message: 'The article you are trying to update does not exist'
      });
    }

    const updatedArticle = result.rows[0];

    res.json({
      message: 'Article updated successfully',
      article: {
        id: updatedArticle.id,
        title: updatedArticle.title,
        slug: updatedArticle.slug,
        content: updatedArticle.content,
        excerpt: updatedArticle.excerpt,
        featuredImageUrl: updatedArticle.featured_image_url,
        tags: updatedArticle.tags || [],
        status: updatedArticle.status,
        updatedAt: updatedArticle.updated_at
      }
    });

  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      error: 'Failed to update article',
      message: 'An error occurred while updating the article'
    });
  }
});

/**
 * @route   DELETE /api/articles/:id
 * @desc    Delete an article
 * @access  Private (Article owner or Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('articles')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Delete article (cascade will handle related comments)
    const result = await dbQuery(
      'DELETE FROM articles WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Article not found',
        message: 'The article you are trying to delete does not exist'
      });
    }

    res.json({
      message: 'Article deleted successfully'
    });

  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      error: 'Failed to delete article',
      message: 'An error occurred while deleting the article'
    });
  }
});

/**
 * @route   GET /api/articles/draft/all
 * @desc    Get all draft articles for the authenticated user
 * @access  Private (Contributor/Admin)
 */
router.get('/draft/all', authenticateToken, requireContributor, async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT id, title, slug, excerpt, featured_image_url, tags, created_at, updated_at
       FROM articles 
       WHERE author_id = $1 AND status = 'draft'
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    const drafts = result.rows.map(draft => ({
      id: draft.id,
      title: draft.title,
      slug: draft.slug,
      excerpt: draft.excerpt,
      featuredImageUrl: draft.featured_image_url,
      tags: draft.tags || [],
      createdAt: draft.created_at,
      updatedAt: draft.updated_at
    }));

    res.json({
      drafts,
      count: drafts.length
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      error: 'Failed to retrieve drafts',
      message: 'An error occurred while retrieving your draft articles'
    });
  }
});

module.exports = router;
