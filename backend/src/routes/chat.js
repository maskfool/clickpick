import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, optionalAuth } from '../middleware/auth.js';
import { enhancePromptWithAI, chatWithAI } from '../services/openai.js';

const router = express.Router();

// @desc    Enhance prompt with AI
// @route   POST /api/chat/enhance-prompt
// @access  Public
router.post('/enhance-prompt', [
  body('prompt').trim().isLength({ min: 5, max: 1000 }).withMessage('Prompt must be between 5 and 1000 characters'),
  body('category').optional().isIn([
    'education', 'gaming', 'technology', 'entertainment', 'lifestyle',
    'business', 'news', 'sports', 'music', 'comedy', 'travel',
    'food', 'fitness', 'beauty', 'fashion', 'other'
  ]).withMessage('Invalid category'),
  body('style').optional().isIn(['professional', 'casual', 'creative', 'minimalist', 'bold']).withMessage('Invalid style'),
  body('tone').optional().isIn(['friendly', 'serious', 'humorous', 'inspirational', 'neutral']).withMessage('Invalid tone')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { prompt, category, style, tone } = req.body;

    try {
      const enhancedPrompt = await enhancePromptWithAI(prompt, category, style, tone);
      
      res.json({
        success: true,
        message: 'Prompt enhanced successfully',
        data: {
          originalPrompt: prompt,
          enhancedPrompt,
          category,
          style,
          style,
          tone
        }
      });
    } catch (error) {
      console.error('AI prompt enhancement failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enhance prompt with AI',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Enhance prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while enhancing prompt'
    });
  }
});

// @desc    Chat with AI for thumbnail ideas
// @route   POST /api/chat/thumbnail-ideas
// @access  Public
router.post('/thumbnail-ideas', [
  body('topic').trim().isLength({ min: 3, max: 200 }).withMessage('Topic must be between 3 and 200 characters'),
  body('category').optional().isIn([
    'education', 'gaming', 'technology', 'entertainment', 'lifestyle',
    'business', 'news', 'sports', 'music', 'comedy', 'travel',
    'food', 'fitness', 'beauty', 'fashion', 'other'
  ]).withMessage('Invalid category'),
  body('targetAudience').optional().trim().isLength({ max: 100 }).withMessage('Target audience must be under 100 characters'),
  body('style').optional().isIn(['modern', 'vintage', 'minimalist', 'colorful', 'dark', 'light']).withMessage('Invalid style')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { topic, category, targetAudience, style } = req.body;

    try {
      const ideas = await chatWithAI('thumbnail-ideas', {
        topic,
        category,
        targetAudience,
        style
      });
      
      res.json({
        success: true,
        message: 'Thumbnail ideas generated successfully',
        data: {
          topic,
          category,
          targetAudience,
          style,
          ideas
        }
      });
    } catch (error) {
      console.error('AI thumbnail ideas failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate thumbnail ideas',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Thumbnail ideas error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating thumbnail ideas'
    });
  }
});

// @desc    Get AI suggestions for editing
// @route   POST /api/chat/edit-suggestions
// @access  Public
router.post('/edit-suggestions', [
  body('currentImage').trim().isLength({ min: 10, max: 500 }).withMessage('Current image description must be between 10 and 500 characters'),
  body('userGoal').trim().isLength({ min: 5, max: 300 }).withMessage('User goal must be between 5 and 300 characters'),
  body('category').optional().isIn([
    'education', 'gaming', 'technology', 'entertainment', 'lifestyle',
    'business', 'news', 'sports', 'music', 'comedy', 'travel',
    'food', 'fitness', 'beauty', 'fashion', 'other'
  ]).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentImage, userGoal, category } = req.body;

    try {
      const suggestions = await chatWithAI('edit-suggestions', {
        currentImage,
        userGoal,
        category
      });
      
      res.json({
        success: true,
        message: 'Edit suggestions generated successfully',
        data: {
          currentImage,
          userGoal,
          category,
          suggestions
        }
      });
    } catch (error) {
      console.error('AI edit suggestions failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate edit suggestions',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Edit suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating edit suggestions'
    });
  }
});

// @desc    Get AI feedback on thumbnail
// @route   POST /api/chat/thumbnail-feedback
// @access  Public
router.post('/thumbnail-feedback', [
  body('imageDescription').trim().isLength({ min: 10, max: 500 }).withMessage('Image description must be between 10 and 500 characters'),
  body('category').isIn([
    'education', 'gaming', 'technology', 'entertainment', 'lifestyle',
    'business', 'news', 'sports', 'music', 'comedy', 'travel',
    'food', 'fitness', 'beauty', 'fashion', 'other'
  ]).withMessage('Invalid category'),
  body('targetAudience').optional().trim().isLength({ max: 100 }).withMessage('Target audience must be under 100 characters'),
  body('purpose').optional().isIn(['clickbait', 'informative', 'entertaining', 'educational', 'promotional']).withMessage('Invalid purpose')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { imageDescription, category, targetAudience, purpose } = req.body;

    try {
      const feedback = await chatWithAI('thumbnail-feedback', {
        imageDescription,
        category,
        targetAudience,
        purpose
      });
      
      res.json({
        success: true,
        message: 'Thumbnail feedback generated successfully',
        data: {
          imageDescription,
          category,
          targetAudience,
          purpose,
          feedback
        }
      });
    } catch (error) {
      console.error('AI thumbnail feedback failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate thumbnail feedback',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Thumbnail feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating thumbnail feedback'
    });
  }
});

// @desc    Get AI help for prompt writing
// @route   POST /api/chat/prompt-help
// @access  Public
router.post('/prompt-help', [
  body('topic').trim().isLength({ min: 3, max: 200 }).withMessage('Topic must be between 3 and 200 characters'),
  body('category').isIn([
    'education', 'gaming', 'technology', 'entertainment', 'lifestyle',
    'business', 'news', 'sports', 'music', 'comedy', 'travel',
    'food', 'fitness', 'beauty', 'fashion', 'other'
  ]).withMessage('Invalid category'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('specificElements').optional().isArray().withMessage('Specific elements must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { topic, category, difficulty, specificElements } = req.body;

    try {
      const help = await chatWithAI('prompt-help', {
        topic,
        category,
        difficulty,
        specificElements
      });
      
      res.json({
        success: true,
        message: 'Prompt help generated successfully',
        data: {
          topic,
          category,
          difficulty,
          specificElements,
          help
        }
      });
    } catch (error) {
      console.error('AI prompt help failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate prompt help',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Prompt help error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating prompt help'
    });
  }
});

// @desc    Get trending topics for thumbnails
// @route   GET /api/chat/trending-topics
// @access  Public
router.get('/trending-topics', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    try {
      const topics = await chatWithAI('trending-topics', {
        category,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        message: 'Trending topics generated successfully',
        data: {
          category,
          limit: parseInt(limit),
          topics
        }
      });
    } catch (error) {
      console.error('AI trending topics failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate trending topics',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Trending topics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating trending topics'
    });
  }
});

export default router;
