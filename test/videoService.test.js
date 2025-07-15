const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const videoService = require('../services/videoService');

describe('Video Service Tests', () => {
  let testUrl;

  beforeEach(() => {
    testUrl = 'https://youtu.be/zgjsFRDynZo?si=T7jWWibqQfVJPnsM';
  });

  describe('Video ID Extraction', () => {
    it('should extract video ID from YouTube URL', () => {
      const videoId = videoService.extractVideoId(testUrl);
      expect(videoId).toBe('zgjsFRDynZo');
    });

    it('should extract video ID from different YouTube URL formats', () => {
      const urls = [
        'https://www.youtube.com/watch?v=zgjsFRDynZo',
        'https://youtu.be/zgjsFRDynZo',
        'https://youtube.com/watch?v=zgjsFRDynZo&t=10s'
      ];

      urls.forEach(url => {
        const videoId = videoService.extractVideoId(url);
        expect(videoId).toBe('zgjsFRDynZo');
      });
    });

    it('should throw error for invalid YouTube URL', () => {
      expect(() => {
        videoService.extractVideoId('https://invalid-url.com');
      }).toThrow();
    });
  });

  describe('Video Info Retrieval', () => {
    it('should retrieve video metadata', async () => {
      const videoInfo = await videoService.getVideoInfo(testUrl);

      expect(videoInfo).toHaveProperty('videoId');
      expect(videoInfo).toHaveProperty('title');
      expect(videoInfo).toHaveProperty('author');
      expect(videoInfo).toHaveProperty('thumbnail');
      expect(videoInfo.videoId).toBe('zgjsFRDynZo');
      expect(typeof videoInfo.title).toBe('string');
      expect(videoInfo.title.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle invalid video URL gracefully', async () => {
      await expect(videoService.getVideoInfo('https://youtu.be/invalid-id'))
        .rejects.toThrow();
    });
  });

  describe('Video Processing Pipeline', () => {
    it('should have processVideo method', () => {
      expect(typeof videoService.processVideo).toBe('function');
    });

    it('should have required service methods', () => {
      expect(typeof videoService.extractVideoId).toBe('function');
      expect(typeof videoService.getVideoInfo).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Test with a definitely invalid URL that will cause network errors
      const invalidUrl = 'https://youtu.be/definitely-invalid-video-id-that-does-not-exist';

      await expect(videoService.getVideoInfo(invalidUrl))
        .rejects.toThrow();
    });
  });
});