const { YoutubeTranscript } = require('youtube-transcript');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`)
};

class TranscriptionService {
  // Main method to get transcript from YouTube video
  async getYouTubeTranscript(url) {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      logger.info(`Getting transcript for video: ${videoId}`);

      // METHOD 1: YouTube Transcript API
      try {
        logger.info('Method 1: YouTube Transcript API...');
        const transcript = await this.getYouTubeTranscriptAPI(videoId);
        logger.info('✅ SUCCESS: YouTube API');
        return transcript;
      } catch (error1) {
        logger.warn(`Method 1 failed: ${error1.message}`);
        
        // METHOD 2: Audio Transcription
        try {
          logger.info('Method 2: Audio Transcription...');
          const audioTranscript = await this.getAudioTranscription(url);
          logger.info('✅ SUCCESS: Audio Transcription');
          return audioTranscript;
        } catch (error2) {
          logger.warn(`Method 2 failed: ${error2.message}`);
          
          // METHOD 3: Browser Automation
          try {
            logger.info('Method 3: Browser Automation...');
            const browserTranscript = await this.getBrowserTranscript(url);
            logger.info('✅ SUCCESS: Browser Automation');
            return browserTranscript;
          } catch (error3) {
            logger.warn(`Method 3 failed: ${error3.message}`);
            
            // All methods failed - provide honest response
            logger.info('❌ All methods failed');
            return this.generateHonestResponse();
          }
        }
      }
    } catch (error) {
      logger.error(`Critical error: ${error.message}`);
      throw error;
    }
  }

  // Extract video ID from YouTube URL
  extractVideoId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // METHOD 1: YouTube Transcript API
  async getYouTubeTranscriptAPI(videoId) {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptArray || transcriptArray.length === 0) {
      throw new Error('No transcript available');
    }

    const transcriptText = transcriptArray
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (transcriptText.length < 100) {
      throw new Error('Transcript too short');
    }

    return transcriptText;
  }

  // METHOD 2: Audio Transcription
  async getAudioTranscription(url) {
    // Step 1: Download audio
    const audioPath = await this.downloadAudio(url);
    
    // Step 2: Transcribe audio
    const transcript = await this.transcribeAudio(audioPath);
    
    // Step 3: Clean up
    await this.cleanupFile(audioPath);
    
    if (!transcript || transcript.length < 100) {
      throw new Error('Audio transcription failed');
    }
    
    return transcript;
  }

  // METHOD 3: Browser Automation
  async getBrowserTranscript(url) {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find transcript button
    const transcriptButton = await page.$('[aria-label*="transcript" i]');
    
    if (transcriptButton) {
      await transcriptButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract transcript text
      const transcriptText = await page.evaluate(() => {
        const selectors = [
          '.ytd-transcript-segment-renderer .segment-text',
          '.transcript-text',
          '.caption-line'
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            return Array.from(elements).map(el => el.textContent.trim()).join(' ');
          }
        }
        return null;
      });
      
      await browser.close();
      
      if (!transcriptText || transcriptText.length < 100) {
        throw new Error('No transcript content found');
      }
      
      return transcriptText;
    } else {
      await browser.close();
      throw new Error('Transcript button not found');
    }
  }

  // Helper: Download audio using yt-dlp
  async downloadAudio(url) {
    const scriptPath = path.join(__dirname, '../scripts/download_audio.py');

    logger.info(`🎵 Starting audio download for: ${url}`);

    return new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath, url], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false, // Don't use shell to avoid path issues
        cwd: path.dirname(scriptPath) // Set working directory
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        logger.info(`📥 Audio download completed with code: ${code}`);

        if (code === 0) {
          try {
            // Clean stdout to get only the JSON - find the line that contains JSON
            const lines = stdout.trim().split('\n');
            let jsonLine = '';

            // Look for JSON in any line
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('{') && trimmed.includes('success')) {
                jsonLine = trimmed;
                break;
              }
            }

            // If no JSON found in lines, try the whole stdout
            if (!jsonLine) {
              const trimmed = stdout.trim();
              if (trimmed.includes('{"success"')) {
                // Extract JSON from the string
                const jsonStart = trimmed.indexOf('{"success"');
                const jsonEnd = trimmed.lastIndexOf('}') + 1;
                jsonLine = trimmed.substring(jsonStart, jsonEnd);
              }
            }

            if (!jsonLine) {
              throw new Error('No JSON found in output');
            }

            const result = JSON.parse(jsonLine);
            if (result.success) {
              logger.info(`✅ Audio downloaded to: ${result.audio_path}`);
              resolve(result.audio_path);
            } else {
              logger.error(`❌ Audio download failed: ${result.error}`);
              reject(new Error(result.error));
            }
          } catch (parseError) {
            logger.error(`❌ Parse error in audio download: ${parseError.message}`);
            logger.error(`Raw stdout: ${stdout}`);
            reject(new Error(`Parse error: ${parseError.message}`));
          }
        } else {
          logger.error(`❌ Audio download failed with code ${code}`);
          reject(new Error(`Download failed: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        logger.error(`❌ Audio download process error: ${error.message}`);
        reject(new Error(`Download process error: ${error.message}`));
      });
    });
  }

  // Helper: Transcribe audio using Whisper
  async transcribeAudio(audioPath) {
    const scriptPath = path.join(__dirname, '../scripts/transcribe_audio.py');

    // Check if audio file exists first
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found: ${scriptPath}`);
    }

    logger.info(`🎤 Starting Whisper transcription...`);
    logger.info(`Audio file: ${audioPath}`);
    logger.info(`Script: ${scriptPath}`);

    return new Promise((resolve, reject) => {
      // Use tiny model for faster processing
      const args = [scriptPath, audioPath, 'false', 'tiny'];
      logger.info(`Executing: python ${args.join(' ')}`);

      const python = spawn('python', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false, // Don't use shell to avoid path issues
        cwd: path.dirname(scriptPath) // Set working directory
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      // Set timeout to prevent hanging (3 minutes for tiny model)
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          logger.warn('⏰ Whisper transcription timeout - killing process');
          python.kill('SIGKILL');
          reject(new Error('Whisper transcription timeout (3 minutes)'));
        }
      }, 180000); // 3 minutes

      python.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        logger.info(`📤 Whisper stdout: ${chunk.trim()}`);
      });

      python.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        logger.info(`📤 Whisper stderr: ${chunk.trim()}`);
      });

      python.on('spawn', () => {
        logger.info('🚀 Python process spawned successfully');
      });

      python.on('close', (code, signal) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeout);

        logger.info(`🏁 Python process closed with code: ${code}, signal: ${signal}`);
        logger.info(`📊 STDOUT length: ${stdout.length}, STDERR length: ${stderr.length}`);

        if (code === 0) {
          try {
            if (!stdout.trim()) {
              reject(new Error('Empty output from Whisper script'));
              return;
            }

            // Clean stdout to get only the JSON - find the line that starts with {
            const lines = stdout.trim().split('\n');
            let jsonLine = '';

            for (const line of lines) {
              if (line.trim().startsWith('{')) {
                jsonLine = line.trim();
                break;
              }
            }

            if (!jsonLine) {
              throw new Error('No JSON found in Whisper output');
            }

            const result = JSON.parse(jsonLine);
            if (result.success) {
              logger.info(`✅ Whisper transcription successful: ${result.length} characters`);
              resolve(result.transcript);
            } else {
              logger.warn(`❌ Whisper failed: ${result.error}`);
              reject(new Error(result.error));
            }
          } catch (parseError) {
            logger.error(`❌ Parse error: ${parseError.message}`);
            logger.error(`Raw stdout: ${stdout}`);
            reject(new Error(`Parse error: ${parseError.message}`));
          }
        } else {
          logger.error(`❌ Python script failed with code ${code}`);
          logger.error(`STDERR: ${stderr}`);
          reject(new Error(`Transcription failed with code ${code}: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeout);
        logger.error(`❌ Python process spawn error: ${error.message}`);
        reject(new Error(`Python process error: ${error.message}`));
      });
    });
  }

  // Helper: Clean up temporary files
  async cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn(`Cleanup failed: ${error.message}`);
    }
  }

  // Generate honest response when all methods fail
  generateHonestResponse() {
    return `TRANSCRIPT NOT AVAILABLE

We cannot get the transcript for this video.

WHAT TO DO:
🎬 Choose a video with captions enabled
📝 Look for videos that show "CC" (closed captions) button
🔍 Try educational channels that typically have transcripts

RECOMMENDATION:
Please try a different video that has captions enabled.`;
  }
}

module.exports = new TranscriptionService();
