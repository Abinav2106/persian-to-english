# Middle Eastern Languages to English Translator

A Chrome Extension that provides real-time translation from Middle Eastern languages (Arabic, Persian, Turkish, Hebrew, Kurdish) to English in Google Meet.

## Features

- 🌍 **Multi-language Support**: Arabic, Persian/Farsi, Turkish, Hebrew, and Kurdish
- 🎤 **Real-time Speech Recognition**: Using OpenAI Whisper API
- 🤖 **AI Translation**: Powered by GPT-4o for accurate, context-aware translation
- 🔊 **Text-to-Speech**: ElevenLabs TTS for natural voice output
- 🎯 **Google Meet Integration**: Floating widget with live transcription and translation
- 🧪 **Mock Mode**: Test the extension without API costs
- ⚙️ **Customizable Settings**: Language selection, volume control, and device preferences

## Supported Languages

| Language      | Code | Flag | Display Name |
| ------------- | ---- | ---- | ------------ |
| Arabic        | `ar` | 🇸🇦   | العربية      |
| Persian/Farsi | `fa` | 🇮🇷   | فارسی        |
| Turkish       | `tr` | 🇹🇷   | Türkçe       |
| Hebrew        | `he` | 🇮🇱   | עברית        |
| Kurdish       | `ku` | 🏴   | کوردی        |
| English       | `en` | 🇬🇧   | English      |

## Prerequisites

### API Keys Required

1. **OpenAI API Key** (for Whisper STT and GPT-4o translation)

   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Create an API key in your account settings
   - Ensure you have credits available

2. **ElevenLabs API Key** (for Text-to-Speech)
   - Sign up at [ElevenLabs](https://elevenlabs.io/)
   - Get your API key from the profile section
   - Choose a voice that works well for your target language

### Browser Requirements

- Google Chrome (version 88+)
- Microphone access permissions
- Active internet connection

## Installation

### Development Installation

1. **Clone or download this repository**

   ```bash
   git clone <repository-url>
   cd persian-to-english
   ```

2. **Load the extension in Chrome**

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `persian-to-english` folder

3. **Configure API keys**
   - Click the extension icon in the toolbar
   - Enter your OpenAI and ElevenLabs API keys
   - Select your preferred source language
   - Enable "Mock Mode" for testing without API costs

### Production Installation

1. **Download from Chrome Web Store** (when available)
2. **Or install from .crx file**
   - Download the latest release
   - Drag and drop the .crx file into Chrome extensions page

## Usage

### Basic Setup

1. **Open Google Meet** in your browser
2. **Click the extension icon** to open settings
3. **Enter your API keys** (or enable Mock Mode for testing)
4. **Select your source language** (Arabic, Persian, Turkish, Hebrew, or Kurdish)
5. **Click "Save Settings"**

### Using the Translation Widget

1. **Join a Google Meet call**
2. **The floating widget will appear** in the top-right corner
3. **Click the microphone button** to start/stop translation
4. **Speak in your native language** - the widget will show:
   - Original text (what you said)
   - Translation (in English)
   - Language indicators

### Widget Controls

- **🎤 Microphone Toggle**: Start/stop audio capture
- **− Minimize**: Collapse/expand the widget
- **Drag**: Move the widget around the screen

### Settings Options

- **Source Language**: Choose your native language
- **Bidirectional Mode**: Auto-detect language direction
- **Mock Mode**: Test without API calls (uses sample responses)
- **Volume Control**: Adjust TTS output volume
- **Microphone Device**: Select specific audio input

## API Configuration

### OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Create a new API key
5. Copy the key (starts with `sk-`)
6. Paste it in the extension popup

**Costs**: Whisper API costs ~$0.006 per minute of audio

### ElevenLabs API Setup

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Go to your profile settings
4. Copy your API key
5. Paste it in the extension popup

**Costs**: TTS costs ~$0.18 per 1K characters

## Mock Mode

For testing without API costs:

1. **Enable Mock Mode** in the extension popup
2. **Start translation** - you'll see sample responses
3. **Test the UI and workflow** without spending API credits
4. **Disable Mock Mode** when ready for real translation

## Troubleshooting

### Common Issues

**"Microphone not working"**

- Check Chrome permissions for microphone access
- Ensure no other applications are using the microphone
- Try refreshing the Google Meet page

**"API connection failed"**

- Verify your API keys are correct
- Check your internet connection
- Ensure you have sufficient API credits

**"Translation not appearing"**

- Check that the extension is enabled
- Verify you're on a Google Meet page
- Try refreshing the page and restarting the extension

**"Audio not playing"**

- Check your system volume
- Verify Chrome has audio permissions
- Try adjusting the volume slider in settings

### Debug Mode

1. Open Chrome DevTools (F12)
2. Go to the "Console" tab
3. Look for error messages from the extension
4. Check the "Network" tab for failed API calls

## Development

### Project Structure

```
persian-to-english/
├── manifest.json              # Extension manifest
├── background.js              # Service worker
├── content.js                 # Content script for Meet
├── popup/
│   ├── popup.html            # Settings UI
│   ├── popup.css             # Styles
│   └── popup.js              # Popup logic
├── modules/
│   ├── constants.js          # Configuration
│   ├── storage.js            # Chrome storage wrapper
│   ├── audioCapture.js       # Web Audio API
│   ├── whisperAPI.js         # Speech recognition
│   ├── translationAPI.js    # Translation service
│   └── elevenLabsTTS.js      # Text-to-speech
└── assets/
    ├── icon16.png           # Extension icons
    ├── icon48.png
    └── icon128.png
```

### Building for Production

1. **Test thoroughly** in development mode
2. **Disable Mock Mode** and test with real APIs
3. **Create a .crx package**:
   ```bash
   # In Chrome extensions page
   # Click "Pack extension"
   # Select the extension folder
   # Generate .crx file
   ```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Privacy & Security

- **Audio Processing**: Audio is processed locally and sent to APIs for translation
- **Data Storage**: Settings are stored locally in Chrome
- **API Keys**: Stored securely in Chrome's encrypted storage
- **No Data Collection**: We don't collect or store your conversations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the GitHub issues page
3. Create a new issue with detailed information

## Changelog

### Version 1.0.0

- Initial release
- Support for 5 Middle Eastern languages
- Real-time translation in Google Meet
- Mock mode for testing
- Customizable settings and UI

## Roadmap

- Support for more languages
- Offline translation capabilities
- Custom voice selection
- Team collaboration features
- Mobile app version

---

**Made with ❤️ for breaking language barriers in the Middle East**
