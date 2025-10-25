// API Configuration - Backend Service Endpoints
export const API_ENDPOINTS = {
  BACKEND_BASE_URL: 'https://your-backend-app.herokuapp.com', // Replace with your deployed backend URL
  TRANSCRIBE: '/api/transcribe',
  TRANSLATE: '/api/translate',
  SYNTHESIZE: '/api/synthesize',
  HEALTH: '/health'
};

// Supported Middle Eastern Languages
export const SUPPORTED_LANGUAGES = {
  'ar': { 
    name: 'Arabic', 
    flag: '🇸🇦', 
    whisperCode: 'ar',
    elevenLabsVoice: 'pNInz6obpgDQGcFmaJgB', // Adam voice for Arabic
    displayName: 'العربية'
  },
  'fa': { 
    name: 'Persian', 
    flag: '🇮🇷', 
    whisperCode: 'fa',
    elevenLabsVoice: 'pNInz6obpgDQGcFmaJgB', // Adam voice for Persian
    displayName: 'فارسی'
  },
  'tr': { 
    name: 'Turkish', 
    flag: '🇹🇷', 
    whisperCode: 'tr',
    elevenLabsVoice: 'pNInz6obpgDQGcFmaJgB', // Adam voice for Turkish
    displayName: 'Türkçe'
  },
  'he': { 
    name: 'Hebrew', 
    flag: '🇮🇱', 
    whisperCode: 'he',
    elevenLabsVoice: 'pNInz6obpgDQGcFmaJgB', // Adam voice for Hebrew
    displayName: 'עברית'
  },
  'ku': { 
    name: 'Kurdish', 
    flag: '🏴', 
    whisperCode: 'ku',
    elevenLabsVoice: 'pNInz6obpgDQGcFmaJgB', // Adam voice for Kurdish
    displayName: 'کوردی'
  },
  'en': { 
    name: 'English', 
    flag: '🇬🇧', 
    whisperCode: 'en',
    elevenLabsVoice: 'pNInz6obpgDQGcFmaJgB', // Adam voice for English
    displayName: 'English'
  }
};

// Audio Configuration
export const AUDIO_CONFIG = {
  CHUNK_DURATION: 2500, // 2.5 seconds in milliseconds
  SAMPLE_RATE: 16000, // 16kHz for Whisper
  CHANNELS: 1, // Mono
  BIT_DEPTH: 16, // 16-bit
  FORMAT: 'wav'
};

// Widget Configuration
export const WIDGET_CONFIG = {
  DEFAULT_POSITION: { top: '20px', right: '20px' },
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
  Z_INDEX: 9999
};

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2
};

// Default Settings
export const DEFAULT_SETTINGS = {
  sourceLanguage: 'ar',
  targetLanguage: 'en',
  mockMode: true,
  volume: 0.8,
  bidirectionalMode: false,
  autoDetectLanguage: true,
  micDevice: 'default'
};

// Mock Responses for Testing
export const MOCK_RESPONSES = {
  transcription: {
    'ar': 'مرحبا، كيف حالك؟',
    'fa': 'سلام، چطور هستید؟',
    'tr': 'Merhaba, nasılsın?',
    'he': 'שלום, איך אתה?',
    'ku': 'سڵاو، چۆنیت؟'
  },
  translation: {
    'ar': 'Hello, how are you?',
    'fa': 'Hello, how are you?',
    'tr': 'Hello, how are you?',
    'he': 'Hello, how are you?',
    'ku': 'Hello, how are you?'
  }
};
