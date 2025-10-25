const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// API Configuration
const API_CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  OPENAI_BASE_URL: 'https://api.openai.com/v1',
  ELEVENLABS_BASE_URL: 'https://api.elevenlabs.io/v1'
};

// Validate API keys
if (!API_CONFIG.OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY is required');
  process.exit(1);
}

if (!API_CONFIG.ELEVENLABS_API_KEY) {
  logger.error('ELEVENLABS_API_KEY is required');
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Speech-to-Text endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  const requestId = uuidv4();
  logger.info(`Transcription request ${requestId} started`);

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        requestId
      });
    }

    const { language = 'auto' } = req.body;
    
    // Call OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: 'audio.wav',
      contentType: req.file.mimetype
    });
    formData.append('model', 'whisper-1');
    if (language !== 'auto') {
      formData.append('language', language);
    }

    const response = await axios.post(
      `${API_CONFIG.OPENAI_BASE_URL}/audio/transcriptions`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      }
    );

    logger.info(`Transcription request ${requestId} completed successfully`);
    
    res.json({
      text: response.data.text,
      language: response.data.language || language,
      confidence: 1.0,
      requestId
    });

  } catch (error) {
    logger.error(`Transcription request ${requestId} failed:`, error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key',
        requestId
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: error.response.headers['retry-after'] || 60,
        requestId
      });
    }

    res.status(500).json({
      error: 'Transcription failed',
      message: error.message,
      requestId
    });
  }
});

// Translation endpoint
app.post('/api/translate', async (req, res) => {
  const requestId = uuidv4();
  logger.info(`Translation request ${requestId} started`);

  try {
    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: 'Missing required fields: text, sourceLanguage, targetLanguage',
        requestId
      });
    }

    // Call OpenAI GPT-4o API
    const response = await axios.post(
      `${API_CONFIG.OPENAI_BASE_URL}/chat/completions`,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in Middle Eastern languages. Translate accurately while preserving tone, context, and cultural nuances.'
          },
          {
            role: 'user',
            content: `Translate the following ${sourceLanguage} text to ${targetLanguage}. Preserve the tone, formality level, and cultural context. Text: "${text}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const translatedText = response.data.choices[0]?.message?.content?.trim() || '';

    logger.info(`Translation request ${requestId} completed successfully`);
    
    res.json({
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.9,
      requestId
    });

  } catch (error) {
    logger.error(`Translation request ${requestId} failed:`, error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key',
        requestId
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: error.response.headers['retry-after'] || 60,
        requestId
      });
    }

    res.status(500).json({
      error: 'Translation failed',
      message: error.message,
      requestId
    });
  }
});

// Text-to-Speech endpoint
app.post('/api/synthesize', async (req, res) => {
  const requestId = uuidv4();
  logger.info(`TTS request ${requestId} started`);

  try {
    const { text, language = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required',
        requestId
      });
    }

    // Map language to voice ID
    const voiceMap = {
      'ar': 'pNInz6obpgDQGcFmaJgB', // Adam voice for Arabic
      'fa': 'pNInz6obpgDQGcFmaJgB', // Adam voice for Persian
      'tr': 'pNInz6obpgDQGcFmaJgB', // Adam voice for Turkish
      'he': 'pNInz6obpgDQGcFmaJgB', // Adam voice for Hebrew
      'ku': 'pNInz6obpgDQGcFmaJgB', // Adam voice for Kurdish
      'en': 'pNInz6obpgDQGcFmaJgB'  // Adam voice for English
    };

    const voiceId = voiceMap[language] || voiceMap['en'];

    // Call ElevenLabs API
    const response = await axios.post(
      `${API_CONFIG.ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    logger.info(`TTS request ${requestId} completed successfully`);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length,
      'X-Request-ID': requestId
    });
    
    res.send(response.data);

  } catch (error) {
    logger.error(`TTS request ${requestId} failed:`, error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key',
        requestId
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: error.response.headers['retry-after'] || 60,
        requestId
      });
    }

    res.status(500).json({
      error: 'TTS synthesis failed',
      message: error.message,
      requestId
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        maxSize: '25MB'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
