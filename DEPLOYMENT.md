# Deployment Guide

This guide covers deploying the Middle Eastern Translator as a service-based Chrome Extension.

## 🏗️ Architecture Overview

```
User Extension → Backend Service → OpenAI/ElevenLabs APIs
```

- **Chrome Extension**: No API keys required, calls your backend
- **Backend Service**: Handles all API calls and rate limiting
- **APIs**: OpenAI (Whisper + GPT-4o) and ElevenLabs (TTS)

## 🚀 Phase 1: Backend Deployment

### Option 1: Heroku (Recommended)

1. **Install Heroku CLI**

   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku

   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**

   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **Set Environment Variables**

   ```bash
   heroku config:set OPENAI_API_KEY=sk-your-openai-key
   heroku config:set ELEVENLABS_API_KEY=your-elevenlabs-key
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**

   ```bash
   git add .
   git commit -m "Initial backend deployment"
   git push heroku main
   ```

5. **Test Deployment**
   ```bash
   heroku open
   # Should show: {"status":"healthy","timestamp":"...","version":"1.0.0"}
   ```

### Option 2: Railway

1. **Connect Repository**

   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` folder

2. **Set Environment Variables**

   - In Railway dashboard, add:
     - `OPENAI_API_KEY`
     - `ELEVENLABS_API_KEY`
     - `NODE_ENV=production`

3. **Deploy**
   - Railway automatically deploys on git push
   - Get your app URL from the dashboard

### Option 3: Docker (Any Cloud Provider)

1. **Build Docker Image**

   ```bash
   cd backend
   docker build -t middle-eastern-translator .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e OPENAI_API_KEY=your-key \
     -e ELEVENLABS_API_KEY=your-key \
     middle-eastern-translator
   ```

## 🔧 Phase 2: Update Extension

### 1. Update Backend URL

Edit `modules/constants.js`:

```javascript
export const API_ENDPOINTS = {
  BACKEND_BASE_URL: "https://your-app-name.herokuapp.com", // Your deployed URL
  TRANSCRIBE: "/api/transcribe",
  TRANSLATE: "/api/translate",
  SYNTHESIZE: "/api/synthesize",
  HEALTH: "/health",
};
```

### 2. Test Extension

1. **Load Extension in Chrome**

   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

2. **Test Backend Connection**

   - Click extension icon
   - Click "Test Connection"
   - Should show "Backend service is online"

3. **Test Mock Mode**
   - Enable "Mock Mode" in settings
   - Go to Google Meet
   - Test the translation widget

## 📊 Phase 3: Production Setup

### 1. Monitoring & Analytics

Add to your backend:

```javascript
// Add to server.js
const analytics = require("@google-cloud/analytics");

// Track usage
app.use((req, res, next) => {
  // Log request
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});
```

### 2. Rate Limiting & Cost Control

```javascript
// Enhanced rate limiting
const rateLimit = require("express-rate-limit");

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: "Too many requests, please try again later",
});

app.use("/api/", strictLimiter);
```

### 3. Usage Tracking

```javascript
// Track API usage
const usageTracker = {
  trackRequest: (endpoint, cost) => {
    // Log to database or analytics service
    console.log(`API Usage: ${endpoint} - Cost: $${cost}`);
  },
};
```

## 💰 Cost Management

### API Costs (Per User)

- **Whisper**: ~$0.006 per minute
- **GPT-4o**: ~$0.03 per 1K tokens
- **ElevenLabs**: ~$0.18 per 1K characters

### Cost Control Strategies

1. **Rate Limiting**

   ```javascript
   // Limit requests per user
   const userLimiter = rateLimit({
     windowMs: 60 * 60 * 1000, // 1 hour
     max: 100, // 100 requests per hour
     keyGenerator: (req) => req.ip,
   });
   ```

2. **Usage Monitoring**

   ```javascript
   // Track and alert on high usage
   const usageAlert = {
     dailyLimit: 1000,
     checkUsage: () => {
       // Check daily usage
       // Send alert if over limit
     },
   };
   ```

3. **Caching**

   ```javascript
   // Cache common translations
   const redis = require("redis");
   const client = redis.createClient();

   // Cache translation results
   const cacheKey = `translation:${text}:${source}:${target}`;
   ```

## 🔒 Security Considerations

### 1. API Key Security

- Store keys in environment variables
- Never commit keys to git
- Rotate keys regularly

### 2. Rate Limiting

- Implement per-IP rate limiting
- Add user-based rate limiting
- Monitor for abuse

### 3. Input Validation

```javascript
const { body, validationResult } = require("express-validator");

app.post(
  "/api/translate",
  [
    body("text").isLength({ min: 1, max: 1000 }),
    body("sourceLanguage").isIn(["ar", "fa", "tr", "he", "ku", "en"]),
    body("targetLanguage").isIn(["ar", "fa", "tr", "he", "ku", "en"]),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

## 📈 Scaling Considerations

### 1. Database Integration

```javascript
// Add PostgreSQL for user management
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### 2. Redis Caching

```javascript
// Add Redis for caching
const redis = require("redis");
const client = redis.createClient(process.env.REDIS_URL);
```

### 3. Load Balancing

- Use multiple backend instances
- Implement health checks
- Add auto-scaling

## 🧪 Testing

### 1. Backend Testing

```bash
cd backend
npm test
```

### 2. Extension Testing

```bash
# Test in Chrome
# Load unpacked extension
# Test all features
```

### 3. End-to-End Testing

```bash
# Test full pipeline
# Audio → Transcription → Translation → TTS
```

## 🚀 Chrome Web Store Submission

### 1. Prepare Extension

- Test thoroughly
- Create screenshots
- Write store description
- Set up billing (if applicable)

### 2. Store Assets

- Extension icons (16px, 48px, 128px)
- Screenshots (1280x800)
- Promotional images
- Privacy policy

### 3. Submission Process

1. Create Chrome Web Store developer account
2. Upload extension package
3. Fill out store listing
4. Submit for review
5. Wait for approval

## 📞 Support & Maintenance

### 1. Monitoring

- Set up alerts for errors
- Monitor API usage and costs
- Track user feedback

### 2. Updates

- Regular security updates
- Feature improvements
- Performance optimizations

### 3. User Support

- Create documentation
- Set up support channels
- Handle user feedback

## 🎯 Next Steps

1. **Deploy Backend** to Heroku/Railway
2. **Update Extension** with backend URL
3. **Test End-to-End** functionality
4. **Add Monitoring** and analytics
5. **Submit to Chrome Web Store**

Your service-based Middle Eastern Translator is now ready for production! 🎉
