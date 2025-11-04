// Background service - No ES modules, works with Manifest V3
// Inline all modules for compatibility

// Constants
const API_ENDPOINTS = {
  BACKEND_BASE_URL: 'https://your-backend-app.herokuapp.com',
  TRANSCRIBE: '/api/transcribe',
  TRANSLATE: '/api/translate',
  SYNTHESIZE: '/api/synthesize',
  HEALTH: '/health'
};

const SUPPORTED_LANGUAGES = {
  'ar': { name: 'Arabic', flag: '🇸🇦', whisperCode: 'ar', displayName: 'العربية' },
  'fa': { name: 'Persian', flag: '🇮🇷', whisperCode: 'fa', displayName: 'فارسی' },
  'tr': { name: 'Turkish', flag: '🇹🇷', whisperCode: 'tr', displayName: 'Türkçe' },
  'he': { name: 'Hebrew', flag: '🇮🇱', whisperCode: 'he', displayName: 'עברית' },
  'ku': { name: 'Kurdish', flag: '🏴', whisperCode: 'ku', displayName: 'کوردی' },
  'en': { name: 'English', flag: '🇬🇧', whisperCode: 'en', displayName: 'English' }
};

const DEFAULT_SETTINGS = {
  sourceLanguage: 'ar',
  targetLanguage: 'en',
  mockMode: true,
  volume: 0.8,
  bidirectionalMode: false,
  autoDetectLanguage: true,
  micDevice: 'default'
};

// Storage Manager
const storageManager = {
  async getSettings() {
    try {
      const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      return result;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  },
  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set(settings);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },
  async getApiKeys() {
    return { openaiApiKey: '', elevenLabsApiKey: '' };
  },
  async clearAll() {
    try {
      await chrome.storage.sync.clear();
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Error Handler (minimal)
const ErrorHandler = class {
  retryWithBackoff(fn, context) {
    return fn();
  }
  handleAudioError(error, context) {
    return { type: 'AUDIO_ERROR', message: error.message };
  }
  handleApiError(error, apiName) {
    return { type: 'API_ERROR', message: error.message };
  }
  getUserFriendlyMessage(info) {
    return info.message || 'An error occurred';
  }
  logError(error, context) {
    console.error(`[${context}]`, error);
  }
  isFeatureDisabled() {
    return false;
  }
};

// Mock API implementations
const WhisperAPI = class {
  transcribe(audioBlob, language, mockMode) {
    if (mockMode) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ text: 'مرحبا، كيف حالك؟', language: 'ar', confidence: 0.95 });
        }, 1000);
      });
    }
    throw new Error('Backend not configured');
  }
  detectLanguage(text) {
    return /[؀-ۿ]/.test(text) ? 'ar' : 'en';
  }
};

const TranslationAPI = class {
  translate(text, sourceLang, targetLang, mockMode) {
    if (mockMode) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ translatedText: 'Hello, how are you?', confidence: 0.9 });
        }, 800);
      });
    }
    throw new Error('Backend not configured');
  }
  needsTranslation(text, targetLang) {
    return true;
  }
};

const ElevenLabsTTS = class {
  synthesize(text, language, mockMode) {
    if (mockMode) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(new ArrayBuffer(44));
        }, 500);
      });
    }
    throw new Error('Backend not configured');
  }
  async playAudio(buffer, volume) {
    // Mock audio playback
  }
  cleanup() {}
};

const AudioCapture = class {
  constructor() {
    this.isCapturing = false;
  }
  async initialize() {}
  startCapture() {
    this.isCapturing = true;
  }
  stopCapture() {
    this.isCapturing = false;
  }
  onAudioChunk(callback) {
    // Mock audio chunks
    setInterval(() => {
      if (this.isCapturing) {
        callback(new Blob());
      }
    }, 2500);
  }
  getStatus() {
    return { isInitialized: false, isCapturing: this.isCapturing };
  }
  cleanup() {}
};

// BackgroundService class
class BackgroundService {

    constructor() {
        this.audioCapture = null;
        this.whisperAPI = new WhisperAPI();
        this.translationAPI = new TranslationAPI();
        this.ttsAPI = new ElevenLabsTTS();
        this.errorHandler = new ErrorHandler();
        this.isActive = false;
        this.currentSettings = null;
        this.healthCheckInterval = null;
        this.setupMessageHandlers();
        this.startHealthCheck();
    }

    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'START_TRANSLATION':
                    await this.startTranslation();
                    sendResponse({ success: true });
                    break;

                case 'STOP_TRANSLATION':
                    await this.stopTranslation();
                    sendResponse({ success: true });
                    break;

