import { storageManager } from '../modules/storage.js';
import { SUPPORTED_LANGUAGES } from '../modules/constants.js';

class PopupManager {
    constructor() {
        this.initializeElements();
        this.loadSettings();
        this.setupEventListeners();
        this.updateStatus();
    }

    initializeElements() {
        // Form elements
        this.sourceLanguageSelect = document.getElementById('source-language');
        this.targetLanguageSelect = document.getElementById('target-language');
        this.bidirectionalModeCheckbox = document.getElementById('bidirectional-mode');
        this.autoDetectCheckbox = document.getElementById('auto-detect');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeDisplay = document.getElementById('volume-display');
        this.micDeviceSelect = document.getElementById('mic-device');
        this.mockModeCheckbox = document.getElementById('mock-mode');

        // Buttons
        this.saveButton = document.getElementById('save-settings');
        this.testButton = document.getElementById('test-connection');
        this.clearButton = document.getElementById('clear-data');

        // Status elements
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusMessages = document.getElementById('status-messages');
        this.backendStatus = document.getElementById('backend-status');
        this.translationStatus = document.getElementById('translation-status');
        this.ttsStatus = document.getElementById('tts-status');
    }

    async loadSettings() {
        try {
            const settings = await storageManager.getSettings();

            // Load language settings
            this.sourceLanguageSelect.value = settings.sourceLanguage || 'ar';
            this.targetLanguageSelect.value = settings.targetLanguage || 'en';

            // Load mode settings
            this.bidirectionalModeCheckbox.checked = settings.bidirectionalMode || false;
            this.autoDetectCheckbox.checked = settings.autoDetectLanguage || true;
            this.mockModeCheckbox.checked = settings.mockMode || true;

            // Load audio settings
            this.volumeSlider.value = settings.volume || 0.8;
            this.updateVolumeDisplay();

            // Load mic device
            await this.loadMicDevices();
            this.micDeviceSelect.value = settings.micDevice || 'default';

            // Check backend status
            await this.checkBackendStatus();

        } catch (error) {
            this.showMessage('Error loading settings: ' + error.message, 'error');
        }
    }

    async loadMicDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            this.micDeviceSelect.innerHTML = '<option value="default">Default Microphone</option>';
            
            audioInputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Microphone ${device.deviceId.slice(0, 8)}`;
                this.micDeviceSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading microphone devices:', error);
        }
    }

    setupEventListeners() {
        // Save settings
        this.saveButton.addEventListener('click', () => this.saveSettings());

        // Test connection
        this.testButton.addEventListener('click', () => this.testConnection());

        // Clear data
        this.clearButton.addEventListener('click', () => this.clearData());

        // Volume slider
        this.volumeSlider.addEventListener('input', () => this.updateVolumeDisplay());

        // Bidirectional mode toggle
        this.bidirectionalModeCheckbox.addEventListener('change', () => {
            if (this.bidirectionalModeCheckbox.checked) {
                this.autoDetectCheckbox.checked = true;
            }
        });

        // Auto-detect toggle
        this.autoDetectCheckbox.addEventListener('change', () => {
            if (!this.autoDetectCheckbox.checked) {
                this.bidirectionalModeCheckbox.checked = false;
            }
        });
    }

    async saveSettings() {
        try {
            this.showMessage('Saving settings...', 'info');

            // Save settings
            const settings = {
                sourceLanguage: this.sourceLanguageSelect.value,
                targetLanguage: this.targetLanguageSelect.value,
                bidirectionalMode: this.bidirectionalModeCheckbox.checked,
                autoDetectLanguage: this.autoDetectCheckbox.checked,
                mockMode: this.mockModeCheckbox.checked,
                volume: parseFloat(this.volumeSlider.value),
                micDevice: this.micDeviceSelect.value
            };

            const settingsSaved = await storageManager.saveSettings(settings);

            if (settingsSaved) {
                this.showMessage('Settings saved successfully!', 'success');
                this.updateStatus();
            } else {
                this.showMessage('Failed to save settings', 'error');
            }

        } catch (error) {
            this.showMessage('Error saving settings: ' + error.message, 'error');
        }
    }

    async checkBackendStatus() {
        try {
            const response = await fetch('https://your-backend-app.herokuapp.com/health');
            if (response.ok) {
                this.backendStatus.textContent = 'Online';
                this.backendStatus.className = 'status-value online';
                this.translationStatus.textContent = 'Ready';
                this.translationStatus.className = 'status-value online';
                this.ttsStatus.textContent = 'Ready';
                this.ttsStatus.className = 'status-value online';
            } else {
                throw new Error('Backend not responding');
            }
        } catch (error) {
            this.backendStatus.textContent = 'Offline';
            this.backendStatus.className = 'status-value offline';
            this.translationStatus.textContent = 'Unavailable';
            this.translationStatus.className = 'status-value offline';
            this.ttsStatus.textContent = 'Unavailable';
            this.ttsStatus.className = 'status-value offline';
        }
    }

    async testConnection() {
        try {
            this.showMessage('Testing backend connection...', 'info');
            
            const settings = await storageManager.getSettings();

            if (settings.mockMode) {
                this.showMessage('Mock mode is enabled - no real API calls will be made', 'info');
                return;
            }

            // Test backend health
            const response = await fetch('https://your-backend-app.herokuapp.com/health');
            if (response.ok) {
                this.showMessage('✅ Backend service is online and ready', 'success');
                await this.checkBackendStatus();
            } else {
                this.showMessage('❌ Backend service is offline', 'error');
            }

        } catch (error) {
            this.showMessage('Error testing connection: ' + error.message, 'error');
        }
    }


    async clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                const cleared = await storageManager.clearAll();
                if (cleared) {
                    this.showMessage('All data cleared successfully', 'success');
                    this.loadSettings();
                } else {
                    this.showMessage('Failed to clear data', 'error');
                }
            } catch (error) {
                this.showMessage('Error clearing data: ' + error.message, 'error');
            }
        }
    }

    updateVolumeDisplay() {
        const volume = Math.round(this.volumeSlider.value * 100);
        this.volumeDisplay.textContent = `${volume}%`;
    }

    async updateStatus() {
        try {
            const settings = await storageManager.getSettings();

            const statusDot = this.statusIndicator.querySelector('.status-dot');
            const statusText = this.statusIndicator.querySelector('.status-text');

            if (settings.mockMode) {
                statusDot.className = 'status-dot warning';
                statusText.textContent = 'Mock Mode';
            } else {
                statusDot.className = 'status-dot';
                statusText.textContent = 'Ready';
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        this.statusMessages.appendChild(message);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
