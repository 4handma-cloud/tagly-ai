// Tagly AI – Main Application Entry Point

import { fetchHashtags, searchHashtags, magicSearch, imageToTag } from './utils/api.js';
import { copyMultipleTags } from './utils/clipboard.js';
import { renderPlatformTabs } from './components/PlatformTabs.js';
import { initSearchBar } from './components/SearchBar.js';
import { renderHashtagList, renderCategorizedHashtags, showSkeleton, updateStats } from './components/HashtagList.js';
import { initCopyFAB, updateFABData } from './components/CopyFAB.js';
import { initProBanner } from './components/ProBanner.js';

// ─── State ──────────────────────────────────────────────
let state = {
    currentPlatform: 'tiktok',
    hashtags: [],
    searchQuery: '',
    isLoading: false,
    isMagicMode: false,
    socket: null,
};

// ─── Initialize Application ────────────────────────────
async function init() {
    console.log('🏷️ Tagly AI initializing...');

    // Render platform tabs
    const tabsContainer = document.getElementById('platform-tabs');
    renderPlatformTabs(tabsContainer, state.currentPlatform, handlePlatformChange);

    // Initialize search
    initSearchBar(handleSearch, handleImageUpload);

    // Initialize FAB
    initCopyFAB();

    // Initialize Pro modal
    initProBanner();

    // Initialize image modal
    initImageModal();

    // Load initial data
    await loadHashtags();

    // Connect WebSocket
    connectWebSocket();

    console.log('✅ Tagly AI ready');
}

// ─── Data Loading ──────────────────────────────────────
async function loadHashtags() {
    state.isLoading = true;
    state.isMagicMode = false;
    showSkeleton();

    try {
        let response;
        if (state.searchQuery) {
            response = await searchHashtags(state.currentPlatform, state.searchQuery);
        } else {
            response = await fetchHashtags(state.currentPlatform);
        }

        state.hashtags = response.data || [];
        const container = document.getElementById('hashtag-list');
        renderHashtagList(container, state.hashtags);
        updateFABData(state.hashtags);

        // Show data source + update time
        const sourceMap = { 'youtube-api': '▶️ YouTube Live', 'gpt-5.2': '🤖 AI Live', 'simulated': '📦 Simulated' };
        const source = sourceMap[response.source] || '📦 Simulated';
        updateStats(state.hashtags.length, response.lastUpdated || new Date().toISOString(), source);
    } catch (error) {
        console.error('Failed to load hashtags:', error);
        const container = document.getElementById('hashtag-list');
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Failed to load. Make sure the server is running.</p>
      </div>
    `;
    }

    state.isLoading = false;
}

// ─── Magic Search ──────────────────────────────────────
async function loadMagicSearch(query) {
    state.isLoading = true;
    state.isMagicMode = true;
    showSkeleton();

    try {
        const response = await magicSearch(query, state.currentPlatform);

        if (response.success && response.categories) {
            // Categorized display
            state.hashtags = response.allHashtags || [];
            const container = document.getElementById('hashtag-list');
            renderCategorizedHashtags(container, response.categories, response.analysis);
            updateFABData(state.hashtags);
            updateStats(state.hashtags.length, response.lastUpdated || new Date().toISOString(), '🔮 Magic Search');
        } else if (response.error && response.error.includes('billing')) {
            // Handle quota error
            const container = document.getElementById('hashtag-list');
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" style="color: #ff6b35;">💳</div>
                    <p class="empty-state-text" style="color: #ff6b35; margin-bottom: 8px;">OpenAI Quota Exceeded</p>
                    <p style="font-size: 12px; color: var(--text-secondary); max-width: 300px; margin: 0 auto;">
                        Your free trial has ended or you need to add billing details at 
                        <a href="https://platform.openai.com/account/billing" target="_blank" style="color: var(--accent-light);">platform.openai.com</a>.
                    </p>
                </div>
            `;
            const skeleton = document.getElementById('skeleton-loader');
            if (skeleton) skeleton.classList.add('hidden');
        } else {
            // Fallback to regular search
            await loadHashtags();
        }
    } catch (error) {
        console.error('Magic Search failed:', error);

        // Handle network/fetch level 429 error if it was thrown by api.js
        if (error.message?.includes('429') || error.message?.includes('billing')) {
            const container = document.getElementById('hashtag-list');
            container.innerHTML = `
                 <div class="empty-state">
                     <div class="empty-state-icon" style="color: #ff6b35;">💳</div>
                     <p class="empty-state-text" style="color: #ff6b35; margin-bottom: 8px;">OpenAI Quota Exceeded</p>
                     <p style="font-size: 12px; color: var(--text-secondary); max-width: 300px; margin: 0 auto;">
                         Please add billing details at 
                         <a href="https://platform.openai.com/account/billing" target="_blank" style="color: var(--accent-light);">platform.openai.com</a>.
                     </p>
                 </div>
             `;
            const skeleton = document.getElementById('skeleton-loader');
            if (skeleton) skeleton.classList.add('hidden');
        } else {
            // Fallback to regular search
            state.searchQuery = query;
            await loadHashtags();
        }
    }

    state.isLoading = false;
}

