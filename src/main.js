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
        counterDiv.style.display = 'flex';
        counterDiv.style.alignItems = 'center';
        counterDiv.style.gap = '8px';

        const limits = { spark: 6, creator: 100, growth: 500, agency: Infinity };
        const tierColors = { spark: '#9ca3af', creator: '#22c55e', growth: '#3b82f6', agency: '#a855f7' };
        const tierLabels = { spark: 'TRIAL', creator: '⭐ CREATOR', growth: '🚀 GROWTH', agency: '🏢 AGENCY' };
        const tier = profile.subscriptionTier || 'spark';
        const maxLimit = limits[tier] ?? 6;
        const used = profile.searchesUsedThisMonth || 0;
        const tierColor = tierColors[tier] || '#9ca3af';
        const tierLabel = tierLabels[tier] || 'FREE';

        const displayLimit = maxLimit === Infinity ? '∞' : maxLimit;
        const remaining = maxLimit === Infinity ? '∞' : Math.max(0, maxLimit - used);

        // Amber warning when <20% left, red when exhausted
        let usageColor = 'var(--text-primary)';
        if (maxLimit !== Infinity) {
            const pct = used / maxLimit;
            if (pct >= 1) usageColor = '#ef4444';
            else if (pct >= 0.8) usageColor = '#f59e0b';
        }

        counterDiv.innerHTML = `
            <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; background:${tierColor}20; color:${tierColor}; border:1px solid ${tierColor}40; letter-spacing:0.5px;">${tierLabel}</span>
            <span style="font-size:12px; color:var(--text-secondary);">Searches:</span>
            <span id="limit-usage" style="font-size:12px; font-weight:700; color:${usageColor}">${used}/${displayLimit}</span>
        `;

        // Auto-refresh if blocked by login prompt
        const listContainer = document.getElementById('hashtag-list');
        if (listContainer && listContainer.innerHTML.includes('Login to Search')) {
            loadHashtags();
        }
    } else {
        counterDiv.style.display = 'none';

        const listContainer = document.getElementById('hashtag-list');
        if (listContainer && !listContainer.innerHTML.includes('Login to Search') && !listContainer.querySelector('.skeleton-loader')) {
            loadHashtags();
        }
    }
}

function canSearch() {
    if (currentUserProfile) {
        const limits = { spark: 6, creator: 100, growth: 500, agency: Infinity };
        const tier = currentUserProfile.subscriptionTier || 'spark';
        const limit = limits[tier] ?? 6;
        const used = currentUserProfile.searchesUsedThisMonth || 0;
        if (limit !== Infinity && used >= limit && !currentUserProfile.launchMode) {
            showUpgradePrompt();
            return false;
        }
    }
    return true;
}

// History slot limits per tier
const HISTORY_LIMITS = { spark: 5, creator: 20, growth: 50, agency: 100 };

