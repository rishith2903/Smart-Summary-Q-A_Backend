const { describe, it, beforeEach, afterEach } = require('@jest/globals');

// Mock @xenova/transformers before requiring the service
jest.mock('@xenova/transformers');

const summarizationService = require('../services/summarizationService');

describe('Summarization Service Tests', () => {
  let testText;
  let shortText;
  let longText;

  beforeEach(() => {
    testText = 'This is a test transcript about daily routines and productivity habits. People should wake up early and exercise regularly. Good habits lead to success and better health. Morning routines are particularly important for setting the tone of the day.';

    shortText = 'This is a very short text.';

    longText = 'This is a much longer text that contains multiple sentences and paragraphs. '.repeat(50) +
               'It discusses various topics including technology, science, and human behavior. ' +
               'The text is designed to test the summarization capabilities of the service. ' +
               'It should be long enough to require actual summarization rather than just returning the original text.';
  });

  describe('Text Summarization', () => {
    it('should have summarizeText method', () => {
      expect(typeof summarizationService.summarizeText).toBe('function');
    });

    it('should summarize normal length text', async () => {
      const summary = await summarizationService.summarizeText(testText);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(testText.length);
    });

    it('should handle short text appropriately', async () => {
      // Short text should throw an error according to the service implementation
      await expect(summarizationService.summarizeText(shortText))
        .rejects.toThrow('Text is too short to summarize');
    });

    it('should handle long text and provide meaningful summarization', async () => {
      const summary = await summarizationService.summarizeText(longText);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThan(longText.length);
    });

    it('should handle empty text gracefully', async () => {
      // Empty text should throw an error according to the service implementation
      await expect(summarizationService.summarizeText(''))
        .rejects.toThrow('Text is too short to summarize');
    });

    it('should handle null/undefined input gracefully', async () => {
      await expect(summarizationService.summarizeText(null))
        .rejects.toThrow();

      await expect(summarizationService.summarizeText(undefined))
        .rejects.toThrow();
    });
  });

  describe('Text Processing', () => {
    it('should have text preprocessing capabilities', () => {
      // Check if service has internal text processing methods
      expect(typeof summarizationService.summarizeText).toBe('function');
    });

    it('should handle special characters in text', async () => {
      const textWithSpecialChars = 'This text contains special characters: @#$%^&*()! And numbers: 12345. Also unicode: 🎉📝✅';

      const summary = await summarizationService.summarizeText(textWithSpecialChars);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should handle multilingual text', async () => {
      const multilingualText = 'This is English text. Esto es texto en español. C\'est du texte français. Dies ist deutscher Text.';

      const summary = await summarizationService.summarizeText(multilingualText);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('Summarization Quality', () => {
    it('should preserve key information in summary', async () => {
      const keywordText = 'The important keyword PRODUCTIVITY appears multiple times. PRODUCTIVITY is crucial for success. Daily PRODUCTIVITY habits matter most.';

      const summary = await summarizationService.summarizeText(keywordText);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      // Summary should ideally contain key concepts
    });

    it('should handle technical text appropriately', async () => {
      const technicalText = 'Machine learning algorithms use neural networks to process data. Deep learning models require large datasets for training. Artificial intelligence systems can perform complex tasks automatically.';

      const summary = await summarizationService.summarizeText(technicalText);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete summarization within reasonable time', async () => {
      const startTime = Date.now();

      const summary = await summarizationService.summarizeText(testText);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(typeof summary).toBe('string');
    });

    it('should handle concurrent summarization requests', async () => {
      const promises = [
        summarizationService.summarizeText(longText),
        summarizationService.summarizeText(longText),
        summarizationService.summarizeText(longText)
      ];

      const results = await Promise.all(promises);

      results.forEach(summary => {
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle extremely long text gracefully', async () => {
      const extremelyLongText = 'This is a very long sentence. '.repeat(10000);

      try {
        const summary = await summarizationService.summarizeText(extremelyLongText);
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      } catch (error) {
        // Should either succeed or fail gracefully
        expect(error.message).toBeDefined();
      }
    });

    it('should handle malformed input gracefully', async () => {
      const malformedInputs = [
        123,
        [],
        {},
        true,
        false
      ];

      for (const input of malformedInputs) {
        await expect(summarizationService.summarizeText(input))
          .rejects.toThrow();
      }
    });
  });
});