// ─── Event Handlers ────────────────────────────────────
function handlePlatformChange(platformId) {
    if (state.currentPlatform === platformId) return;
    state.currentPlatform = platformId;
    state.searchQuery = '';

    if (state.isMagicMode) {
        state.isMagicMode = false;
    }
    loadHashtags();
}

function handleSearch(query) {
    if (!query) {
        state.searchQuery = '';
        state.isMagicMode = false;
        loadHashtags();
        return;
    }

    // If query is descriptive (more than 2 words), use Magic Search
    const wordCount = query.trim().split(/\s+/).length;
    if (wordCount >= 3) {
        loadMagicSearch(query);
    } else {
        state.searchQuery = query;
        loadHashtags();
    }
}

async function handleImageUpload(file) {
    const overlay = document.getElementById('image-overlay');
    const preview = document.getElementById('image-preview');
    const status = document.getElementById('image-status');
    const tagsContainer = document.getElementById('image-tags');

    // Show modal with preview
    overlay.classList.add('visible');
    preview.src = URL.createObjectURL(file);
    status.textContent = '🤖 Analyzing image with AI...';
    tagsContainer.innerHTML = '';

    try {
        const response = await imageToTag(file, state.currentPlatform);
        const tags = response.data || [];

        if (tags.length > 0) {
            status.textContent = `✅ Found ${tags.length} hashtags for your image`;
            tagsContainer.innerHTML = tags
                .map(t => `<span class="image-tag-chip">${t.tag}</span>`)
                .join('');

            // Set up copy all button
            const copyBtn = document.getElementById('copy-image-tags');
            copyBtn.onclick = () => {
                copyMultipleTags(tags.map(t => t.tag));
            };
        } else {
            status.textContent = '❌ Could not generate hashtags for this image.';
        }
    } catch (error) {
        status.textContent = '⚠️ Analysis failed. Server may be offline.';
    }
}

function initImageModal() {
    const overlay = document.getElementById('image-overlay');
    const closeBtn = document.getElementById('image-modal-close');

    closeBtn?.addEventListener('click', () => {
        overlay.classList.remove('visible');
    });

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('visible');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            overlay.classList.remove('visible');
        }
    });
}

// ─── WebSocket ─────────────────────────────────────────
function connectWebSocket() {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    script.onload = () => {
        try {
            const socket = window.io('http://localhost:3001', {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
            });

            socket.on('connect', () => {
                console.log('🔌 WebSocket connected');
                updateLiveIndicator(true);
            });

            socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected');
                updateLiveIndicator(false);
            });

            socket.on('hashtags:updated', (data) => {
                console.log('📡 Live update received:', data);
                if (!state.isMagicMode) {
                    loadHashtags();
                }
                flashLiveIndicator();
            });

            state.socket = socket;
        } catch (e) {
            console.log('WebSocket unavailable, using polling');
        }
    };
    document.head.appendChild(script);
}

function updateLiveIndicator(connected) {
    const indicator = document.getElementById('live-indicator');
    if (!indicator) return;

    if (connected) {
        indicator.style.borderColor = 'rgba(34, 197, 94, 0.2)';
        indicator.querySelector('.live-dot').style.background = '#22c55e';
        indicator.querySelector('.live-text').textContent = 'LIVE';
    } else {
        indicator.style.borderColor = 'rgba(255, 107, 53, 0.2)';
        indicator.querySelector('.live-dot').style.background = '#ff6b35';
        indicator.querySelector('.live-text').textContent = 'OFFLINE';
    }
}

function flashLiveIndicator() {
    const indicator = document.getElementById('live-indicator');
    if (!indicator) return;

    indicator.style.background = 'rgba(34, 197, 94, 0.2)';
    setTimeout(() => {
        indicator.style.background = '';
    }, 1000);
}

// ─── Start ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
