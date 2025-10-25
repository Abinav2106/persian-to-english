import { SUPPORTED_LANGUAGES } from './modules/constants.js';

class MeetTranslationWidget {
    constructor() {
        this.widget = null;
        this.shadowRoot = null;
        this.isMinimized = false;
        this.isMuted = false;
        this.currentTranslation = null;
        this.setupWidget();
        this.setupMessageHandlers();
        this.checkMeetPage();
    }

    setupWidget() {
        // Create widget container
        this.widget = document.createElement('div');
        this.widget.id = 'meet-translation-widget';
        this.widget.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            min-height: 200px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Create shadow DOM
        this.shadowRoot = this.widget.attachShadow({ mode: 'open' });

        // Add styles
        const style = document.createElement('style');
        style.textContent = this.getWidgetStyles();
        this.shadowRoot.appendChild(style);

        // Add widget HTML
        this.shadowRoot.appendChild(this.createWidgetHTML());

        // Add to page
        document.body.appendChild(this.widget);

        // Setup event listeners
        this.setupWidgetEventListeners();
    }

    getWidgetStyles() {
        return `
            .widget-container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                color: white;
                overflow: hidden;
                transition: all 0.3s ease;
                user-select: none;
            }

            .widget-container.minimized {
                height: 50px;
            }

            .widget-header {
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
            }

            .widget-title {
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .language-indicators {
                font-size: 16px;
            }

            .widget-controls {
                display: flex;
                gap: 8px;
            }

            .control-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 16px;
                padding: 6px;
                transition: background 0.2s ease;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .control-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .control-btn.active {
                background: rgba(255, 255, 255, 0.4);
            }

            .widget-body {
                padding: 16px;
                min-height: 120px;
            }

            .transcription-section {
                margin-bottom: 12px;
            }

            .section-label {
                font-size: 12px;
                opacity: 0.8;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .text-content {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 14px;
                line-height: 1.4;
                min-height: 20px;
                word-wrap: break-word;
            }

            .text-content.empty {
                opacity: 0.6;
                font-style: italic;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                margin-top: 8px;
                opacity: 0.8;
            }

            .status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #4ade80;
                animation: pulse 2s infinite;
            }

            .status-dot.error {
                background: #ef4444;
            }

            .status-dot.warning {
                background: #f59e0b;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .dragging {
                cursor: grabbing !important;
            }
        `;
    }

