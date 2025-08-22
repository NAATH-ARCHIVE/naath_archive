const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireOwnershipOrAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/comments/article/:articleId
 * @desc    Get all approved comments for an article with nested replies
 * @access  Public
 */
router.get('/article/:articleId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['newest', 'oldest', 'likes']).withMessage('Invalid sort option'),
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

    const { articleId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    // Verify article exists and is published
    const articleResult = await dbQuery(
      'SELECT id FROM articles WHERE id = $1 AND status = $2',
      [articleId, 'published']
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Article not found',
        message: 'The requested article does not exist or is not published'
      });
    }

    // Build ORDER BY clause
    let orderByClause = '';
    switch (sort) {
      case 'oldest':
        orderByClause = 'ORDER BY c.created_at ASC';
        break;
      case 'likes':
        orderByClause = 'ORDER BY likes_count DESC, c.created_at DESC';
        break;
      default: // newest
        orderByClause = 'ORDER BY c.created_at DESC';
    }

    // Get total count of top-level comments
    const countResult = await dbQuery(
      `SELECT COUNT(*) FROM comments 
       WHERE article_id = $1 AND parent_id IS NULL AND is_approved = true`,
      [articleId]
    );
    const totalComments = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalComments / limit);

    // Get top-level comments with author info and like counts
    const commentsResult = await dbQuery(
      `SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        u.id as user_id, u.username, u.first_name, u.last_name,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND is_approved = true) as replies_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.article_id = $1 AND c.parent_id IS NULL AND c.is_approved = true
       ${orderByClause}
       LIMIT $2 OFFSET $3`,
      [articleId, limit, offset]
    );

    // Get replies for each comment
    const comments = await Promise.all(
      commentsResult.rows.map(async (comment) => {
        // Get replies for this comment
        const repliesResult = await dbQuery(
          `SELECT 
            c.id, c.content, c.created_at, c.updated_at,
            u.id as user_id, u.username, u.first_name, u.last_name,
            (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.parent_id = $1 AND c.is_approved = true
           ORDER BY c.created_at ASC`,
          [comment.id]
        );

        const replies = repliesResult.rows.map(reply => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          author: {
            id: reply.user_id,
            username: reply.username,
            firstName: reply.first_name,
            lastName: reply.last_name
          },
          likesCount: parseInt(reply.likes_count)
        }));

        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          author: {
            id: comment.user_id,
            username: comment.username,
            firstName: comment.first_name,
            lastName: comment.last_name
          },
          likesCount: parseInt(comment.likes_count),
          repliesCount: parseInt(comment.replies_count),
          replies
        };
      })
    );

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalComments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      error: 'Failed to retrieve comments',
      message: 'An error occurred while retrieving comments'
    });
  }
});

