// Tagly AI – Main Application Entry Point

import { fetchHashtags, searchHashtags, magicSearch, imageToTag } from './utils/api.js';
import { copyMultipleTags } from './utils/clipboard.js';
import { renderPlatformTabs } from './components/PlatformTabs.js';
import { initSearchBar } from './components/SearchBar.js';
import { renderHashtagList, renderCategorizedHashtags, showSkeleton, updateStats } from './components/HashtagList.js';
import { initCopyFAB, updateFABData } from './components/CopyFAB.js';
import { initAuth, currentUser, currentUserProfile } from './components/Auth.js';
import { db, collection, addDoc, updateDoc, doc, increment } from './utils/firebase.js';
import { initPricing } from './components/Checkout.js';
import {
    trackTopicSearch,
    trackMagicSearchStarted,
    trackMagicSearchCompleted,
    trackMagicSearchFailed,
    trackQuotaReached
} from './lib/analytics/taglyAnalytics.js';

import { trackHomepageViewed } from './lib/analytics/taglyAnalytics.js';

// ─── State ──────────────────────────────────────────────
let state = {
    currentPlatform: 'youtube',
    hashtags: [],
    searchQuery: '',
    isLoading: false,
    isMagicMode: false,
    socket: null,
};

// ─── Initialize Application ────────────────────────────
async function init() {
    console.log('🏷️ Tagly AI initializing...');

    // Setup Error Boundaries
    initErrorBoundaries();

    // Render platform tabs
    const tabsContainer = document.getElementById('platform-tabs');
    if (tabsContainer) {
        tabsContainer.style.display = 'flex';
        renderPlatformTabs(tabsContainer, state.currentPlatform, handlePlatformChange);
    }

    // Initialize search
    initSearchBar(handleSearch, handleImageUpload);
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    // Initialize FAB
    initCopyFAB();

    // Initialize image modal
    initImageModal();

    // Handle payment redirects (success/cancel)
    handleStripeRedirects();

    // Initialize Auth modal
    initAuth(handleProfileUpdate);

    // Initialize pricing/checkout modal
    initPricing();

    // Initialize magic modal
    initMagicModal();

    // Setup Offline tracking
    initOfflineTracking();

    // Theme Toggle
    initThemeToggle();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('✅ Service Worker Registered');
        });
    }

    // Load initial data
    await loadHashtags();

    // Connect WebSocket
    connectWebSocket();

    console.log('✅ Tagly AI ready');
}

// ─── Stripe Redirects ──────────────────────────────────
function handleStripeRedirects() {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const tier = params.get('tier');

    if (checkoutStatus === 'success') {
        const toast = document.getElementById('toast');
        const toastText = document.getElementById('toast-text');
        if (toast && toastText) {
            toastText.textContent = `🎉 Welcome to Tagly AI ${tier || 'Premium'}!`;
            toast.style.background = 'rgba(34, 197, 94, 0.9)'; // green
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 5000);
        }

        // Fire Confetti
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        script.onload = () => {
            window.confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8A2BE2', '#a855f7', '#6366f1', '#ff6b35']
            });
        };
        document.head.appendChild(script);

        // Remove params from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkoutStatus === 'cancelled') {
        const toast = document.getElementById('toast');
        const toastText = document.getElementById('toast-text');
        if (toast && toastText) {
            toastText.textContent = 'Payment cancelled. Try again anytime.';
            toast.style.background = 'rgba(255, 107, 53, 0.9)'; // orange
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ─── Theme Toggle ──────────────────────────────────────
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeBtn.textContent = currentTheme === 'light' ? '🌓' : '🌗';

    themeBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeBtn.textContent = newTheme === 'light' ? '🌓' : '🌗';
    });
}

