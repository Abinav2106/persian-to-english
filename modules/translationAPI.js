import { API_ENDPOINTS, SUPPORTED_LANGUAGES, MOCK_RESPONSES } from './constants.js';

class TranslationAPI {
    constructor() {
        this.baseUrl = `${API_ENDPOINTS.BACKEND_BASE_URL}${API_ENDPOINTS.TRANSLATE}`;
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
    }

    async translate(text, sourceLanguage, targetLanguage, mockMode = false) {
        try {
            if (mockMode) {
                return this.getMockTranslation(text, sourceLanguage, targetLanguage);
            }

            if (!text || text.trim().length === 0) {
                return { translatedText: '', confidence: 0 };
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    sourceLanguage,
                    targetLanguage
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Backend API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const result = await response.json();
            const translatedText = result.translatedText || '';

            // Add to conversation history
            this.addToHistory(text, translatedText, sourceLanguage, targetLanguage);

            return {
                translatedText,
                confidence: result.confidence || this.calculateConfidence(text, translatedText),
                sourceLanguage: result.sourceLanguage || sourceLanguage,
                targetLanguage: result.targetLanguage || targetLanguage
            };

        } catch (error) {
            console.error('Translation error:', error);
            throw new Error(`Translation failed: ${error.message}`);
        }
    }

    buildTranslationPrompt(text, sourceLanguage, targetLanguage) {
        const sourceLangName = SUPPORTED_LANGUAGES[sourceLanguage]?.name || sourceLanguage;
        const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]?.name || targetLanguage;
        
        return `Translate the following ${sourceLangName} text to ${targetLangName}. 
        
Preserve the tone, formality level, and cultural context. If the text contains:
- Formal language, maintain formality
- Informal/colloquial expressions, keep them natural in the target language
- Cultural references, provide appropriate equivalents
- Technical terms, use standard translations

Text to translate: "${text}"

Provide only the translation, no explanations.`;
    }

    getMockTranslation(text, sourceLanguage, targetLanguage) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockTranslation = MOCK_RESPONSES.translation[sourceLanguage] || 
                                      MOCK_RESPONSES.translation['ar'] || 
                                      'Hello, how are you?';
                
                resolve({
                    translatedText: mockTranslation,
                    confidence: 0.9,
                    sourceLanguage,
                    targetLanguage
                });
            }, 800 + Math.random() * 1200); // 0.8-2 second delay
        });
    }

    addToHistory(originalText, translatedText, sourceLanguage, targetLanguage) {
        this.conversationHistory.push({
            role: 'user',
            content: `Original (${sourceLanguage}): ${originalText}`
        });
        this.conversationHistory.push({
            role: 'assistant',
            content: `Translation (${targetLanguage}): ${translatedText}`
        });

        // Keep only recent history
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    calculateConfidence(originalText, translatedText) {
        // Simple confidence calculation based on text length and content
        const originalLength = originalText.length;
        const translatedLength = translatedText.length;
        
        // Basic confidence calculation
        let confidence = 0.8;
        
        // Adjust based on length similarity
        const lengthRatio = Math.min(originalLength, translatedLength) / Math.max(originalLength, translatedLength);
        confidence *= lengthRatio;
        
        // Adjust based on content (simple heuristics)
        if (translatedText.toLowerCase().includes('translation') || 
            translatedText.toLowerCase().includes('error')) {
            confidence *= 0.5;
        }
        
        return Math.min(1.0, Math.max(0.1, confidence));
    }

    // Clear conversation history
    clearHistory() {
        this.conversationHistory = [];
    }

    // Get conversation history
    getHistory() {
        return [...this.conversationHistory];
    }

    // Set max history length
    setMaxHistoryLength(length) {
        this.maxHistoryLength = Math.max(1, Math.min(50, length));
    }

    // Detect if text needs translation
    needsTranslation(text, targetLanguage) {
        if (!text || text.trim().length === 0) return false;
        
        // If target is English, check if text is already in English
        if (targetLanguage === 'en') {
            // Simple English detection
            const englishPattern = /^[a-zA-Z\s.,!?;:'"()-]+$/;
            return !englishPattern.test(text);
        }
        
        // For other target languages, always translate
        return true;
    }

    // Get supported language pairs
    getSupportedLanguagePairs() {
        const languages = Object.keys(SUPPORTED_LANGUAGES);
        const pairs = [];
        
        for (const source of languages) {
            for (const target of languages) {
                if (source !== target) {
                    pairs.push({
                        source,
                        target,
                        sourceName: SUPPORTED_LANGUAGES[source].name,
                        targetName: SUPPORTED_LANGUAGES[target].name,
                        sourceFlag: SUPPORTED_LANGUAGES[source].flag,
                        targetFlag: SUPPORTED_LANGUAGES[target].flag
                    });
                }
            }
        }
        
        return pairs;
    }

    // Test API connection
    async testConnection() {
        try {
            if (!this.apiKey) {
                throw new Error('API key not provided');
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 5
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Translation API test failed:', error);
            return false;
        }
    }
}

export { TranslationAPI };
