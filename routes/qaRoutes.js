const express = require('express');
const router = express.Router();
const qaService = require('../services/qaService');
const { validateQARequest } = require('../utils/validation');
const { asyncHandler } = require('../utils/errorHandler');

// Ask question about content
router.post('/ask', validateQARequest, asyncHandler(async (req, res) => {
  const { summary, question, targetLanguage = 'en', useGpu = false } = req.body;
  
  console.log(`Q&A request: ${question}`);
  const startTime = Date.now();
  
  try {
    const result = await qaService.answerQuestion(summary, question, targetLanguage, useGpu);
    const processingTime = (Date.now() - startTime) / 1000;
    
    res.json({
      success: true,
      data: {
        question,
        answer: result.answer,
        confidence: result.confidence || 0.8,
        context: result.context,
        processingTime
      }
    });
  } catch (error) {
    console.error('Q&A error:', error);
    throw error;
  }
}));

// Get suggested questions based on content
router.post('/suggestions', asyncHandler(async (req, res) => {
  const { summary } = req.body;
  
  if (!summary) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_SUMMARY',
        message: 'Summary text is required'
      }
    });
  }
  
  try {
    const suggestions = await qaService.generateQuestionSuggestions(summary);
    
    res.json({
      success: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    console.error('Question suggestions error:', error);
    throw error;
  }
}));

module.exports = router;