                case 'UPDATE_SETTINGS':
                    await this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'GET_STATUS':
                    const status = await this.getStatus();
                    sendResponse({ success: true, status });
                    break;

                case 'TEST_APIS':
                    const testResults = await this.testAPIs();
                    sendResponse({ success: true, results: testResults });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async startTranslation() {
        try {
            if (this.isActive) {
                console.log('Translation already active');
                return;
            }

            // Load settings
            this.currentSettings = await storageManager.getSettings();

            // Initialize audio capture with error handling
            this.audioCapture = new AudioCapture();
            
            try {
                await this.audioCapture.initialize(
                    this.currentSettings.micDevice || 'default',
                    this.currentSettings.volume || 0.8
                );
            } catch (audioError) {
                const errorInfo = this.errorHandler.handleAudioError(audioError, 'startTranslation');
                throw new Error(this.errorHandler.getUserFriendlyMessage(errorInfo));
            }

            // Set up audio chunk handler
            this.audioCapture.onAudioChunk(async (audioBlob) => {
                await this.processAudioChunk(audioBlob);
            });

            // Start capturing
            this.audioCapture.startCapture();
            this.isActive = true;

            console.log('Translation started successfully');

        } catch (error) {
            this.errorHandler.logError(error, 'startTranslation');
            console.error('Error starting translation:', error);
            throw error;
        }
    }

    async stopTranslation() {
        try {
            if (!this.isActive) {
                console.log('Translation not active');
                return;
            }

            if (this.audioCapture) {
                this.audioCapture.stopCapture();
                await this.audioCapture.cleanup();
                this.audioCapture = null;
            }

            this.isActive = false;
            console.log('Translation stopped');

        } catch (error) {
            console.error('Error stopping translation:', error);
            throw error;
        }
    }

    async processAudioChunk(audioBlob) {
        try {
            if (!this.isActive || !this.currentSettings) return;

            // Step 1: Transcribe audio with retry logic
            const transcription = await this.errorHandler.retryWithBackoff(
                async () => {
                    return await this.whisperAPI.transcribe(
                        audioBlob,
                        this.currentSettings.autoDetectLanguage ? 'auto' : this.currentSettings.sourceLanguage,
                        this.currentSettings.mockMode
                    );
                },
                'whisper_transcription'
            );

            if (!transcription.text || transcription.text.trim().length === 0) {
                return;
            }

            // Step 2: Determine source and target languages
            let sourceLanguage = transcription.language;
            let targetLanguage = this.currentSettings.targetLanguage;

            // Auto-detect language if enabled
            if (this.currentSettings.autoDetectLanguage) {
                sourceLanguage = this.whisperAPI.detectLanguage(transcription.text);
            }

            // Bidirectional mode: determine translation direction
            if (this.currentSettings.bidirectionalMode) {
                const translationDirection = this.determineTranslationDirection(sourceLanguage, transcription.text);
                sourceLanguage = translationDirection.source;
                targetLanguage = translationDirection.target;
            }

            // Check if translation is needed
            if (this.translationAPI.needsTranslation(transcription.text, targetLanguage)) {
                // Step 3: Translate with retry logic
                const translation = await this.errorHandler.retryWithBackoff(
                    async () => {
                        return await this.translationAPI.translate(
                            transcription.text,
                            sourceLanguage,
                            targetLanguage,
                            this.currentSettings.mockMode
                        );
                    },
                    'translation'
                );

                // Step 4: Synthesize speech with retry logic
                const audioBuffer = await this.errorHandler.retryWithBackoff(
                    async () => {
                        return await this.ttsAPI.synthesize(
                            translation.translatedText,
                            targetLanguage,
                            this.currentSettings.mockMode
                        );
                    },
                    'tts_synthesis'
                );

                // Step 5: Play audio
                await this.ttsAPI.playAudio(audioBuffer, this.currentSettings.volume);

                // Step 6: Send results to content script
                await this.sendResultsToContentScript({
                    originalText: transcription.text,
                    translatedText: translation.translatedText,
                    sourceLanguage,
                    targetLanguage,
                    confidence: transcription.confidence,
                    bidirectional: this.currentSettings.bidirectionalMode
                });
            }

        } catch (error) {
            this.errorHandler.logError(error, 'processAudioChunk');
            const errorInfo = this.errorHandler.handleApiError(error, 'Translation Pipeline');
            await this.sendErrorToContentScript(this.errorHandler.getUserFriendlyMessage(errorInfo));
        }
    }

