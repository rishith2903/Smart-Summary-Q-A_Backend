const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const { validateVideoRequest, validateBatchRequest } = require('../utils/validation');
const { asyncHandler } = require('../utils/errorHandler');

// Process single YouTube video
router.post('/process', validateVideoRequest, asyncHandler(async (req, res) => {
  const { url, targetLanguage = 'en', useGpu = false } = req.body;
  
  console.log(`Processing video: ${url}`);
  const startTime = Date.now();
  
  try {
    const result = await videoService.processSingleVideo(url, targetLanguage, useGpu);
    const processingTime = (Date.now() - startTime) / 1000;
    
    res.json({
      success: true,
      data: {
        ...result,
        processingTime
      }
    });
  } catch (error) {
    console.error('Video processing error:', error);
    throw error;
  }
}));

// Process multiple YouTube videos
router.post('/process-batch', validateBatchRequest, asyncHandler(async (req, res) => {
  const { urls, targetLanguage = 'en', useGpu = false, maxWorkers = 4 } = req.body;
  
  console.log(`Processing ${urls.length} videos in batch`);
  const startTime = Date.now();
  
  try {
    const results = await videoService.processMultipleVideos(urls, targetLanguage, useGpu, maxWorkers);
    const totalTime = (Date.now() - startTime) / 1000;
    
    res.json({
      success: true,
      data: results,
      totalProcessed: results.length,
      totalTime
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    throw error;
  }
}));

// Get video info without processing
router.post('/info', asyncHandler(async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_URL',
        message: 'Video URL is required'
      }
    });
  }
  
  try {
    const info = await videoService.getVideoInfo(url);
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Video info error:', error);
    throw error;
  }
}));

module.exports = router;
