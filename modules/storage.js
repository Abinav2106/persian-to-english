import { DEFAULT_SETTINGS } from './constants.js';

class StorageManager {
  constructor() {
    this.storage = chrome.storage.sync;
  }

  // Get all settings with defaults
  async getSettings() {
    try {
      const result = await this.storage.get(DEFAULT_SETTINGS);
      return result;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // Save settings
  async saveSettings(settings) {
    try {
      await this.storage.set(settings);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // Get API keys
  async getApiKeys() {
    try {
      const result = await this.storage.get(['openaiApiKey', 'elevenLabsApiKey']);
      return {
        openaiApiKey: result.openaiApiKey || '',
        elevenLabsApiKey: result.elevenLabsApiKey || ''
      };
    } catch (error) {
      console.error('Error getting API keys:', error);
      return { openaiApiKey: '', elevenLabsApiKey: '' };
    }
  }

  // Save API keys
  async saveApiKeys(apiKeys) {
    try {
      await this.storage.set({
        openaiApiKey: apiKeys.openaiApiKey || '',
        elevenLabsApiKey: apiKeys.elevenLabsApiKey || ''
      });
      return true;
    } catch (error) {
      console.error('Error saving API keys:', error);
      return false;
    }
  }

  // Get specific setting
  async getSetting(key) {
    try {
      const result = await this.storage.get([key]);
      return result[key];
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return DEFAULT_SETTINGS[key];
    }
  }

  // Save specific setting
  async saveSetting(key, value) {
    try {
      await this.storage.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      return false;
    }
  }

  // Clear all data
  async clearAll() {
    try {
      await this.storage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Check if API keys are configured
  async hasApiKeys() {
    const keys = await this.getApiKeys();
    return !!(keys.openaiApiKey && keys.elevenLabsApiKey);
  }

  // Validate API key format (basic validation)
  validateApiKey(key, type) {
    if (!key || typeof key !== 'string') return false;
    
    switch (type) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 20;
      case 'elevenlabs':
        return key.length > 20; // ElevenLabs keys are typically longer
      default:
        return false;
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