/**
 * @route   POST /api/comments
 * @desc    Create a new comment
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and must be less than 1000 characters'),
  body('articleId')
    .isUUID()
    .withMessage('Article ID must be a valid UUID'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Parent comment ID must be a valid UUID'),
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

    const { content, articleId, parentId } = req.body;

    // Verify article exists and is published
    const articleResult = await dbQuery(
      'SELECT id FROM articles WHERE id = $1 AND status = $2',
      [articleId, 'published']
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Article not found',
        message: 'The article you are trying to comment on does not exist or is not published'
      });
    }

    // If this is a reply, verify parent comment exists
    if (parentId) {
      const parentResult = await dbQuery(
        'SELECT id FROM comments WHERE id = $1 AND article_id = $2 AND is_approved = true',
        [parentId, articleId]
      );

      if (parentResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Parent comment not found',
          message: 'The comment you are trying to reply to does not exist'
        });
      }
    }

    // Create comment
    const result = await dbQuery(
      `INSERT INTO comments (content, article_id, user_id, parent_id, is_approved)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, content, created_at, parent_id`,
      [content, articleId, req.user.id, parentId || null, req.user.role === 'admin' ? true : false]
    );

    const newComment = result.rows[0];

    res.status(201).json({
      message: req.user.role === 'admin' ? 'Comment created successfully' : 'Comment submitted for approval',
      comment: {
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.created_at,
        parentId: newComment.parent_id,
        isApproved: req.user.role === 'admin',
        author: {
          id: req.user.id,
          username: req.user.username,
          firstName: req.user.first_name,
          lastName: req.user.last_name
        }
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      error: 'Failed to create comment',
      message: 'An error occurred while creating the comment'
    });
  }
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Update a comment
 * @access  Private (Comment owner or Admin)
 */
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('comments'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and must be less than 1000 characters'),
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
    const { content } = req.body;

    // Update comment
    const result = await dbQuery(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, content, updated_at`,
      [content, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment you are trying to update does not exist'
      });
    }

    const updatedComment = result.rows[0];

    res.json({
      message: 'Comment updated successfully',
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        updatedAt: updatedComment.updated_at
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      error: 'Failed to update comment',
      message: 'An error occurred while updating the comment'
    });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment
 * @access  Private (Comment owner or Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('comments')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Delete comment (cascade will handle likes and replies)
    const result = await dbQuery(
      'DELETE FROM comments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment you are trying to delete does not exist'
      });
    }

    res.json({
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      error: 'Failed to delete comment',
      message: 'An error occurred while deleting the comment'
    });
  }
});

/**
 * @route   POST /api/comments/:id/like
 * @desc    Like or unlike a comment
 * @access  Private
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if comment exists
    const commentResult = await dbQuery(
      'SELECT id FROM comments WHERE id = $1 AND is_approved = true',
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment you are trying to like does not exist'
      });
    }

    // Check if user already liked this comment
    const existingLike = await dbQuery(
      'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingLike.rows.length > 0) {
      // Unlike the comment
      await dbQuery(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      res.json({
        message: 'Comment unliked successfully',
        liked: false
      });
    } else {
      // Like the comment
      await dbQuery(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
        [id, req.user.id]
      );

      res.json({
        message: 'Comment liked successfully',
        liked: true
      });
    }

  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      error: 'Failed to toggle comment like',
      message: 'An error occurred while processing your like'
    });
  }
});

/**
 * @route   PUT /api/comments/:id/approve
 * @desc    Approve a comment (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id/approve', [
  authenticateToken,
  requireOwnershipOrAdmin('comments', 'id')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Update comment approval status
    const result = await dbQuery(
      `UPDATE comments 
       SET is_approved = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, is_approved`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment you are trying to approve does not exist'
      });
    }

    res.json({
      message: 'Comment approved successfully',
      comment: {
        id: result.rows[0].id,
        isApproved: result.rows[0].is_approved
      }
    });

  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({
      error: 'Failed to approve comment',
      message: 'An error occurred while approving the comment'
    });
  }
});

/**
 * @route   GET /api/comments/pending
 * @desc    Get all pending comments for approval (Admin only)
 * @access  Private (Admin)
 */
router.get('/pending', authenticateToken, requireOwnershipOrAdmin('comments', 'id'), async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT 
        c.id, c.content, c.created_at, c.article_id,
        u.username, u.first_name, u.last_name,
        a.title as article_title, a.slug as article_slug
       FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN articles a ON c.article_id = a.id
       WHERE c.is_approved = false
       ORDER BY c.created_at ASC`
    );

    const pendingComments = result.rows.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      author: {
        username: comment.username,
        firstName: comment.first_name,
        lastName: comment.last_name
      },
      article: {
        id: comment.article_id,
        title: comment.article_title,
        slug: comment.article_slug
      }
    }));

    res.json({
      pendingComments,
      count: pendingComments.length
    });

  } catch (error) {
    console.error('Get pending comments error:', error);
    res.status(500).json({
      error: 'Failed to retrieve pending comments',
      message: 'An error occurred while retrieving pending comments'
    });
  }
});

module.exports = router;