async function logSearch(query, platform, tagsArray, fullMagicResponse = null) {
    if (!currentUser) return;
    const tier = currentUserProfile?.subscriptionTier || 'spark';
    const historyLimit = HISTORY_LIMITS[tier] || 5;

    try {
        // Save with full magic search result so history can replay it
        const record = {
            userId: currentUser.uid,
            query: query || '',
            platform: platform,
            results: tagsArray.slice(0, 20), // top tags only for preview
            isMagic: !!fullMagicResponse,
            timestamp: new Date().toISOString()
        };

        if (fullMagicResponse) {
            record.categories = fullMagicResponse.categories || null;
            record.analysis = fullMagicResponse.analysis || '';
            record.ideas = fullMagicResponse.ideas || null;
            record.amplification = fullMagicResponse.amplification || '';
        }

        await addDoc(collection(db, 'tagly_searches'), record);

        // Enforce history limit: delete oldest documents beyond tier limit
        // (async, non-blocking — best effort)
        const { getDocs, query: fsQuery, where, orderBy, limit: fsLimit, deleteDoc } = await import('firebase/firestore');
        const oldest = await getDocs(
            fsQuery(
                collection(db, 'tagly_searches'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'asc'),
                fsLimit(1)
            )
        );
        const total = (await getDocs(
            fsQuery(collection(db, 'tagly_searches'), where('userId', '==', currentUser.uid))
        )).size;
        if (total > historyLimit) {
            oldest.forEach(d => deleteDoc(d.ref));
        }

        // Increment monthly search counter
        await updateDoc(doc(db, 'tagly_users', currentUser.uid), {
            searchesUsedThisMonth: increment(1)
        });
    } catch (e) {
        console.error('Failed to log search', e);
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

        // Track and log topic searches only (not homepage loads)
        if (state.searchQuery) {
            logSearch(state.searchQuery, state.currentPlatform, state.hashtags.map(t => t.tag || t));
        }
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

// ─── Helper: render any Magic Search result object ──────
function renderMagicResults(response) {
    state.hashtags = response.allHashtags || [];
    const container = document.getElementById('hashtag-list');
    renderCategorizedHashtags(container, response.categories, response.analysis, response.ideas, response.amplification);
    updateFABData(state.hashtags);
    updateStats(state.hashtags.length, response.lastUpdated || new Date().toISOString(), response.fromCache ? '☁️ Cloud Cache' : '🔮 Magic Search');
}

// ─── Magic Search ──────────────────────────────────────
async function loadMagicSearch(queryOrPayload) {
    if (!canSearch()) return;

    state.isLoading = true;
    state.isMagicMode = true;
    showSkeleton();

    let payload = queryOrPayload;
    if (typeof queryOrPayload === 'string') {
        payload = { content: queryOrPayload, platform: state.currentPlatform };
    }

    const content = payload.content || '';
    const platform = payload.platform || state.currentPlatform;

    // ── Step 1: Check Firestore ai_cache for a global cloud hit ─────
    try {
        const { getDocs, query: fsQuery, where, orderBy, limit: fsLimit } = await import('firebase/firestore');
        const cacheKey = `magic_${platform}_${content.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').substring(0, 60)}`;
        const cacheSnap = await getDocs(
            fsQuery(
                collection(db, 'ai_cache'),
                where('key', '==', cacheKey),
                fsLimit(1)
            )
        );
        if (!cacheSnap.empty) {
            const cached = cacheSnap.docs[0].data();
            const expiresAt = cached.expiresAt || 0;
            if (Date.now() < expiresAt && cached.result?.categories) {
                console.log('☁️ Cloud Cache hit:', cacheKey);
                renderMagicResults({ ...cached.result, fromCache: true });
                state.isLoading = false;
                showToast('☁️ Loaded from cloud cache!');
                return;
            }
        }
    } catch (cacheErr) {
        console.warn('Cloud cache check failed, continuing to AI:', cacheErr.message);
    }

    // ── Step 2: Call AI ──────────────────────────────────────────────
    const magicSearchStartTime = Date.now();
    trackMagicSearchStarted(content, platform, 1);

    try {
        const response = await magicSearch(payload);

        if (response.success && response.categories) {
            if (response.searchesUsed !== undefined) {
                if (currentUserProfile) {
                    currentUserProfile.searchesUsedThisMonth = response.searchesUsed;
                    handleProfileUpdate(currentUserProfile);
                } else {
                    handleProfileUpdate({ subscriptionTier: 'spark', searchesUsedThisMonth: response.searchesUsed });
                }
            }
            renderMagicResults(response);

            trackMagicSearchCompleted(
                content, platform,
                response.modelUsed || 'unknown',
                1,
                Date.now() - magicSearchStartTime
            );

            // Save full result to user history
            logSearch(content, platform,
                (response.allHashtags || []).map(t => t.tag || t),
                response
            );
        } else if (response.error && (response.error.includes('billing') || response.error.includes('QUOTA'))) {
            trackQuotaReached(platform, 10);
            const container = document.getElementById('hashtag-list');
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" style="color: #ff6b35;">💳</div>
                    <p class="empty-state-text" style="color: #ff6b35; margin-bottom: 8px;">Monthly Limit Reached</p>
                    <p style="font-size: 12px; color: var(--text-secondary); max-width: 300px; margin: 0 auto;">
                        You have used all your Magic Searches for this month. <a href="#pricing" style="color: var(--accent-light);">Upgrade your plan</a> to get more.
                    </p>
                </div>
            `;
            const skeleton = document.getElementById('skeleton-loader');
            if (skeleton) skeleton.classList.add('hidden');
        } else {
            await loadHashtags();
        }
    } catch (error) {
        console.error('Magic Search failed:', error);
        trackMagicSearchFailed(content, platform, 'unknown', error.message);
        state.searchQuery = content;
        await loadHashtags();
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

const PLATFORM_TIERS = {
    'youtube': { name: 'YouTube', tier: 'free', emoji: '▶️', color: '#FF0000', unlockStr: 'YouTube only on free plan' },
    'instagram': { name: 'Instagram', tier: 'spark', emoji: '📸', color: '#A855F7', unlockStr: 'Instagram + TikTok' },
    'tiktok': { name: 'TikTok', tier: 'spark', emoji: '🎵', color: '#69C9D0', unlockStr: 'Instagram + TikTok' },
    'facebook': { name: 'Facebook', tier: 'growth', emoji: '👥', color: '#3B82F6', unlockStr: 'Facebook + Twitter/X' },
    'x': { name: 'Twitter / X', tier: 'growth', emoji: '𝕏', color: '#FFFFFF', unlockStr: 'Facebook + Twitter/X' },
    'linkedin': { name: 'LinkedIn', tier: 'agency', emoji: '💼', color: '#F59E0B', unlockStr: 'All 9 platforms' },
    'pinterest': { name: 'Pinterest', tier: 'agency', emoji: '📌', color: '#E60023', unlockStr: 'All 9 platforms' },
    'threads': { name: 'Threads', tier: 'agency', emoji: '🧵', color: '#FFFFFF', unlockStr: 'All 9 platforms' },
    'snapchat': { name: 'Snapchat', tier: 'agency', emoji: '👻', color: '#FFFC00', unlockStr: 'All 9 platforms' }
};

const TIER_ORDER = ['free', 'spark', 'growth', 'agency'];

function isPlatformUnlocked(platformKey, userTier) {
    const required = PLATFORM_TIERS[platformKey].tier;
    return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(required);
}

function initMagicModal() {
    const magicBtn = document.getElementById('magic-btn');
    const overlay = document.getElementById('magic-modal');
    const closeBtn = document.getElementById('magic-modal-close');
    const submitBtn = document.getElementById('magic-submit-btn');

    const subtitleEl = document.getElementById('magic-rotating-subtitle');
    const SUBTITLES = [
        "🎯 Find hashtags your competitors haven't discovered yet",
        "🚀 One topic → 30 laser-targeted hashtags",
        "⚡ Powered by AI trained on 50M viral posts",
        "🔥 Your content deserves to be seen",
        "💡 Stop guessing. Start growing.",
        "🌍 Real trends. Real results. Right now."
    ];
    let subtitleIdx = 0;
    setInterval(() => {
        if (!overlay?.classList.contains('visible') || !subtitleEl) return;
        subtitleIdx = (subtitleIdx + 1) % SUBTITLES.length;
        subtitleEl.style.opacity = 0;
        setTimeout(() => {
            subtitleEl.textContent = SUBTITLES[subtitleIdx];
            subtitleEl.style.opacity = 1;
        }, 150);
    }, 3000);

    const descEl = document.getElementById('magic-desc');
    const PLACEHOLDERS = [
        "e.g. I make 5-minute gym workouts for busy moms...",
        "e.g. Street food travel vlogs in South India...",
        "e.g. Budget fashion hauls under ₹500...",
        "e.g. Tech unboxing for college students...",
        "e.g. Home cooking Bengali recipes...",
        "e.g. Motivational content for entrepreneurs..."
    ];
    let placeIdx = 0;
    setInterval(() => {
        if (!overlay?.classList.contains('visible') || !descEl) return;
        placeIdx = (placeIdx + 1) % PLACEHOLDERS.length;
        descEl.placeholder = PLACEHOLDERS[placeIdx];
    }, 4000);

    const platformSelect = document.getElementById('magic-platform');
    let lastValidPlatform = 'youtube';

    platformSelect?.addEventListener('change', (e) => {
        const userTier = currentUserProfile?.subscriptionTier || 'free';
        const key = e.target.value;
        if (!isPlatformUnlocked(key, userTier)) {
            e.target.value = lastValidPlatform;

            const tooltip = document.getElementById('magic-upgrade-tooltip');
            const config = PLATFORM_TIERS[key];
            if (tooltip && config) {
                document.getElementById('magic-tooltip-badge').textContent = `🔒 ${config.tier.toUpperCase()} PLAN`;
                document.getElementById('magic-tooltip-badge').style.color = config.color;
                document.getElementById('magic-tooltip-unlocks').innerHTML = `Unlocks <strong>${config.unlockStr}</strong> Magic Search`;

                let tagline = 'Perfect for solo creators';
                if (config.tier === 'growth') tagline = 'For creators going full time';
                if (config.tier === 'agency') tagline = 'For agencies and power users';
                document.getElementById('magic-tooltip-tagline').textContent = tagline;

                const tbtn = document.getElementById('magic-tooltip-btn');
                tbtn.style.background = config.color;
                tbtn.textContent = `Upgrade to ${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)}`;

                tooltip.style.display = 'block';
            }
            return;
        }
        document.getElementById('magic-upgrade-tooltip').style.display = 'none';
        lastValidPlatform = key;
    });

    document.getElementById('magic-tooltip-close')?.addEventListener('click', () => {
        document.getElementById('magic-upgrade-tooltip').style.display = 'none';
    });

    magicBtn?.addEventListener('click', () => {
        // Enforce limit on front-end before opening modal
        let used = 0;
        let maxLimit = 6;
        const limitUsage = document.getElementById('limit-usage')?.textContent || '';
        const limitMatched = limitUsage.match(/(\d+)\/(\d+|∞)/);
        if (limitMatched) {
            used = parseInt(limitMatched[1]);
            maxLimit = limitMatched[2] === '∞' ? Infinity : parseInt(limitMatched[2]);
            if (used >= maxLimit) {
                document.getElementById('pricing-modal')?.classList.add('visible');
                return;
            }
        }

        const userTier = currentUserProfile?.subscriptionTier || 'free';

        // Populate platforms
        if (platformSelect) {
            platformSelect.innerHTML = '';
            Object.keys(PLATFORM_TIERS).forEach(key => {
                const config = PLATFORM_TIERS[key];
                const unlocked = isPlatformUnlocked(key, userTier);
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = `${unlocked ? '✅' : '🔒'} ${config.name}${unlocked ? '' : ` — ${config.tier.toUpperCase()} plan`}`;
                if (!unlocked) opt.style.opacity = '0.5';
                if (!unlocked) opt.disabled = true;
                platformSelect.appendChild(opt);
            });
            // Try to set to last used if available, otherwise default to first unlocked
            lastValidPlatform = isPlatformUnlocked(state.currentPlatform || 'youtube', userTier) ? (state.currentPlatform || 'youtube') : 'youtube';
            platformSelect.value = lastValidPlatform;
            document.getElementById('magic-upgrade-tooltip').style.display = 'none';
        }


        // Setup counter display
        const cb = document.getElementById('magic-counter-badge');
        if (cb) {
            cb.style.display = 'inline-flex';
            document.getElementById('magic-counter-used').textContent = used;
            document.getElementById('magic-counter-total').textContent = maxLimit === Infinity ? '∞' : maxLimit;
        }

        // Free tier banner
        const fb = document.getElementById('magic-free-banner');
        if (fb) fb.style.display = (userTier === 'free' || !currentUserProfile) ? 'flex' : 'none';

        // Update button subtext
        const sub = document.getElementById('magic-btn-sub');
        if (sub) {
            sub.textContent = maxLimit === Infinity ? `Unlimited Searches left` : `Search ${used + 1} of ${maxLimit}`;
        }

        // Dynamic Button
        if (submitBtn) {
            submitBtn.classList.remove('urgent');
            if (maxLimit !== Infinity && (maxLimit - used) <= 2) {
                submitBtn.classList.add('urgent');
                sub.textContent = `${maxLimit - used} left this month`;
            }
        }

        overlay.classList.add('visible');
        setTimeout(() => descEl?.focus(), 100);
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

// ─── Toast Helper ──────────────────────────────────────
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    if (toast && toastText) {
        toastText.textContent = message;
        toast.style.background = 'rgba(99, 102, 241, 0.9)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }
}

// Expose for Auth.js history replay
window._taglyReplayMagicResult = function (historyRecord) {
    if (!historyRecord.categories) return false;
    state.isMagicMode = true;
    renderMagicResults({
        ...historyRecord,
        allHashtags: historyRecord.results || [],
        fromCache: true,
        lastUpdated: historyRecord.timestamp
    });
    // Close profile modal
    document.getElementById('profile-modal')?.classList.remove('visible');
    return true;
};

// ─── Start ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
