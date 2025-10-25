import { RETRY_CONFIG } from './constants.js';

class ErrorHandler {
    constructor() {
        this.errorCounts = new Map();
        this.maxRetries = RETRY_CONFIG.MAX_RETRIES;
        this.initialDelay = RETRY_CONFIG.INITIAL_DELAY;
        this.maxDelay = RETRY_CONFIG.MAX_DELAY;
        this.backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER;
    }

    // Retry function with exponential backoff
    async retryWithBackoff(fn, context = 'unknown', maxRetries = this.maxRetries) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    console.error(`Max retries exceeded for ${context}:`, error);
                    throw error;
                }
                
                const delay = this.calculateDelay(attempt);
                console.warn(`Retry ${attempt + 1}/${maxRetries + 1} for ${context} in ${delay}ms:`, error.message);
                
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    calculateDelay(attempt) {
        const delay = this.initialDelay * Math.pow(this.backoffMultiplier, attempt);
        return Math.min(delay, this.maxDelay);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Track error frequency
    trackError(errorType, context) {
        const key = `${errorType}-${context}`;
        const count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);
        
        // If too many errors, disable the feature temporarily
        if (count > 5) {
            console.warn(`Too many errors for ${key}, temporarily disabling`);
            return false;
        }
        
        return true;
    }

    // Reset error count
    resetErrorCount(errorType, context) {
        const key = `${errorType}-${context}`;
        this.errorCounts.delete(key);
    }

    // Check if feature should be disabled
    isFeatureDisabled(errorType, context) {
        const key = `${errorType}-${context}`;
        const count = this.errorCounts.get(key) || 0;
        return count > 5;
    }

    // Handle specific error types
    handleApiError(error, apiName) {
        console.error(`${apiName} API error:`, error);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return {
                type: 'AUTH_ERROR',
                message: 'API key is invalid or expired',
                action: 'check_api_key'
            };
        }
        
        if (error.message.includes('429') || error.message.includes('rate limit')) {
            return {
                type: 'RATE_LIMIT',
                message: 'API rate limit exceeded',
                action: 'wait_and_retry'
            };
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return {
                type: 'NETWORK_ERROR',
                message: 'Network connection failed',
                action: 'check_connection'
            };
        }
        
        return {
            type: 'UNKNOWN_ERROR',
            message: error.message,
            action: 'retry'
        };
    }

    // Handle audio errors
    handleAudioError(error, context) {
        console.error(`Audio error in ${context}:`, error);
        
        if (error.name === 'NotAllowedError') {
            return {
                type: 'PERMISSION_ERROR',
                message: 'Microphone permission denied',
                action: 'request_permission'
            };
        }
        
        if (error.name === 'NotFoundError') {
            return {
                type: 'DEVICE_ERROR',
                message: 'Microphone device not found',
                action: 'check_device'
            };
        }
        
        if (error.name === 'NotReadableError') {
            return {
                type: 'DEVICE_ERROR',
                message: 'Microphone is being used by another application',
                action: 'close_other_apps'
            };
        }
        
        return {
            type: 'AUDIO_ERROR',
            message: error.message,
            action: 'retry'
        };
    }

    // Handle storage errors
    handleStorageError(error) {
        console.error('Storage error:', error);
        
        return {
            type: 'STORAGE_ERROR',
            message: 'Failed to save settings',
            action: 'retry'
        };
    }

    // Get user-friendly error message
    getUserFriendlyMessage(errorInfo) {
        const messages = {
            'AUTH_ERROR': 'Please check your API keys in the extension settings',
            'RATE_LIMIT': 'API rate limit exceeded. Please wait a moment and try again',
            'NETWORK_ERROR': 'Network connection failed. Please check your internet connection',
            'PERMISSION_ERROR': 'Microphone permission denied. Please allow microphone access',
            'DEVICE_ERROR': 'Microphone device not found. Please check your audio settings',
            'STORAGE_ERROR': 'Failed to save settings. Please try again',
            'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again'
        };
        
        return messages[errorInfo.type] || messages['UNKNOWN_ERROR'];
    }

    // Log error for debugging
    logError(error, context, additionalInfo = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            additionalInfo
        };
        
        console.error('Error logged:', errorLog);
        
        // In production, you might want to send this to an error tracking service
        // this.sendToErrorTracking(errorLog);
    }

    // Check if error is recoverable
    isRecoverableError(error) {
        const recoverableErrors = [
            'RATE_LIMIT',
            'NETWORK_ERROR',
            'AUDIO_ERROR'
        ];
        
        return recoverableErrors.includes(error.type);
    }

    // Get retry strategy for error type
    getRetryStrategy(errorType) {
        const strategies = {
            'AUTH_ERROR': { maxRetries: 0, delay: 0 }, // Don't retry auth errors
            'RATE_LIMIT': { maxRetries: 3, delay: 5000 }, // Wait longer for rate limits
            'NETWORK_ERROR': { maxRetries: 5, delay: 1000 }, // Retry network errors more
            'AUDIO_ERROR': { maxRetries: 2, delay: 2000 }, // Limited retries for audio
            'STORAGE_ERROR': { maxRetries: 3, delay: 1000 }, // Standard retry for storage
            'UNKNOWN_ERROR': { maxRetries: 2, delay: 1000 } // Conservative retry for unknown
        };
        
        return strategies[errorType] || strategies['UNKNOWN_ERROR'];
    }
}

export { ErrorHandler };
