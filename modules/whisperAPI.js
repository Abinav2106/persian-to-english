import { API_ENDPOINTS, SUPPORTED_LANGUAGES, MOCK_RESPONSES } from './constants.js';

class WhisperAPI {
    constructor() {
        this.baseUrl = `${API_ENDPOINTS.BACKEND_BASE_URL}${API_ENDPOINTS.TRANSCRIBE}`;
    }

    async transcribe(audioBlob, language = 'auto', mockMode = false) {
        try {
            if (mockMode) {
                return this.getMockTranscription(language);
            }

            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');
            formData.append('language', language);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Backend API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const result = await response.json();
            return {
                text: result.text,
                language: result.language || language,
                confidence: result.confidence || 1.0
            };

        } catch (error) {
            console.error('Transcription error:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    getMockTranscription(language) {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockText = MOCK_RESPONSES.transcription[language] || 
                                MOCK_RESPONSES.transcription['ar'] || 
                                'مرحبا، كيف حالك؟';
                
                resolve({
                    text: mockText,
                    language: language,
                    confidence: 0.95
                });
            }, 1000 + Math.random() * 2000); // 1-3 second delay
        });
    }

    // Detect language from text (simple heuristic)
    detectLanguage(text) {
        if (!text || typeof text !== 'string') return 'en';

        const textLower = text.toLowerCase();
        
        // Arabic/Persian/Hebrew detection (RTL scripts)
        if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) {
            // Persian specific characters
            if (/[\u06A9\u06AF\u0686\u0698\u06CC\u06A0\u06BE\u06C1\u06D2\u06D4\u06D5\u06D6\u06D7\u06D8\u06D9\u06DA\u06DB\u06DC\u06DD\u06DE\u06DF\u06E0\u06E1\u06E2\u06E3\u06E4\u06E5\u06E6\u06E7\u06E8\u06E9\u06EA\u06EB\u06EC\u06ED\u06EE\u06EF\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9]/.test(text)) {
                return 'fa'; // Persian
            }
            // Hebrew specific characters
            else if (/[\u0590-\u05FF\u200F\u200E]/.test(text)) {
                return 'he'; // Hebrew
            }
            // Kurdish specific characters
            else if (/[\u06B5\u06B6\u06B7\u06B8\u06B9\u06BA\u06BB\u06BC\u06BD\u06BE\u06BF\u06C0\u06C1\u06C2\u06C3\u06C4\u06C5\u06C6\u06C7\u06C8\u06C9\u06CA\u06CB\u06CC\u06CD\u06CE\u06CF\u06D0\u06D1\u06D2\u06D3\u06D4\u06D5\u06D6\u06D7\u06D8\u06D9\u06DA\u06DB\u06DC\u06DD\u06DE\u06DF\u06E0\u06E1\u06E2\u06E3\u06E4\u06E5\u06E6\u06E7\u06E8\u06E9\u06EA\u06EB\u06EC\u06ED\u06EE\u06EF]/.test(text)) {
                return 'ku'; // Kurdish
            }
            else {
                return 'ar'; // Arabic (default for RTL)
            }
        }
        
        // Turkish specific characters
        if (/[çğıöşüÇĞIİÖŞÜ]/.test(text)) {
            return 'tr';
        }
        
        // Default to English
        return 'en';
    }

    // Get supported languages for Whisper
    getSupportedLanguages() {
        return Object.keys(SUPPORTED_LANGUAGES).map(code => ({
            code,
            name: SUPPORTED_LANGUAGES[code].name,
            flag: SUPPORTED_LANGUAGES[code].flag
        }));
    }

    // Validate API key format
    validateApiKey(apiKey) {
        return apiKey && typeof apiKey === 'string' && apiKey.startsWith('sk-') && apiKey.length > 20;
    }

    // Test API connection
    async testConnection() {
        try {
            if (!this.apiKey) {
                throw new Error('API key not provided');
            }

            // Test with a small audio file or just check if the key is valid
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Whisper API test failed:', error);
            return false;
        }
    }
}

export { WhisperAPI };
