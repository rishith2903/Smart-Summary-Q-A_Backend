// Validation middleware for API requests

const validateVideoRequest = (req, res, next) => {
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
  
  // Basic YouTube URL validation
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  if (!youtubeRegex.test(url)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_URL',
        message: 'Invalid YouTube URL format'
      }
    });
  }
  
  next();
};

const validateBatchRequest = (req, res, next) => {
  const { urls } = req.body;
  
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_URLS',
        message: 'Array of video URLs is required'
      }
    });
  }
  
  if (urls.length > 20) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOO_MANY_URLS',
        message: 'Maximum 20 videos allowed per batch'
      }
    });
  }
  
  // Validate each URL
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  for (let i = 0; i < urls.length; i++) {
    if (!youtubeRegex.test(urls[i])) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: `Invalid YouTube URL at index ${i}: ${urls[i]}`
        }
      });
    }
  }
  
  next();
};

const validateQARequest = (req, res, next) => {
  const { summary, question } = req.body;
  
  if (!summary) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_SUMMARY',
        message: 'Summary text is required'
      }
    });
  }
  
  if (!question) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_QUESTION',
        message: 'Question is required'
      }
    });
  }
  
  if (summary.length < 10) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SUMMARY_TOO_SHORT',
        message: 'Summary must be at least 10 characters long'
      }
    });
  }
  
  if (question.length < 3) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'QUESTION_TOO_SHORT',
        message: 'Question must be at least 3 characters long'
      }
    });
  }
  
  next();
};

module.exports = {
  validateVideoRequest,
  validateBatchRequest,
  validateQARequest
};
