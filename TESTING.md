# Testing Guide - Mock Mode

This guide will help you test the Middle Eastern Translator extension in Mock Mode without needing any API keys or backend deployment.

## 🚀 Quick Start - Test in 5 Minutes

### **Step 1: Load Extension in Chrome**

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner

3. **Load Extension**
   - Click "Load unpacked"
   - Navigate to: `/Users/sarveshragavb/persian-to-english`
   - Select the folder
   - Click "Select Folder"

### **Step 2: Enable Mock Mode**

1. **Open Extension Popup**
   - Click the extension icon in Chrome toolbar
   - You should see the popup with settings

2. **Verify Mock Mode**
   - Mock Mode should be **enabled by default** ✅
   - You'll see a warning indicator showing "Mock Mode"
   - No API keys required!

### **Step 3: Test in Google Meet**

1. **Open Google Meet**
   - Go to [meet.google.com](https://meet.google.com)
   - Start a new meeting or join one
   - Allow microphone access when prompted

2. **Check for Widget**
   - A floating widget should appear in the top-right corner
   - Widget shows: "🌍 Middle Eastern Translator"
   - Language indicators: "🇸🇦 ⇄ 🇬🇧"

3. **Start Translation**
   - Click the microphone button (🎤) in the widget
   - Speak into your microphone (any language)
   - After 2-3 seconds, you'll see:
     - **Original Text**: Mock transcription (e.g., "مرحبا، كيف حالك؟")
     - **Translation**: Mock translation (e.g., "Hello, how are you?")

## ✅ What Should Work in Mock Mode

### **✅ Extension Popup**
- Settings form displays correctly
- Language selector works
- Volume slider works
- Mock mode toggle works
- Service status indicators

### **✅ Google Meet Widget**
- Widget appears automatically
- Can drag widget around screen
- Minimize/expand works
- Microphone toggle works
- Shows mock transcription and translation

### **✅ Audio Pipeline**
- Captures audio from microphone
- Processes audio chunks (2.5 seconds)
- Returns mock transcription
- Returns mock translation
- Plays mock audio (beep sound)

### **✅ Settings Persistence**
- Settings save to Chrome storage
- Persist across browser restarts
- Language preferences saved

## 🧪 Testing Checklist

### **Basic Functionality**
- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Mock mode is enabled by default
- [ ] Widget appears in Google Meet
- [ ] Widget is draggable
- [ ] Widget can be minimized/expanded

### **Audio Capture**
- [ ] Microphone permission requested
- [ ] Audio capture starts when mic button clicked
- [ ] Mock transcription appears after 2-3 seconds
- [ ] Mock translation appears
- [ ] Mock audio plays (beep sound)

### **Language Settings**
- [ ] Can select source language (Arabic, Persian, Turkish, Hebrew, Kurdish)
- [ ] Target language is English
- [ ] Bidirectional mode toggle works
- [ ] Auto-detect language toggle works

### **UI/UX**
- [ ] Widget displays correctly
- [ ] Language flags show correctly
- [ ] Status indicators work
- [ ] Error messages display (if any)
- [ ] Settings save successfully

## 🐛 Troubleshooting

### **Extension Not Loading**
- Check Chrome console for errors: `chrome://extensions/` → Details → Errors
- Verify all files are in the correct folders
- Make sure `manifest.json` is valid JSON

### **Widget Not Appearing**
- Make sure you're on `meet.google.com`
- Refresh the page after loading extension
- Check browser console (F12) for errors
- Verify content script is running

### **Microphone Not Working**
- Grant microphone permission when prompted
- Check Chrome settings: `chrome://settings/content/microphone`
- Ensure no other apps are using the microphone
- Try refreshing the Google Meet page

### **Mock Responses Not Appearing**
- Verify Mock Mode is enabled in popup
- Check background script console: `chrome://extensions/` → Details → Service worker → Console
- Wait 2-3 seconds after speaking (simulated API delay)

## 📊 Expected Mock Responses

### **Transcription (by language)**
- **Arabic (ar)**: "مرحبا، كيف حالك؟"
- **Persian (fa)**: "سلام، چطور هستید؟"
- **Turkish (tr)**: "Merhaba, nasılsın?"
- **Hebrew (he)**: "שלום, איך אתה?"
- **Kurdish (ku)**: "سڵاو، چۆنیت؟"

### **Translation**
- All languages translate to: "Hello, how are you?"

### **Audio**
- Mock audio plays a beep sound (simulated TTS)

## 🎯 Next Steps After Testing

Once Mock Mode testing is successful:

1. **Deploy Backend** to Heroku/Railway
2. **Update Backend URL** in `modules/constants.js`
3. **Disable Mock Mode** in popup settings
4. **Test with Real APIs** (requires API keys)

## 💡 Tips

- **Mock Mode** simulates real API delays (1-3 seconds)
- All UI features work exactly the same in Mock Mode
- Perfect for testing without API costs
- Great for demonstrations

Enjoy testing your Middle Eastern Translator extension! 🎉