// ─── User Profile & Limits ─────────────────────────────
function handleProfileUpdate(profile) {
    const counterDiv = document.getElementById('limit-counter');
    const limitUsage = document.getElementById('limit-usage');

    if (profile) {
        counterDiv.style.display = 'block';
        const limits = { spark: 10, creator: 100, growth: 500, agency: Infinity };
        const tier = profile.subscriptionTier || 'spark';
        const limit = limits[tier] || 10;
        const used = profile.magicSearchesUsedThisMonth || 0;

        limitUsage.textContent = limit === Infinity ? `${used}/∞` : `${used}/${limit}`;

        if (used >= limit && !profile.launchMode) {
            limitUsage.style.color = 'var(--accent-orange)';
        } else {
            limitUsage.style.color = 'var(--text-primary)';
        }

        // Auto-refresh if blocked by login prompt
        const listContainer = document.getElementById('hashtag-list');
        if (listContainer && listContainer.innerHTML.includes('Login to Search')) {
            loadHashtags();
        }
    } else {
        counterDiv.style.display = 'none';

        // Auto-refresh to reset layout if logged out
        const listContainer = document.getElementById('hashtag-list');
        if (listContainer && !listContainer.innerHTML.includes('Login to Search') && !listContainer.querySelector('.skeleton-loader')) {
            loadHashtags();
        }
    }
}

function canSearch() {
    if (currentUserProfile) {
        const limits = { spark: 10, creator: 100, growth: 500, agency: Infinity };
        const tier = currentUserProfile.subscriptionTier || 'spark';
        const limit = limits[tier] || 10;
        const used = currentUserProfile.searchesUsedThisMonth || 0;
        if (used >= limit && !currentUserProfile.launchMode) {
            showUpgradePrompt();
            return false;
        }
    }
    return true;
}

async function logSearch(query, platform, tagsArray) {
    if (!currentUser) return;
    try {
        await addDoc(collection(db, 'tagly_searches'), {
            userId: currentUser.uid,
            query: query || '',
            platform: platform,
            results: tagsArray,
            timestamp: new Date().toISOString()
        });
        await updateDoc(doc(db, 'tagly_users', currentUser.uid), {
            searchesUsedThisMonth: increment(1)
        });
    } catch (e) {
        console.error("Failed to log search", e);
    }
}

function showLoginPrompt() {
    const container = document.getElementById('hashtag-list');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon" style="color:var(--text-secondary);">🔐</div>
            <p class="empty-state-text">Login to Search</p>
            <p style="font-size: 13px; color: var(--text-secondary); max-width: 300px; margin: 0 auto; margin-bottom: 16px;">
                Create a free account to unlock trending hashtags and analytics.
            </p>
            <button class="modal-cta lock-btn" style="max-width: 150px; padding: 10px;">Login / Register</button>
        </div>
    `;
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.classList.add('hidden');
    container.style.display = '';
    state.isLoading = false;
}

function showUpgradePrompt() {
    const container = document.getElementById('hashtag-list');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon" style="color:#ff6b35;">🚀</div>
            <p class="empty-state-text" style="color:#ff6b35; margin-bottom: 8px;">Monthly Limit Reached</p>
            <p style="font-size: 13px; color: var(--text-secondary); max-width: 300px; margin: 0 auto; margin-bottom: 16px;">
                You've hit your hashtag search limit for the ${currentUserProfile?.subscriptionTier} plan.
            </p>
            <button class="modal-cta" onclick="window.location.hash='#pricing'" style="max-width: 200px; padding: 10px;">Upgrade Plan</button>
        </div>
    `;
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.classList.add('hidden');
    container.style.display = '';
    state.isLoading = false;
}

// ─── Network Status Tracking ───────────────────────────
function initOfflineTracking() {
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    // Initial check
    updateNetworkStatus();
}

function updateNetworkStatus() {
    const offlineToast = document.getElementById('offline-toast');
    if (!navigator.onLine) {
        offlineToast.style.display = 'flex';
        // Give it a brief timeout to allow CSS transition
        setTimeout(() => offlineToast.classList.add('show'), 10);
    } else {
        offlineToast.classList.remove('show');
        setTimeout(() => offlineToast.style.display = 'none', 300);
    }
}

