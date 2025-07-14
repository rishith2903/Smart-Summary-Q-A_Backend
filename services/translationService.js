// Handle Windows permission issues with google-translate-api
let translate;
try {
  translate = require('google-translate-api');
} catch (error) {
  // Fallback for Windows permission issues
  translate = {
    detect: () => Promise.reject(new Error('Google Translate API unavailable')),
    translate: () => Promise.reject(new Error('Google Translate API unavailable'))
  };
}

const { createTranslationError, logger } = require('../utils/errorHandler');

class TranslationService {
  constructor() {
    // Language detection patterns for simple detection
    this.languagePatterns = {
      'en': /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
      'es': /\b(el|la|los|las|y|o|pero|en|de|con|por|para)\b/gi,
      'fr': /\b(le|la|les|et|ou|mais|dans|de|avec|par|pour)\b/gi,
      'de': /\b(der|die|das|und|oder|aber|in|von|mit|für)\b/gi,
      'it': /\b(il|la|i|le|e|o|ma|in|di|con|per)\b/gi,
      'pt': /\b(o|a|os|as|e|ou|mas|em|de|com|por|para)\b/gi
    };
  }

  // Detect language of text
  async detectLanguage(text) {
    try {
      if (!text || text.trim().length < 10) {
        return 'en'; // Default to English
      }

      logger.info('Detecting language...');

      // Try using Google Translate API for detection
      try {
        const result = await translate(text, { to: 'en' });
        const detectedLang = result.from.language.iso;
        logger.info(`Language detected: ${detectedLang}`);
        return detectedLang;
      } catch (apiError) {
        logger.warn('Google Translate API detection failed, using fallback method');
        
        // Fallback to simple pattern matching
        return this.detectLanguageSimple(text);
      }
    } catch (error) {
      logger.error('Language detection failed', error);
      return 'en'; // Default to English on error
    }
  }

  // Simple language detection using patterns
  detectLanguageSimple(text) {
    const scores = {};
    
    // Initialize scores
    Object.keys(this.languagePatterns).forEach(lang => {
      scores[lang] = 0;
    });

    // Count matches for each language
    Object.entries(this.languagePatterns).forEach(([lang, pattern]) => {
      const matches = text.match(pattern);
      scores[lang] = matches ? matches.length : 0;
    });

    // Find language with highest score
    const detectedLang = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    logger.info(`Simple detection result: ${detectedLang} (score: ${scores[detectedLang]})`);
    return detectedLang;
  }

  // Translate text to target language
  async translateText(text, targetLanguage, useGpu = false) {
    try {
      if (!text || text.trim().length === 0) {
        return text;
      }

      if (targetLanguage === 'en' || targetLanguage === 'auto') {
        return text; // No translation needed
      }

      logger.info(`Translating text to ${targetLanguage}`);

      // Use Google Translate API
      const result = await translate(text, { 
        to: targetLanguage,
        from: 'auto'
      });

      const translatedText = result.text;
      logger.info('Translation completed successfully');
      
      return translatedText;
    } catch (error) {
      logger.error('Translation failed', error);
      
      // Return original text if translation fails
      logger.warn('Returning original text due to translation failure');
      return text;
    }
  }

  // Translate from source to target language
  async translateFromTo(text, sourceLang, targetLang, useGpu = false) {
    try {
      if (!text || text.trim().length === 0) {
        return text;
      }

      if (sourceLang === targetLang) {
        return text; // No translation needed
      }

      logger.info(`Translating from ${sourceLang} to ${targetLang}`);

      const result = await translate(text, { 
        from: sourceLang,
        to: targetLang
      });

      const translatedText = result.text;
      logger.info('Translation completed successfully');
      
      return translatedText;
    } catch (error) {
      logger.error('Translation failed', error);
      throw createTranslationError('Failed to translate text', error.message);
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'auto': 'Auto-detect'
    };
  }

  // Validate language code
  isValidLanguageCode(code) {
    const supportedCodes = Object.keys(this.getSupportedLanguages());
    return supportedCodes.includes(code);
  }
}

module.exports = new TranslationService();
