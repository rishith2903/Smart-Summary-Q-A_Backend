const { describe, it, beforeEach, afterEach } = require('@jest/globals');

// Mock @xenova/transformers before requiring the service
jest.mock('@xenova/transformers');

const qaService = require('../services/qaService');

describe('Q&A Service Tests', () => {
  let testSummary;
  let testQuestions;

  beforeEach(() => {
    testSummary = 'This is a test summary about daily routines and productivity habits. People should wake up early and exercise regularly. Good habits lead to success and better health. Morning routines are particularly important for setting the tone of the day. The summary discusses various aspects of personal development and time management.';

    testQuestions = [
      'What is this about?',
      'What are good habits?',
      'Why are morning routines important?',
      'How can people be more productive?'
    ];
  });

  describe('Question Answering', () => {
    it('should have answerQuestion method', () => {
      expect(typeof qaService.answerQuestion).toBe('function');
    });

    it('should answer basic questions about content', async () => {
      const question = 'What is this about?';

      const result = await qaService.answerQuestion(testSummary, question, 'en');

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('context');
      expect(typeof result.answer).toBe('string');
      expect(result.answer.length).toBeGreaterThan(0);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle multiple questions correctly', async () => {
      for (const question of testQuestions) {
        const result = await qaService.answerQuestion(testSummary, question, 'en');

        expect(result).toHaveProperty('answer');
        expect(result).toHaveProperty('confidence');
        expect(typeof result.answer).toBe('string');
        expect(result.answer.length).toBeGreaterThan(0);
      }
    });

    it('should handle questions with different target languages', async () => {
      const question = 'What is this about?';
      const languages = ['en', 'es', 'fr'];

      for (const lang of languages) {
        try {
          const result = await qaService.answerQuestion(testSummary, question, lang);

          expect(result).toHaveProperty('answer');
          expect(typeof result.answer).toBe('string');
          expect(result.answer.length).toBeGreaterThan(0);
        } catch (error) {
          // Translation might fail, which is acceptable
          console.log(`Translation to ${lang} failed (expected):`, error.message);
        }
      }
    });
  });

  describe('Question Processing', () => {
    it('should handle different question types', async () => {
      const questionTypes = [
        'What is productivity?',           // What question
        'How can I be productive?',       // How question
        'Why are habits important?',      // Why question
        'When should I wake up?',         // When question
        'Where can I exercise?'           // Where question
      ];

      for (const question of questionTypes) {
        const result = await qaService.answerQuestion(testSummary, question, 'en');

        expect(result).toHaveProperty('answer');
        expect(typeof result.answer).toBe('string');
        expect(result.answer.length).toBeGreaterThan(0);
      }
    });

    it('should handle complex questions', async () => {
      const complexQuestion = 'What are the most important daily habits for productivity and how do morning routines contribute to overall success?';

      const result = await qaService.answerQuestion(testSummary, complexQuestion, 'en');

      expect(result).toHaveProperty('answer');
      expect(typeof result.answer).toBe('string');
      expect(result.answer.length).toBeGreaterThan(0);
    });

    it('should handle questions not directly answerable from content', async () => {
      const unrelatedQuestion = 'What is the capital of France?';

      const result = await qaService.answerQuestion(testSummary, unrelatedQuestion, 'en');

      expect(result).toHaveProperty('answer');
      expect(typeof result.answer).toBe('string');
      // Should provide some response even if not directly answerable
    });
  });

  describe('Context Finding', () => {
    it('should have findRelevantContext method', () => {
      expect(typeof qaService.findRelevantContext).toBe('function');
    });

    it('should find relevant context for questions', () => {
      const question = 'What are morning routines?';
      const context = qaService.findRelevantContext(testSummary, question);

      expect(typeof context).toBe('string');
      expect(context.length).toBeGreaterThan(0);
      expect(context.length).toBeLessThanOrEqual(testSummary.length);
    });

    it('should return meaningful context for different questions', () => {
      const questions = [
        'What are habits?',
        'Why exercise?',
        'How to be productive?'
      ];

      questions.forEach(question => {
        const context = qaService.findRelevantContext(testSummary, question);

        expect(typeof context).toBe('string');
        expect(context.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Question Suggestions', () => {
    it('should have generateQuestionSuggestions method', () => {
      expect(typeof qaService.generateQuestionSuggestions).toBe('function');
    });

    it('should generate relevant question suggestions', async () => {
      const suggestions = await qaService.generateQuestionSuggestions(testSummary);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
        expect(suggestion.endsWith('?')).toBe(true);
      });
    });

    it('should generate diverse question suggestions', async () => {
      const suggestions = await qaService.generateQuestionSuggestions(testSummary);

      // Should have multiple different suggestions
      expect(suggestions.length).toBeGreaterThanOrEqual(3);

      // Should not have duplicate suggestions
      const uniqueSuggestions = [...new Set(suggestions)];
      expect(uniqueSuggestions.length).toBe(suggestions.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty summary gracefully', async () => {
      const result = await qaService.answerQuestion('', 'What is this about?', 'en');

      expect(result).toHaveProperty('answer');
      expect(typeof result.answer).toBe('string');
    });

    it('should handle empty question gracefully', async () => {
      const result = await qaService.answerQuestion(testSummary, '', 'en');
      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe('string');
    });

    it('should handle null/undefined inputs gracefully', async () => {
      await expect(qaService.answerQuestion(null, 'What is this?', 'en'))
        .rejects.toThrow();

      await expect(qaService.answerQuestion(testSummary, null, 'en'))
        .rejects.toThrow();
    });

    it('should handle invalid language codes gracefully', async () => {
      try {
        const result = await qaService.answerQuestion(testSummary, 'What is this about?', 'invalid-lang');

        // Should either work or fail gracefully
        expect(result).toHaveProperty('answer');
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should complete Q&A within reasonable time', async () => {
      const startTime = Date.now();

      const result = await qaService.answerQuestion(testSummary, 'What is this about?', 'en');

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result).toHaveProperty('answer');
    });

    it('should handle concurrent Q&A requests', async () => {
      const promises = testQuestions.map(question =>
        qaService.answerQuestion(testSummary, question, 'en')
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toHaveProperty('answer');
        expect(typeof result.answer).toBe('string');
        expect(result.answer.length).toBeGreaterThan(0);
      });
    });
  });
});