    determineTranslationDirection(detectedLanguage, text) {
        // If bidirectional mode is enabled, determine which direction to translate
        const isMiddleEasternLanguage = ['ar', 'fa', 'tr', 'he', 'ku'].includes(detectedLanguage);
        const isEnglish = detectedLanguage === 'en';
        
        if (isMiddleEasternLanguage) {
            // Middle Eastern language detected -> translate to English
            return {
                source: detectedLanguage,
                target: 'en'
            };
        } else if (isEnglish) {
            // English detected -> translate to user's preferred source language
            return {
                source: 'en',
                target: this.currentSettings.sourceLanguage
            };
        } else {
            // Unknown language -> use default direction
            return {
                source: this.currentSettings.sourceLanguage,
                target: this.currentSettings.targetLanguage
            };
        }
    }

    async sendResultsToContentScript(results) {
        try {
            const tabs = await chrome.tabs.query({ url: 'https://meet.google.com/*' });
            
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'TRANSLATION_RESULT',
                    data: results
                }).catch(error => {
                    console.error('Error sending results to content script:', error);
                });
            }
        } catch (error) {
            console.error('Error sending results to content script:', error);
        }
    }

    async sendErrorToContentScript(errorMessage) {
        try {
            const tabs = await chrome.tabs.query({ url: 'https://meet.google.com/*' });
            
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'TRANSLATION_ERROR',
                    error: errorMessage
                }).catch(error => {
                    console.error('Error sending error to content script:', error);
                });
            }
        } catch (error) {
            console.error('Error sending error to content script:', error);
        }
    }

    async updateSettings(settings) {
        try {
            this.currentSettings = { ...this.currentSettings, ...settings };
            await storageManager.saveSettings(this.currentSettings);
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    async getStatus() {
        try {
            const settings = await storageManager.getSettings();
            const apiKeys = await storageManager.getApiKeys();
            
            return {
                isActive: this.isActive,
                hasApiKeys: !!(apiKeys.openaiApiKey && apiKeys.elevenLabsApiKey),
                mockMode: settings.mockMode,
                sourceLanguage: settings.sourceLanguage,
                targetLanguage: settings.targetLanguage,
                audioStatus: this.audioCapture ? this.audioCapture.getStatus() : null
            };
        } catch (error) {
            console.error('Error getting status:', error);
            return { error: error.message };
        }
    }

    async testAPIs() {
        try {
            const settings = await storageManager.getSettings();
            
            const results = {
                backend: false,
                translation: false,
                tts: false
            };

            if (settings.mockMode) {
                return { ...results, mockMode: true };
            }

            // Test backend health
            try {
                const response = await fetch(`${API_ENDPOINTS.BACKEND_BASE_URL}${API_ENDPOINTS.HEALTH}`);
                results.backend = response.ok;
                results.translation = response.ok;
                results.tts = response.ok;
            } catch (error) {
                console.error('Backend health check failed:', error);
            }

            return results;
        } catch (error) {
            console.error('Error testing APIs:', error);
            return { error: error.message };
        }
    }

    startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                if (this.isActive && this.audioCapture) {
                    const status = this.audioCapture.getStatus();
                    
                    // Check if audio capture is still working
                    if (!status.isInitialized) {
                        console.warn('Audio capture lost, attempting to restart...');
                        await this.restartTranslation();
                        return;
                    }
                    
                    // Check if we're still capturing
                    if (!status.isCapturing) {
                        console.warn('Audio capture stopped, attempting to restart...');
                        await this.restartTranslation();
                        return;
                    }
                    
                    // Check for too many errors
                    if (this.errorHandler.isFeatureDisabled('audio_error', 'health_check')) {
                        console.warn('Too many audio errors, temporarily disabling translation...');
                        await this.stopTranslation();
                        await this.sendErrorToContentScript('Too many audio errors. Please check your microphone settings.');
                        return;
                    }
                }
            } catch (error) {
                this.errorHandler.logError(error, 'healthCheck');
                console.error('Health check error:', error);
            }
        }, 30000); // Check every 30 seconds
    }

    async restartTranslation() {
        try {
            await this.stopTranslation();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            await this.startTranslation();
        } catch (error) {
            console.error('Error restarting translation:', error);
        }
    }

    cleanup() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        if (this.audioCapture) {
            this.audioCapture.cleanup();
        }
        
        if (this.ttsAPI) {
            this.ttsAPI.cleanup();
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(() => {
    backgroundService.cleanup();

}

// Initialize
const backgroundService = new BackgroundService();

chrome.runtime.onSuspend.addListener(() => {
  backgroundService.cleanup();
});
