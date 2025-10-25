import { API_ENDPOINTS, SUPPORTED_LANGUAGES } from './constants.js';

class ElevenLabsTTS {
    constructor() {
        this.baseUrl = `${API_ENDPOINTS.BACKEND_BASE_URL}${API_ENDPOINTS.SYNTHESIZE}`;
        this.audioContext = null;
        this.currentAudio = null;
    }

    async synthesize(text, language, mockMode = false) {
        try {
            if (mockMode) {
                return this.getMockAudio(text, language);
            }

            if (!text || text.trim().length === 0) {
                throw new Error('No text provided for synthesis');
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    language: language
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Backend API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const audioBuffer = await response.arrayBuffer();
            return audioBuffer;

        } catch (error) {
            console.error('TTS synthesis error:', error);
            throw new Error(`TTS synthesis failed: ${error.message}`);
        }
    }

    getMockAudio(text, language) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Create a simple beep sound as mock audio
                const duration = Math.min(text.length * 0.1, 3); // Max 3 seconds
                const sampleRate = 22050;
                const samples = Math.floor(sampleRate * duration);
                const buffer = new ArrayBuffer(44 + samples * 2);
                const view = new DataView(buffer);

                // WAV header
                const writeString = (offset, string) => {
                    for (let i = 0; i < string.length; i++) {
                        view.setUint8(offset + i, string.charCodeAt(i));
                    }
                };

                writeString(0, 'RIFF');
                view.setUint32(4, 36 + samples * 2, true);
                writeString(8, 'WAVE');
                writeString(12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                view.setUint16(22, 1, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * 2, true);
                view.setUint16(32, 2, true);
                view.setUint16(34, 16, true);
                writeString(36, 'data');
                view.setUint32(40, samples * 2, true);

                // Generate simple beep
                let offset = 44;
                for (let i = 0; i < samples; i++) {
                    const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
                    view.setInt16(offset, sample * 0x7FFF, true);
                    offset += 2;
                }

                resolve(buffer);
            }, 500 + Math.random() * 1000); // 0.5-1.5 second delay
        });
    }

    getVoiceIdForLanguage(language) {
        // Default voice IDs for different languages
        const voiceMap = {
            'ar': 'pNInz6obpgDQGcFmaJgB', // Adam - good for Arabic
            'fa': 'pNInz6obpgDQGcFmaJgB', // Adam - good for Persian
            'tr': 'pNInz6obpgDQGcFmaJgB', // Adam - good for Turkish
            'he': 'pNInz6obpgDQGcFmaJgB', // Adam - good for Hebrew
            'ku': 'pNInz6obpgDQGcFmaJgB', // Adam - good for Kurdish
            'en': 'pNInz6obpgDQGcFmaJgB'  // Adam - good for English
        };

        return voiceMap[language] || voiceMap['en'];
    }

    async playAudio(audioBuffer, volume = 1.0) {
        try {
            // Stop current audio if playing
            if (this.currentAudio) {
                this.currentAudio.stop();
            }

            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Decode audio buffer
            const audioBufferDecoded = await this.audioContext.decodeAudioData(audioBuffer);
            
            // Create audio source
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBufferDecoded;

            // Create gain node for volume control
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = Math.max(0, Math.min(1, volume));

            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Play audio
            source.start(0);
            this.currentAudio = source;

            return true;

        } catch (error) {
            console.error('Error playing audio:', error);
            throw new Error(`Audio playback failed: ${error.message}`);
        }
    }

    stopAudio() {
        try {
            if (this.currentAudio) {
                this.currentAudio.stop();
                this.currentAudio = null;
            }
        } catch (error) {
            console.error('Error stopping audio:', error);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    getVolume() {
        return this.volume || 1.0;
    }

    // Get available voices for a language
    async getVoicesForLanguage(language) {
        try {
            if (!this.apiKey) {
                throw new Error('API key not provided');
            }

            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.status}`);
            }

            const data = await response.json();
            return data.voices || [];

        } catch (error) {
            console.error('Error fetching voices:', error);
            return [];
        }
    }

    // Test API connection
    async testConnection() {
        try {
            if (!this.apiKey) {
                throw new Error('API key not provided');
            }

            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            return response.ok;
        } catch (error) {
            console.error('ElevenLabs API test failed:', error);
            return false;
        }
    }

    // Cleanup resources
    cleanup() {
        try {
            this.stopAudio();
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
        } catch (error) {
            console.error('Error cleaning up TTS:', error);
        }
    }

    // Get supported languages
    getSupportedLanguages() {
        return Object.keys(SUPPORTED_LANGUAGES).map(code => ({
            code,
            name: SUPPORTED_LANGUAGES[code].name,
            flag: SUPPORTED_LANGUAGES[code].flag
        }));
    }

    // Check if language is supported
    isLanguageSupported(language) {
        return language in SUPPORTED_LANGUAGES;
    }
}

export { ElevenLabsTTS };
