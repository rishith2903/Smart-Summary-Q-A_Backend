# Smart-Summary-Q&A Backend

A comprehensive Node.js backend API for the Smart-Summary-Q&A platform, providing AI-powered video and document processing with intelligent summarization and Q&A capabilities.

## 🚀 Features

- **Video Processing**: Extract transcripts and generate summaries from YouTube videos
- **Batch Processing**: Process multiple videos concurrently
- **Q&A System**: Ask questions about video content with intelligent answers
- **PDF Processing**: Upload and analyze PDF documents
- **Translation Support**: Multi-language support with auto-detection
- **RESTful API**: Clean, well-documented API endpoints
- **Error Handling**: Comprehensive error handling and validation
- **Health Monitoring**: Built-in health check endpoints

## 📁 Project Structure

```
backend/
├── server.js              # Main server file
├── routes/                 # API route handlers
│   ├── videoRoutes.js     # Video processing endpoints
│   ├── qaRoutes.js        # Q&A endpoints
│   ├── pdfRoutes.js       # PDF processing endpoints
│   └── healthRoutes.js    # Health check endpoints
├── services/              # Business logic services
│   ├── videoService.js    # Video processing logic
│   ├── transcriptionService.js # Transcript extraction
│   ├── summarizationService.js # Text summarization
│   ├── translationService.js   # Language translation
│   ├── qaService.js       # Question answering
│   └── pdfService.js      # PDF processing
├── utils/                 # Utility functions
│   ├── validation.js      # Request validation
│   └── errorHandler.js    # Error handling utilities
├── tests/                 # Test files
│   ├── test-health.js     # Health endpoint tests
│   ├── test-video.js      # Video processing tests
│   ├── test-qa.js         # Q&A tests
│   ├── test-pdf.js        # PDF processing tests
│   └── run-all-tests.js   # Complete test suite
├── uploads/               # Temporary file uploads
└── temp/                  # Temporary processing files
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🔧 Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Processing Configuration
MAX_CONCURRENT_VIDEOS=4
MAX_VIDEO_DURATION=3600
MAX_FILE_SIZE=10485760

# Model Configuration
USE_GPU=false
DEFAULT_LANGUAGE=en

# Logging
LOG_LEVEL=info
```

## 📚 API Documentation

### Health Endpoints

#### GET /api/health
Check server health and service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-11T14:31:22.116Z",
  "uptime": 24.9788793,
  "services": {
    "transcription": "available",
    "summarization": "available",
    "translation": "available",
    "qa": "available",
    "pdf": "available"
  }
}
```

### Video Processing Endpoints

#### POST /api/video/process
Process a single YouTube video.

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=...",
  "targetLanguage": "en",
  "useGpu": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://youtube.com/watch?v=...",
    "videoInfo": { ... },
    "transcriptSnippet": "First 500 chars...",
    "summary": "AI-generated summary",
    "translatedSummary": "Translated summary",
    "detectedLanguage": "en",
    "processingTime": 2.5
  }
}
```

#### POST /api/video/process-batch
Process multiple YouTube videos.

**Request:**
```json
{
  "urls": ["url1", "url2", "url3"],
  "targetLanguage": "auto",
  "useGpu": false,
  "maxWorkers": 4
}
```

#### POST /api/video/info
Get video information without processing.

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=..."
}
```

### Q&A Endpoints

#### POST /api/qa/ask
Ask a question about content.

**Request:**
```json
{
  "summary": "Content summary...",
  "question": "What is the main topic?",
  "targetLanguage": "en",
  "useGpu": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What is the main topic?",
    "answer": "The main topic is...",
    "confidence": 0.85,
    "context": "Relevant context...",
    "processingTime": 1.2
  }
}
```

#### POST /api/qa/suggestions
Get question suggestions based on content.

**Request:**
```json
{
  "summary": "Content summary..."
}
```

### PDF Processing Endpoints

#### POST /api/pdf/process
Upload and process a PDF document.

**Request:** FormData with PDF file

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "document.pdf",
    "extractedText": "PDF content...",
    "summary": "PDF summary",
    "pageCount": 10,
    "processingTime": 3.2
  }
}
```

#### POST /api/pdf/ask
Ask questions about PDF content.

**Request:**
```json
{
  "pdfText": "PDF content...",
  "question": "What is discussed?",
  "targetLanguage": "en"
}
```

## 🧪 Testing

Run the complete test suite:

```bash
# Run all tests
node tests/run-all-tests.js

# Run individual test suites
node tests/test-health.js
node tests/test-video.js
node tests/test-qa.js
node tests/test-pdf.js
```

**Test Coverage:**
- ✅ Health endpoints (3/3 tests)
- ✅ Video processing (5/5 tests)
- ✅ Q&A functionality (5/5 tests)
- ✅ PDF processing (4/4 tests)

**Total: 17/17 tests passing**

## 🔍 Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Additional error details"
  }
}
```

**Common Error Codes:**
- `MISSING_URL` - Video URL is required
- `INVALID_URL` - Invalid YouTube URL format
- `TRANSCRIPTION_FAILED` - Failed to get transcript
- `SUMMARIZATION_FAILED` - Failed to generate summary
- `QA_FAILED` - Failed to answer question
- `PDF_PROCESSING_FAILED` - Failed to process PDF

## 🚀 Production Deployment

1. **Set environment to production**
   ```bash
   NODE_ENV=production
   ```

2. **Use process manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "video-processor-api"
   ```

3. **Set up reverse proxy** (nginx example)
   ```nginx
   location /api {
     proxy_pass http://localhost:5000;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
   }
   ```

## 📝 Notes

- Currently uses mock implementations for AI models for testing
- In production, integrate with actual AI services (OpenAI, Hugging Face, etc.)
- YouTube downloading may require API keys for production use
- PDF processing supports files up to 10MB
- Concurrent video processing is limited to prevent resource exhaustion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `node tests/run-all-tests.js`
5. Submit a pull request


#
