# Middle Eastern Translator Backend Service

Backend API service for the Middle Eastern Languages to English Translator Chrome Extension.

## Features

- 🎤 **Speech-to-Text**: OpenAI Whisper API integration
- 🤖 **Translation**: GPT-4o powered translation
- 🔊 **Text-to-Speech**: ElevenLabs TTS integration
- 🛡️ **Rate Limiting**: Built-in request limiting
- 📊 **Logging**: Comprehensive request logging
- 🔒 **Security**: Helmet.js security headers
- 🚀 **Deployment Ready**: Heroku and Docker support

## API Endpoints

### Health Check

```
GET /health
```

### Speech-to-Text

```
POST /api/transcribe
Content-Type: multipart/form-data

Body:
- audio: Audio file (WAV, MP3, etc.)
- language: Language code (optional, defaults to 'auto')
```

### Translation

```
POST /api/translate
Content-Type: application/json

Body:
{
  "text": "Text to translate",
  "sourceLanguage": "ar",
  "targetLanguage": "en"
}
```

### Text-to-Speech

```
POST /api/synthesize
Content-Type: application/json

Body:
{
  "text": "Text to synthesize",
  "language": "en"
}
```

## Setup

### Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable             | Description                           | Required           |
| -------------------- | ------------------------------------- | ------------------ |
| `OPENAI_API_KEY`     | OpenAI API key for Whisper and GPT-4o | Yes                |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS            | Yes                |
| `PORT`               | Server port                           | No (default: 3000) |
| `NODE_ENV`           | Environment (development/production)  | No                 |
| `ALLOWED_ORIGINS`    | CORS allowed origins                  | No                 |

## Deployment

### Heroku

1. **Create Heroku app**

   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**

   ```bash
   heroku config:set OPENAI_API_KEY=your-key
   heroku config:set ELEVENLABS_API_KEY=your-key
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Docker

1. **Build image**

   ```bash
   docker build -t middle-eastern-translator .
   ```

2. **Run container**
   ```bash
   docker run -p 3000:3000 \
     -e OPENAI_API_KEY=your-key \
     -e ELEVENLABS_API_KEY=your-key \
     middle-eastern-translator
   ```

### Railway

1. **Connect repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Deploy automatically** on git push

## Rate Limiting

- **100 requests per 15 minutes** per IP
- **Configurable** via environment variables
- **429 status code** when limit exceeded

## Error Handling

- **Comprehensive logging** with Winston
- **Request ID tracking** for debugging
- **Graceful error responses**
- **API key validation**

## Monitoring

### Health Check

```bash
curl https://your-app.herokuapp.com/health
```

### Logs

```bash
# Heroku
heroku logs --tail

# Docker
docker logs container-name
```

## Cost Management

### API Usage Costs

- **Whisper**: ~$0.006 per minute of audio
- **GPT-4o**: ~$0.03 per 1K tokens
- **ElevenLabs**: ~$0.18 per 1K characters

### Optimization Strategies

- **Caching**: Implement Redis caching for repeated requests
- **Rate Limiting**: Prevent abuse and control costs
- **Monitoring**: Track usage and set alerts
- **Compression**: Reduce bandwidth usage

## Security

- **Helmet.js**: Security headers
- **CORS**: Configured for Chrome extensions
- **Rate Limiting**: DDoS protection
- **Input Validation**: Request validation
- **Error Handling**: No sensitive data exposure

## Development

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Debug Mode

```bash
DEBUG=* npm run dev
```

## Troubleshooting

### Common Issues

**"Invalid API key"**

- Check your OpenAI/ElevenLabs API keys
- Verify keys are active and have credits

**"Rate limit exceeded"**

- Wait for the rate limit window to reset
- Consider implementing user-based rate limiting

**"File too large"**

- Audio files are limited to 25MB
- Compress audio before sending

**"Transcription failed"**

- Check audio format (WAV, MP3 supported)
- Ensure audio is clear and not too long

## Support

For issues and questions:

1. Check the logs for error details
2. Verify API keys and credits
3. Test with smaller audio files
4. Check rate limiting status

## License

MIT License - see LICENSE file for details.