// ─── Data Loading ──────────────────────────────────────
async function loadHashtags() {
    if (!canSearch()) return;

    state.isLoading = true;
    state.isMagicMode = false;
    showSkeleton();

    try {
        let response;
        if (state.searchQuery) {
            response = await searchHashtags(state.currentPlatform, state.searchQuery);
            // Track the topic search
            trackTopicSearch(state.searchQuery, state.currentPlatform, response.data?.length || 0);
        } else {
            response = await fetchHashtags(state.currentPlatform);
        }

        state.hashtags = response.data || [];
        const container = document.getElementById('hashtag-list');
        renderHashtagList(container, state.hashtags);
        updateFABData(state.hashtags);

        // Show data source + update time dynamically per platform
        let platformDisplay = state.currentPlatform.charAt(0).toUpperCase() + state.currentPlatform.slice(1);
        if (state.currentPlatform === 'youtube') platformDisplay = 'YouTube';

        let source = '🤖 AI Search';
        if (response.source === 'youtube-api') source = '▶️ YouTube Live';
        else if (response.source === 'ai-cache' || response.source === 'ai') source = `🤖 AI ${platformDisplay}`;
        else if (response.source === 'simulated') source = `📦 Simulated ${platformDisplay}`;

        updateStats(state.hashtags.length, response.lastUpdated || new Date().toISOString(), source);

        // Track and log this search attempt
        logSearch(state.searchQuery, state.currentPlatform, state.hashtags.map(t => t.tag || t));
    } catch (error) {
        console.error('Failed to load hashtags:', error);
        const container = document.getElementById('hashtag-list');
        const skeleton = document.getElementById('skeleton-loader');
        if (skeleton) skeleton.classList.add('hidden');
        if (container) container.style.display = '';

        // If offline, provide specific message
        if (!navigator.onLine) {
            const container = document.getElementById('hashtag-list');
            container.innerHTML = `
              <div class="empty-state">
                <div class="empty-state-icon" style="color:var(--accent-orange)">📶</div>
                <p class="empty-state-text">You are offline and no cached data was found for this platform.</p>
              </div>
            `;
        } else if (error.name === 'AbortError') {
            const container = document.getElementById('hashtag-list');
            container.innerHTML = `
             <div class="empty-state">
                 <div class="empty-state-icon">⏳</div>
                 <p class="empty-state-text">The AI is currently processing high volume. Please try again.</p>
             </div>
             `;
        } else {
            const container = document.getElementById('hashtag-list');
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Failed to load. Make sure the server is running.</p>
            </div>
            `;
        }
    }

    state.isLoading = false;
}

// ─── Magic Search ──────────────────────────────────────
async function loadMagicSearch(queryOrPayload) {
    if (!canSearch()) return;

    state.isLoading = true;
    state.isMagicMode = true;
    showSkeleton();

    let payload = queryOrPayload;
    if (typeof queryOrPayload === 'string') {
        payload = {
            content: queryOrPayload,
            platform: state.currentPlatform
        };
    }

    const magicSearchStartTime = Date.now();
    const strPayload = typeof payload === 'string' ? payload : (payload.content || 'unknown');
    trackMagicSearchStarted(strPayload, state.currentPlatform, 1);

    try {
        const response = await magicSearch(payload);

        if (response.success && response.categories) {
            // Categorized display
            state.hashtags = response.allHashtags || [];
            const container = document.getElementById('hashtag-list');
            renderCategorizedHashtags(container, response.categories, response.analysis, response.ideas, response.amplification);
            updateFABData(state.hashtags);
            updateStats(state.hashtags.length, response.lastUpdated || new Date().toISOString(), '🔮 Magic Search');

            // Track and log Magic Search
            const strPayload = typeof payload === 'string' ? payload : payload.content;

            trackMagicSearchCompleted(
                strPayload,
                state.currentPlatform,
                response.meta?.modelUsed || 'unknown',
                1,
                Date.now() - magicSearchStartTime
            );

            logSearch(strPayload, state.currentPlatform, state.hashtags.map(t => t.tag || t));
        } else if (response.error && response.error.includes('billing')) {
            trackQuotaReached(state.currentPlatform, 10);
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
            if (container) container.style.display = '';
        } else {
            // Fallback to regular search
            await loadHashtags();
        }
    } catch (error) {
        console.error('Magic Search failed:', error);
        trackMagicSearchFailed(typeof payload === 'string' ? payload : (payload.content || 'unknown'), state.currentPlatform, 'unknown', error.message);

        // Handle network/fetch level 429 error if it was thrown by api.js
        if (error.message?.includes('429') || error.message?.includes('billing')) {
            trackQuotaReached(state.currentPlatform, 10);
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
            if (container) container.style.display = '';
        } else {
            // Fallback to regular search
            state.searchQuery = typeof payload === 'string' ? payload : payload.content;
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
    // Get platform from the new dropdown
    const platformDropdown = document.getElementById('search-platform-dropdown');
    if (platformDropdown) {
        state.currentPlatform = platformDropdown.value;
    }

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
    if (!currentUserProfile || !currentUserProfile.isPaidUser) {
        document.getElementById('pricing-modal')?.classList.add('visible');
        return;
    }

    alert('Image-to-Hashtag is launching very soon for subscribers! You will be notified when it is ready.');
}

function initMagicModal() {
    const magicBtn = document.getElementById('magic-btn');
    const overlay = document.getElementById('magic-modal');
    const closeBtn = document.getElementById('magic-modal-close');
    const submitBtn = document.getElementById('magic-submit-btn');

    magicBtn?.addEventListener('click', () => {
        // Enforce limit on front-end before opening modal
        const limitUsage = document.getElementById('limit-usage')?.textContent || '';
        const limitMatched = limitUsage.match(/(\d+)\/(\d+)/);
        if (limitMatched) {
            const used = parseInt(limitMatched[1]);
            const limit = parseInt(limitMatched[2]);
            if (used >= limit) {
                document.getElementById('pricing-modal')?.classList.add('visible');
                return;
            }
        }

        overlay.classList.add('visible');
        setTimeout(() => document.getElementById('magic-desc').focus(), 100);
    });

    closeBtn?.addEventListener('click', () => {
        overlay.classList.remove('visible');
    });

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('visible');
        }
    });

    submitBtn?.addEventListener('click', () => {
        const description = document.getElementById('magic-desc').value.trim();
        if (!description) {
            alert('Please describe your content');
            return;
        }

        const payload = {
            content: description,
            platform: document.getElementById('magic-platform').value,
            format: document.getElementById('magic-format').value,
            audience: document.getElementById('magic-audience').value,
            tone: document.getElementById('magic-tone').value
        };

        overlay.classList.remove('visible');

        // Update the search bar to show what we are searching for
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = description;
        state.searchQuery = description;

        // Handle platform change if it differs from current
        if (state.currentPlatform !== payload.platform) {
            state.currentPlatform = payload.platform;
            const tabsContainer = document.getElementById('platform-tabs');
            renderPlatformTabs(tabsContainer, state.currentPlatform, handlePlatformChange);
        }

        loadMagicSearch(payload);
    });
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
            const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3001'
                : 'https://taglyai.onrender.com';

            const socket = window.io(socketUrl, {
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

// ─── Global Error Boundaries ───────────────────────────
function initErrorBoundaries() {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        console.error('Crash Protection Caught Error:', msg, error);
        showCrashUI();
        return false;
    };

    window.addEventListener('unhandledrejection', function (event) {
        console.error('Crash Protection Unhandled Promise:', event.reason);
        showCrashUI();
    });
}

function showCrashUI() {
    const listContainer = document.getElementById('hashtag-list');
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.classList.add('hidden');
    if (listContainer) {
        listContainer.style.display = '';
        if (listContainer.innerHTML.indexOf('empty-state') === -1) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" style="color:#ff6b35;">💥</div>
                    <p class="empty-state-text" style="color:#ff6b35; margin-bottom: 8px;">Oops! Something went wrong.</p>
                    <p style="font-size: 12px; color: var(--text-secondary); max-width: 300px; margin: 0 auto; margin-bottom: 16px;">
                        We trapped an unexpected error to keep the app running.
                    </p>
                    <button class="modal-cta" onclick="window.location.reload()" style="max-width: 150px; padding: 10px;">Reload App</button>
                </div>
            `;
        }
    }
}

// ─── Start ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
