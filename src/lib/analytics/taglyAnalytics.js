// Safe event tracker - never breaks app if GA missing
function trackEvent(eventName, parameters = {}) {
    try {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', eventName, {
                ...parameters,
                app_name: 'TaglyAI',
                app_version: '1.0',
                timestamp: new Date().toISOString()
            });
        }
        // Silently does nothing if GA not configured
    } catch (error) {
        // Never let analytics crash the app
        console.warn('[Analytics] Event failed silently:', eventName);
    }
}

// ── PLATFORM EVENTS ──────────────────────────────────

export function trackPlatformSelected(platform) {
    trackEvent('platform_selected', {
        platform_name: platform,
        event_category: 'Navigation'
    });
}

// ── SEARCH EVENTS ─────────────────────────────────────

export function trackTopicSearch(topic, platform, resultCount) {
    trackEvent('topic_search', {
        search_topic: topic,
        platform_name: platform,
        result_count: resultCount,
        event_category: 'Search'
    });
}

export function trackMagicSearchStarted(topic, platform, searchNumber) {
    trackEvent('magic_search_started', {
        search_topic: topic,
        platform_name: platform,
        search_number: searchNumber,
        event_category: 'MagicSearch'
    });
}

export function trackMagicSearchCompleted(
    topic, platform, modelUsed, searchNumber, durationMs
) {
    trackEvent('magic_search_completed', {
        search_topic: topic,
        platform_name: platform,
        model_used: modelUsed,
        search_number: searchNumber,
        duration_ms: durationMs,
        event_category: 'MagicSearch'
    });
}

export function trackMagicSearchFailed(
    topic, platform, modelUsed, errorType
) {
    trackEvent('magic_search_failed', {
        search_topic: topic,
        platform_name: platform,
        model_used: modelUsed,
        error_type: errorType,
        event_category: 'MagicSearch'
    });
}

// ── QUOTA + UPGRADE EVENTS ────────────────────────────

export function trackQuotaReached(platform, searchesUsed) {
    trackEvent('quota_reached', {
        platform_name: platform,
        searches_used: searchesUsed,
        event_category: 'Conversion',
        event_label: 'Free limit hit - upgrade opportunity'
    });
}

export function trackUpgradeModalShown(trigger, searchesUsed) {
    trackEvent('upgrade_modal_shown', {
        trigger: trigger,
        searches_used: searchesUsed,
        event_category: 'Conversion'
    });
}

export function trackUpgradeClicked(plan, source) {
    trackEvent('upgrade_clicked', {
        plan_name: plan,
        click_source: source,
        event_category: 'Conversion',
        event_label: 'Revenue event'
    });
}

export function trackUpgradeDismissed(searchesUsed) {
    trackEvent('upgrade_dismissed', {
        searches_used: searchesUsed,
        event_category: 'Conversion'
    });
}

// ── FEEDBACK EVENTS ───────────────────────────────────

export function trackResultFeedback(
    rating, platform, topic, modelUsed, searchNumber
) {
    trackEvent('result_feedback', {
        rating: rating,
        platform_name: platform,
        search_topic: topic,
        model_used: modelUsed,
        search_number: searchNumber,
        event_category: 'Quality'
    });
}

// ── ENGAGEMENT EVENTS ─────────────────────────────────

export function trackHashtagsCopied(platform, topic, copyType) {
    trackEvent('hashtags_copied', {
        platform_name: platform,
        search_topic: topic,
        copy_type: copyType,
        event_category: 'Engagement'
    });
}

export function trackImageUploadStarted(platform) {
    trackEvent('image_upload_started', {
        platform_name: platform,
        event_category: 'Feature'
    });
}

export function trackHomepageViewed(platform) {
    trackEvent('homepage_viewed', {
        platform_name: platform,
        event_category: 'Engagement'
    });
}

export function trackSessionStarted(userTier) {
    trackEvent('session_started', {
        user_tier: userTier,
        event_category: 'Session'
    });
}

// ── PERFORMANCE EVENTS ────────────────────────────────

export function trackCacheHit(cacheType, platform) {
    trackEvent('cache_hit', {
        cache_type: cacheType,
        platform_name: platform,
        event_category: 'Performance'
    });
}

export function trackAPIError(service, errorType, platform) {
    trackEvent('api_error', {
        service_name: service,
        error_type: errorType,
        platform_name: platform,
        event_category: 'Error'
    });
}

export function trackModelFallback(
    originalModel, fallbackModel, reason
) {
    trackEvent('model_fallback', {
        original_model: originalModel,
        fallback_model: fallbackModel,
        fallback_reason: reason,
        event_category: 'Performance'
    });
}
