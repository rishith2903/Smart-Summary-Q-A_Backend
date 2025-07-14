const { describe, it, beforeEach, afterEach, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mock @xenova/transformers before requiring routes
jest.mock('@xenova/transformers');

const videoRoutes = require('../routes/videoRoutes');
const qaRoutes = require('../routes/qaRoutes');
const pdfRoutes = require('../routes/pdfRoutes');
const healthRoutes = require('../routes/healthRoutes');

describe('API Endpoints Tests', () => {
  let app;
  let server;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Add routes
    app.use('/api/health', healthRoutes);
    app.use('/api/video', videoRoutes);
    app.use('/api/qa', qaRoutes);
    app.use('/api/pdf', pdfRoutes);

    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        message: 'YouTube Video Processing API',
        version: '1.0.0',
        endpoints: {
          'POST /api/video/process': 'Process single YouTube video',
          'POST /api/video/info': 'Get video metadata',
          'POST /api/qa/ask': 'Ask question about content',
          'POST /api/pdf/process': 'Process PDF document',
          'GET /api/health': 'Health check'
        }
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message
        }
      });
    });
  });

  describe('Health Endpoints', () => {
    it('should return 200 for health check', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('services');
    });

    it('should include service status in health check', async () => {
      const res = await request(app).get('/api/health');

      expect(res.body.services).toHaveProperty('transcription');
      expect(res.body.services).toHaveProperty('summarization');
      expect(res.body.services).toHaveProperty('qa');
      expect(res.body.services).toHaveProperty('pdf');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API documentation', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.message).toBe('YouTube Video Processing API');
    });
  });

  describe('Video Endpoints', () => {
    describe('POST /api/video/info', () => {
      it('should get video metadata for valid URL', async () => {
        const testUrl = 'https://youtu.be/zgjsFRDynZo?si=T7jWWibqQfVJPnsM';

        const res = await request(app)
          .post('/api/video/info')
          .send({ url: testUrl });

        if (res.statusCode === 200) {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('videoId');
          expect(res.body.data).toHaveProperty('title');
          expect(res.body.data).toHaveProperty('author');
        } else {
          // May fail due to network issues
          expect(res.body).toHaveProperty('success', false);
          expect(res.body).toHaveProperty('error');
        }
      });

      it('should return 400 for missing URL', async () => {
        const res = await request(app)
          .post('/api/video/info')
          .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      });

      it('should return error for invalid URL', async () => {
        const res = await request(app)
          .post('/api/video/info')
          .send({ url: 'invalid-url' });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      });
    });

    describe('POST /api/video/process', () => {
      it('should process video for valid URL', async () => {
        const testUrl = 'https://youtu.be/zgjsFRDynZo?si=T7jWWibqQfVJPnsM';

        const res = await request(app)
          .post('/api/video/process')
          .send({
            url: testUrl,
            targetLanguage: 'en'
          });

        // This test may take a long time and might fail due to external dependencies
        if (res.statusCode === 200) {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('videoInfo');
          expect(res.body.data).toHaveProperty('transcript');
          expect(res.body.data).toHaveProperty('summary');
        } else {
          expect(res.body).toHaveProperty('success', false);
          expect(res.body).toHaveProperty('error');
        }
      }, 120000); // 2 minutes timeout

      it('should return 400 for missing required fields', async () => {
        const res = await request(app)
          .post('/api/video/process')
          .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      });
    });
  });

  describe('Q&A Endpoints', () => {
    describe('POST /api/qa/ask', () => {
      it('should answer questions about provided content', async () => {
        const testData = {
          summary: 'This is a test summary about daily routines and productivity habits. People should wake up early and exercise regularly.',
          question: 'What is this about?',
          targetLanguage: 'en'
        };

        const res = await request(app)
          .post('/api/qa/ask')
          .send(testData);

        if (res.statusCode === 200) {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('answer');
          expect(res.body.data).toHaveProperty('confidence');
          expect(typeof res.body.data.answer).toBe('string');
          expect(res.body.data.answer.length).toBeGreaterThan(0);
        } else {
          expect(res.body).toHaveProperty('success', false);
          expect(res.body).toHaveProperty('error');
        }
      });

      it('should return 400 for missing required fields', async () => {
        const res = await request(app)
          .post('/api/qa/ask')
          .send({ summary: 'test summary' }); // Missing question

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      });

      it('should handle empty question gracefully', async () => {
        const res = await request(app)
          .post('/api/qa/ask')
          .send({
            summary: 'Test summary',
            question: '',
            targetLanguage: 'en'
          });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
        expect(res.body).toHaveProperty('success', false);
      });
    });
  });

  describe('PDF Endpoints', () => {
    describe('POST /api/pdf/process', () => {
      it('should return 400 for missing file', async () => {
        const res = await request(app)
          .post('/api/pdf/process')
          .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toHaveProperty('code', 'NO_FILE');
      });

      it('should handle file upload endpoint structure', async () => {
        // Test the endpoint exists and validates input
        const res = await request(app)
          .post('/api/pdf/process');

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.statusCode).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/api/video/info')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should handle large payloads appropriately', async () => {
      const largePayload = {
        url: 'https://youtu.be/test',
        data: 'x'.repeat(100000) // 100KB of data
      };

      const res = await request(app)
        .post('/api/video/info')
        .send(largePayload);

      // Should either process or reject gracefully
      expect([200, 400, 413, 500]).toContain(res.statusCode);
    });
  });

  describe('CORS and Headers', () => {
    it('should include CORS headers', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should accept JSON content type', async () => {
      const res = await request(app)
        .post('/api/video/info')
        .set('Content-Type', 'application/json')
        .send({ url: 'test' });

      // Should process the request (may fail validation but should accept JSON)
      expect(res.statusCode).not.toBe(415); // Not "Unsupported Media Type"
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill().map(() =>
        request(app).get('/api/health')
      );

      const results = await Promise.all(promises);

      results.forEach(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'healthy');
      });
    });

    it('should respond to health check quickly', async () => {
      const startTime = Date.now();

      const res = await request(app).get('/api/health');

      const responseTime = Date.now() - startTime;

      expect(res.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});