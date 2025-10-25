import { AUDIO_CONFIG } from './constants.js';

class AudioCapture {
    constructor() {
        this.mediaStream = null;
        this.audioContext = null;
        this.audioWorkletNode = null;
        this.audioBuffer = [];
        this.isCapturing = false;
        this.chunkCallbacks = [];
        this.volume = 1.0;
        this.deviceId = 'default';
    }

    async initialize(deviceId = 'default', volume = 1.0) {
        try {
            this.deviceId = deviceId;
            this.volume = volume;

            // Request microphone access
            const constraints = {
                audio: {
                    deviceId: deviceId === 'default' ? undefined : { exact: deviceId },
                    sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
                    channelCount: AUDIO_CONFIG.CHANNELS,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: AUDIO_CONFIG.SAMPLE_RATE
            });

            // Create audio source
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Create gain node for volume control
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.volume;
            
            // Create script processor for audio processing
            const bufferSize = 4096;
            this.audioWorkletNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
            
            this.audioWorkletNode.onaudioprocess = (event) => {
                this.processAudioData(event.inputBuffer);
            };

            // Connect audio nodes
            source.connect(gainNode);
            gainNode.connect(this.audioWorkletNode);
            this.audioWorkletNode.connect(this.audioContext.destination);

            return true;
        } catch (error) {
            console.error('Error initializing audio capture:', error);
            throw new Error(`Failed to initialize audio capture: ${error.message}`);
        }
    }

    processAudioData(audioBuffer) {
        if (!this.isCapturing) return;

        // Convert audio buffer to array
        const audioData = audioBuffer.getChannelData(0);
        
        // Add to buffer
        this.audioBuffer.push(...audioData);

        // Check if we have enough data for a chunk
        const chunkSize = AUDIO_CONFIG.SAMPLE_RATE * (AUDIO_CONFIG.CHUNK_DURATION / 1000);
        
        if (this.audioBuffer.length >= chunkSize) {
            // Extract chunk
            const chunk = this.audioBuffer.slice(0, chunkSize);
            this.audioBuffer = this.audioBuffer.slice(chunkSize);

            // Convert to WAV format
            const wavBlob = this.convertToWAV(chunk);
            
            // Notify callbacks
            this.chunkCallbacks.forEach(callback => {
                try {
                    callback(wavBlob);
                } catch (error) {
                    console.error('Error in audio chunk callback:', error);
                }
            });
        }
    }

    convertToWAV(audioData) {
        const length = audioData.length;
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, AUDIO_CONFIG.CHANNELS, true);
        view.setUint32(24, AUDIO_CONFIG.SAMPLE_RATE, true);
        view.setUint32(28, AUDIO_CONFIG.SAMPLE_RATE * AUDIO_CONFIG.CHANNELS * 2, true);
        view.setUint16(32, AUDIO_CONFIG.CHANNELS * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // Convert float32 to int16
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    startCapture() {
        if (!this.audioContext) {
            throw new Error('Audio capture not initialized');
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isCapturing = true;
        this.audioBuffer = [];
    }

    stopCapture() {
        this.isCapturing = false;
    }

    onAudioChunk(callback) {
        this.chunkCallbacks.push(callback);
    }

    removeAudioChunkCallback(callback) {
        const index = this.chunkCallbacks.indexOf(callback);
        if (index > -1) {
            this.chunkCallbacks.splice(index, 1);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audioContext) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.volume;
        }
    }

    async switchDevice(deviceId) {
        try {
            await this.cleanup();
            await this.initialize(deviceId, this.volume);
            return true;
        } catch (error) {
            console.error('Error switching audio device:', error);
            return false;
        }
    }

    async cleanup() {
        try {
            this.isCapturing = false;
            
            if (this.audioWorkletNode) {
                this.audioWorkletNode.disconnect();
                this.audioWorkletNode = null;
            }

            if (this.audioContext) {
                await this.audioContext.close();
                this.audioContext = null;
            }

            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }

            this.audioBuffer = [];
            this.chunkCallbacks = [];
        } catch (error) {
            console.error('Error cleaning up audio capture:', error);
        }
    }

    getStatus() {
        return {
            isCapturing: this.isCapturing,
            isInitialized: !!this.audioContext,
            deviceId: this.deviceId,
            volume: this.volume,
            bufferLength: this.audioBuffer.length
        };
    }

    // Static method to get available audio devices
    static async getAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
            console.error('Error getting audio devices:', error);
            return [];
        }
    }
}

export { AudioCapture };
