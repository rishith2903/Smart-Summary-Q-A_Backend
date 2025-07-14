const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const pdfService = require('../services/pdfService');
const { asyncHandler } = require('../utils/errorHandler');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Process PDF document
router.post('/process', (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'File upload failed',
          details: err.message
        }
      });
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE',
        message: 'PDF file is required'
      }
    });
  }
  
  console.log(`Processing PDF: ${req.file.originalname}`);
  const startTime = Date.now();
  
  try {
    const result = await pdfService.processPDF(req.file.path);
    const processingTime = (Date.now() - startTime) / 1000;
    
    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        extractedText: result.text,
        summary: result.summary,
        pageCount: result.pageCount,
        processingTime
      }
    });
  } catch (error) {
    console.error('PDF processing error:', error);
    throw error;
  }
}));

// Ask question about PDF content
router.post('/ask', asyncHandler(async (req, res) => {
  const { pdfText, question, targetLanguage = 'en' } = req.body;
  
  if (!pdfText || !question) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_DATA',
        message: 'PDF text and question are required'
      }
    });
  }
  
  console.log(`PDF Q&A request: ${question}`);
  const startTime = Date.now();
  
  try {
    const result = await pdfService.askPDFQuestion(pdfText, question, targetLanguage);
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
    console.error('PDF Q&A error:', error);
    throw error;
  }
}));

module.exports = router;
