// Error handling utilities

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper to catch errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create specific error types
const createTranscriptionError = (message, details) => {
  const error = new AppError(message, 500, 'TRANSCRIPTION_FAILED');
  error.details = details;
  return error;
};

const createSummarizationError = (message, details) => {
  const error = new AppError(message, 500, 'SUMMARIZATION_FAILED');
  error.details = details;
  return error;
};

const createTranslationError = (message, details) => {
  const error = new AppError(message, 500, 'TRANSLATION_FAILED');
  error.details = details;
  return error;
};

const createQAError = (message, details) => {
  const error = new AppError(message, 500, 'QA_FAILED');
  error.details = details;
  return error;
};

const createPDFError = (message, details) => {
  const error = new AppError(message, 500, 'PDF_PROCESSING_FAILED');
  error.details = details;
  return error;
};

const createVideoDownloadError = (message, details) => {
  const error = new AppError(message, 500, 'VIDEO_DOWNLOAD_FAILED');
  error.details = details;
  return error;
};

// Logger utility
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
};

module.exports = {
  AppError,
  asyncHandler,
  createTranscriptionError,
  createSummarizationError,
  createTranslationError,
  createQAError,
  createPDFError,
  createVideoDownloadError,
  logger
};
