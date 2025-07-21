const translationService = require('./translationService');
const { createQAError, logger } = require('../utils/errorHandler');

class QAService {
  constructor() {
    this.qaModel = null;
    this.isInitialized = false;
    this.transformers = null;
  }

  // Initialize the Q&A model
  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing Q&A model...');

      // Try to load transformers dynamically
      try {
        this.transformers = await import('@xenova/transformers');
        logger.info('Transformers loaded successfully for Q&A');
      } catch (error) {
        logger.warn('Transformers not available, using fallback Q&A');
      }

      // For now, use extractive Q&A approach
      // In production, you would use actual AI models
      this.qaModel = null; // We'll use extractive Q&A instead

      this.isInitialized = true;
      logger.info('Q&A model initialized successfully (using extractive method)');
    } catch (error) {
      logger.error('Failed to initialize Q&A model', error);
      throw createQAError('Failed to initialize Q&A model', error.message);
    }
  }

  // Find relevant context from summary using simple text matching
  findRelevantContext(summary, question, topK = 3) {
    try {
      // Split summary into sentences
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      if (sentences.length === 0) {
        return summary;
      }

      // Simple keyword matching for relevance scoring
      const questionWords = question.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);

      // Score sentences based on keyword overlap
      const scoredSentences = sentences.map((sentence, index) => {
        const sentenceWords = sentence.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/);
        
        let score = 0;
        questionWords.forEach(qWord => {
          if (sentenceWords.some(sWord => sWord.includes(qWord) || qWord.includes(sWord))) {
            score += 1;
          }
        });

        return {
          sentence: sentence.trim(),
          score,
          index
        };
      });

      // Sort by score and take top sentences
      scoredSentences.sort((a, b) => b.score - a.score);
      const topSentences = scoredSentences
        .slice(0, topK)
        .sort((a, b) => a.index - b.index) // Restore original order
        .map(item => item.sentence);

      const context = topSentences.join('. ');
      return context || summary.substring(0, 500); // Fallback to first 500 chars
    } catch (error) {
      logger.warn('Context finding failed, using full summary', error);
      return summary;
    }
  }

  // Answer question using the Q&A model
  async answerQuestion(summary, question, targetLanguage = 'en', useGpu = false) {
    try {
      await this.initialize();
      
      logger.info(`Answering question: ${question}`);

      // For now, assume questions are in English to avoid translation issues
      // TODO: Fix translation service for better language detection
      let questionEn = question;

      // Simple English detection - if question contains common English words, treat as English
      const englishWords = ['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'this', 'that'];
      const isLikelyEnglish = englishWords.some(word =>
        question.toLowerCase().includes(word)
      );

      if (!isLikelyEnglish) {
        try {
          const questionLang = await translationService.detectLanguage(question);
          if (questionLang !== 'en') {
            questionEn = await translationService.translateFromTo(question, questionLang, 'en');
            logger.info('Question translated to English for processing');
          }
        } catch (translationError) {
          logger.warn('Translation failed, proceeding with original question:', translationError.message);
          questionEn = question; // Use original question if translation fails
        }
      }

      // Find relevant context
      const context = this.findRelevantContext(summary, questionEn);

      // Use extractive Q&A instead of AI model
      const result = this.extractiveAnswer(context, questionEn);

      let answer = result.answer;
      const confidence = result.confidence;

      // Translate answer back if needed
      if (targetLanguage !== 'en') {
        try {
          answer = await translationService.translateFromTo(answer, 'en', targetLanguage);
          logger.info(`Answer translated to ${targetLanguage}`);
        } catch (translationError) {
          logger.warn(`Translation to ${targetLanguage} failed, returning English answer:`, translationError.message);
          // Keep the English answer if translation fails
        }
      }

      logger.info('Question answered successfully');
      
      return {
        answer,
        confidence,
        context: context.substring(0, 200) + (context.length > 200 ? '...' : '')
      };
    } catch (error) {
      logger.error('Q&A failed', error);
      throw createQAError('Failed to answer question', error.message);
    }
  }

  // Generate question suggestions based on content
  async generateQuestionSuggestions(summary) {
    try {
      // Simple rule-based question generation
      const suggestions = [];
      
      // Analyze content for common question patterns
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      // Generic questions
      suggestions.push(
        "What is the main topic discussed?",
        "Can you summarize the key points?",
        "What are the most important takeaways?"
      );

      // Content-specific questions based on keywords
      const content = summary.toLowerCase();
      
      if (content.includes('how') || content.includes('method') || content.includes('process')) {
        suggestions.push("How does this process work?");
      }
      
      if (content.includes('why') || content.includes('reason') || content.includes('because')) {
        suggestions.push("Why is this important?");
      }
      
      if (content.includes('when') || content.includes('time') || content.includes('date')) {
        suggestions.push("When did this happen?");
      }
      
      if (content.includes('who') || content.includes('person') || content.includes('people')) {
        suggestions.push("Who are the key people mentioned?");
      }
      
      if (content.includes('where') || content.includes('location') || content.includes('place')) {
        suggestions.push("Where does this take place?");
      }

      // Remove duplicates and limit to 8 suggestions
      const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);
      
      logger.info(`Generated ${uniqueSuggestions.length} question suggestions`);
      return uniqueSuggestions;
    } catch (error) {
      logger.error('Question suggestion generation failed', error);
      
      // Return default questions on error
      return [
        "What is the main topic?",
        "Can you summarize this?",
        "What are the key points?",
        "Why is this important?"
      ];
    }
  }

  // Simple extractive Q&A fallback
  extractiveAnswer(summary, question) {
    try {
      // Simple keyword-based extraction
      const questionWords = question.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);

      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      // Find sentence with most keyword matches
      let bestSentence = sentences[0] || "I couldn't find a specific answer.";
      let maxMatches = 0;

      sentences.forEach(sentence => {
        const sentenceWords = sentence.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/);
        
        let matches = 0;
        questionWords.forEach(qWord => {
          if (sentenceWords.some(sWord => sWord.includes(qWord) || qWord.includes(sWord))) {
            matches++;
          }
        });

        if (matches > maxMatches) {
          maxMatches = matches;
          bestSentence = sentence.trim();
        }
      });

      return {
        answer: bestSentence,
        confidence: Math.min(maxMatches / questionWords.length, 0.9),
        context: bestSentence
      };
    } catch (error) {
      logger.error('Extractive answer failed', error);
      return {
        answer: "I couldn't find a specific answer to your question.",
        confidence: 0.1,
        context: summary.substring(0, 100) + '...'
      };
    }
  }
}

module.exports = new QAService();
