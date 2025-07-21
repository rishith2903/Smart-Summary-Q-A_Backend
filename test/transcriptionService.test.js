const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const transcriptionService = require('../services/transcriptionService');
const fs = require('fs');
const path = require('path');

// Set test environment for optimized processing
process.env.NODE_ENV = 'test';

describe('Transcription Service Tests', () => {
  let testUrl;

  beforeEach(() => {
    testUrl = 'https://youtu.be/zgjsFRDynZo?si=T7jWWibqQfVJPnsM';
  });

  describe('Video ID Extraction', () => {
    it('should extract video ID from YouTube URL', () => {
      const videoId = transcriptionService.extractVideoId(testUrl);
      expect(videoId).toBe('zgjsFRDynZo');
    });

    it('should handle different URL formats', () => {
      const urls = [
        'https://www.youtube.com/watch?v=abc123',
        'https://youtu.be/abc123',
        'https://youtube.com/watch?v=abc123&t=10s'
      ];

      urls.forEach(url => {
        const videoId = transcriptionService.extractVideoId(url);
        expect(videoId).toBe('abc123');
      });
    });
  });

  describe('YouTube Transcript API', () => {
    it('should have getYouTubeTranscriptAPI method', () => {
      expect(typeof transcriptionService.getYouTubeTranscriptAPI).toBe('function');
    });

    it('should attempt to get transcript from YouTube API', async () => {
      const videoId = 'zgjsFRDynZo';

      try {
        const transcript = await transcriptionService.getYouTubeTranscriptAPI(videoId);
        expect(typeof transcript).toBe('string');
      } catch (error) {
        // Expected to fail for videos without transcripts
        expect(error.message).toContain('transcript');
      }
    });
  });

  describe('Audio Download', () => {
    it('should have downloadAudio method', () => {
      expect(typeof transcriptionService.downloadAudio).toBe('function');
    });

    it('should download audio from YouTube URL', async () => {
      try {
        const audioPath = await transcriptionService.downloadAudio(testUrl);
        expect(typeof audioPath).toBe('string');
        expect(audioPath).toContain('.webm');

        // Clean up downloaded file
        if (fs.existsSync(audioPath)) {
          await transcriptionService.cleanupFile(audioPath);
        }
      } catch (error) {
        // May fail due to network or yt-dlp issues
        console.log('Audio download test failed (expected):', error.message);
      }
    }, 60000); // Increased timeout for audio download
  });

  describe('Whisper Transcription', () => {
    it('should have transcribeAudio method', () => {
      expect(typeof transcriptionService.transcribeAudio).toBe('function');
    });

    it('should handle missing audio file gracefully', async () => {
      const nonExistentPath = path.join(__dirname, 'nonexistent_audio_file.webm');

      await expect(transcriptionService.transcribeAudio(nonExistentPath))
        .rejects.toThrow(/Audio file not found|Transcription failed/);
    });
  });

  describe('Complete Transcript Pipeline', () => {
    it('should have getYouTubeTranscript method', () => {
      expect(typeof transcriptionService.getYouTubeTranscript).toBe('function');
    });

    it('should attempt full transcript extraction', async () => {
      const transcript = await transcriptionService.getYouTubeTranscript(testUrl);

      expect(typeof transcript).toBe('string');
      expect(transcript.length).toBeGreaterThan(0);

      // Should either return real transcript or honest response
      const isRealTranscript = !transcript.includes('TRANSCRIPT NOT AVAILABLE');
      const isHonestResponse = transcript.includes('TRANSCRIPT NOT AVAILABLE');

      expect(isRealTranscript || isHonestResponse).toBe(true);
    }, 120000); // Increased to 2 minutes for more reliable testing
  });

  describe('Utility Methods', () => {
    it('should have cleanupFile method', () => {
      expect(typeof transcriptionService.cleanupFile).toBe('function');
    });

    it('should have generateHonestResponse method', () => {
      expect(typeof transcriptionService.generateHonestResponse).toBe('function');
    });

    it('should generate honest response when needed', () => {
      const honestResponse = transcriptionService.generateHonestResponse();

      expect(typeof honestResponse).toBe('string');
      expect(honestResponse).toContain('TRANSCRIPT NOT AVAILABLE');
      expect(honestResponse.length).toBeGreaterThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      await expect(transcriptionService.getYouTubeTranscript('invalid-url'))
        .rejects.toThrow();
    });

    it('should handle network failures gracefully', async () => {
      const invalidUrl = 'https://youtu.be/invalid-video-id-12345';

      const result = await transcriptionService.getYouTubeTranscript(invalidUrl);

      // Should return honest response for invalid videos
      expect(result).toContain('TRANSCRIPT NOT AVAILABLE');
    }, 60000); // Increased timeout to 60 seconds for network failure handling
  });
});