    createWidgetHTML() {
        const container = document.createElement('div');
        container.className = 'widget-container';
        container.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">
                    🌍 Middle Eastern Translator
                    <span class="language-indicators" id="language-flags">🇸🇦 ⇄ 🇬🇧</span>
                </div>
                <div class="widget-controls">
                    <button class="control-btn" id="mic-toggle" title="Toggle Microphone">🎤</button>
                    <button class="control-btn" id="minimize-btn" title="Minimize">−</button>
                </div>
            </div>
            <div class="widget-body">
                <div class="transcription-section">
                    <div class="section-label">
                        <span>Original Text</span>
                    </div>
                    <div class="text-content" id="original-text">Listening for speech...</div>
                </div>
                <div class="transcription-section">
                    <div class="section-label">
                        <span>Translation</span>
                    </div>
                    <div class="text-content" id="translated-text">Translation will appear here...</div>
                </div>
                <div class="status-indicator">
                    <div class="status-dot" id="status-dot"></div>
                    <span id="status-text">Ready</span>
                </div>
            </div>
        `;
        return container;
    }

    setupWidgetEventListeners() {
        const container = this.shadowRoot.querySelector('.widget-container');
        const header = this.shadowRoot.querySelector('.widget-header');
        const micToggle = this.shadowRoot.querySelector('#mic-toggle');
        const minimizeBtn = this.shadowRoot.querySelector('#minimize-btn');

        // Drag functionality
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            container.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            container.style.left = (startLeft + deltaX) + 'px';
            container.style.top = (startTop + deltaY) + 'px';
            container.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.classList.remove('dragging');
            }
        });

        // Mic toggle
        micToggle.addEventListener('click', () => {
            this.toggleMicrophone();
        });

        // Minimize toggle
        minimizeBtn.addEventListener('click', () => {
            this.toggleMinimize();
        });
    }

    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'TRANSLATION_RESULT':
                    this.updateTranslation(message.data);
                    break;
                case 'TRANSLATION_ERROR':
                    this.showError(message.error);
                    break;
                case 'STATUS_UPDATE':
                    this.updateStatus(message.status);
                    break;
            }
        });
    }

    async checkMeetPage() {
        // Check if we're on a Google Meet page
        if (window.location.hostname === 'meet.google.com') {
            await this.initializeTranslation();
        }
    }

    async initializeTranslation() {
        try {
            // Request to start translation
            const response = await chrome.runtime.sendMessage({ type: 'START_TRANSLATION' });
            if (response.success) {
                this.updateStatus('Active');
            } else {
                this.updateStatus('Error');
            }
        } catch (error) {
            console.error('Error initializing translation:', error);
            this.updateStatus('Error');
        }
    }

    updateTranslation(data) {
        const originalText = this.shadowRoot.querySelector('#original-text');
        const translatedText = this.shadowRoot.querySelector('#translated-text');
        const languageFlags = this.shadowRoot.querySelector('#language-flags');

        // Update text content
        originalText.textContent = data.originalText;
        originalText.classList.remove('empty');
        
        translatedText.textContent = data.translatedText;
        translatedText.classList.remove('empty');

        // Update language flags based on bidirectional mode
        const sourceFlag = SUPPORTED_LANGUAGES[data.sourceLanguage]?.flag || '🌐';
        const targetFlag = SUPPORTED_LANGUAGES[data.targetLanguage]?.flag || '🌐';
        
        if (data.bidirectional) {
            // Show bidirectional arrows
            languageFlags.textContent = `${sourceFlag} ⇄ ${targetFlag}`;
        } else {
            // Show single direction arrow
            languageFlags.textContent = `${sourceFlag} → ${targetFlag}`;
        }

        // Store current translation
        this.currentTranslation = data;

        // Update status based on mode
        if (data.bidirectional) {
            this.updateStatus('Bidirectional Translation...');
        } else {
            this.updateStatus('Translating...');
        }
    }

    showError(errorMessage) {
        const statusText = this.shadowRoot.querySelector('#status-text');
        const statusDot = this.shadowRoot.querySelector('#status-dot');
        
        statusText.textContent = `Error: ${errorMessage}`;
        statusDot.className = 'status-dot error';
    }

    updateStatus(status) {
        const statusText = this.shadowRoot.querySelector('#status-text');
        const statusDot = this.shadowRoot.querySelector('#status-dot');
        
        statusText.textContent = status;
        
        // Update status dot color
        statusDot.className = 'status-dot';
        if (status.includes('Error')) {
            statusDot.classList.add('error');
        } else if (status.includes('Warning')) {
            statusDot.classList.add('warning');
        }
    }

    async toggleMicrophone() {
        try {
            this.isMuted = !this.isMuted;
            const micToggle = this.shadowRoot.querySelector('#mic-toggle');
            
            if (this.isMuted) {
                micToggle.classList.add('active');
                micToggle.textContent = '🔇';
                // Send message to background to stop audio capture
                await chrome.runtime.sendMessage({ type: 'STOP_TRANSLATION' });
            } else {
                micToggle.classList.remove('active');
                micToggle.textContent = '🎤';
                // Send message to background to start audio capture
                await chrome.runtime.sendMessage({ type: 'START_TRANSLATION' });
            }
        } catch (error) {
            console.error('Error toggling microphone:', error);
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const container = this.shadowRoot.querySelector('.widget-container');
        const minimizeBtn = this.shadowRoot.querySelector('#minimize-btn');
        
        if (this.isMinimized) {
            container.classList.add('minimized');
            minimizeBtn.textContent = '+';
            minimizeBtn.title = 'Expand';
        } else {
            container.classList.remove('minimized');
            minimizeBtn.textContent = '−';
            minimizeBtn.title = 'Minimize';
        }
    }

    // Cleanup method
    destroy() {
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
    }
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MeetTranslationWidget();
    });
} else {
    new MeetTranslationWidget();
}
