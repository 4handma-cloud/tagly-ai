// Hashtag List Component – Segmented homepage view + Magic Search categorized display
import { copyToClipboard, copyMultipleTags } from '../utils/clipboard.js';
import { trackHashtagsCopied, trackResultFeedback } from '../lib/analytics/taglyAnalytics.js';
import { currentUser } from './Auth.js';

async function copyHashtag(tag) {
  await copyToClipboard(tag);
}

// Segment configuration — 12 tags per section (4 cols × 3 rows = 48 total)
const SEGMENT_CONFIG = [
  {
    id: 'seg1',
    emoji: '🔥',
    title: 'Blowing Up',
    subtitle: 'Post these RIGHT NOW for max reach',
    color: '#FF4444',
    bgTint: 'rgba(255, 68, 68, 0.07)',
    range: [0, 12]
  },
  {
    id: 'seg2',
    emoji: '⚡',
    title: 'Trending Now',
    subtitle: 'High traffic, still time to ride the wave',
    color: '#FFB800',
    bgTint: 'rgba(255, 184, 0, 0.07)',
    range: [12, 24]
  },
  {
    id: 'seg3',
    emoji: '🚀',
    title: 'Rising Fast',
    subtitle: 'Getting hot — early mover advantage',
    color: '#6366F1',
    bgTint: 'rgba(99, 102, 241, 0.07)',
    range: [24, 36]
  },
  {
    id: 'seg4',
    emoji: '💎',
    title: 'Hidden Gems',
    subtitle: 'Low competition, highly targeted',
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.07)',
    range: [36, 48]
  }
];

export function renderHashtagList(container, hashtags) {
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) skeleton.classList.add('hidden');
  container.style.display = '';

  const tags = hashtags || [];

  if (tags.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p class="empty-state-text">No hashtags found. Try a different search.</p>
      </div>
    `;
    return;
  }

  // Build segmented HTML — 4-col × 3-row grid per segment
  let html = '<div class="segmented-hashtags">';

  for (const seg of SEGMENT_CONFIG) {
    const [start, end] = seg.range;
    const segTags = tags.slice(start, Math.min(end, tags.length));
    if (segTags.length === 0) continue;

    const tagsPillsHtml = segTags.map(h => {
      const tagStr = h.tag || h;
      return `
        <div class="seg-pill-row">
          <span class="seg-pill-text">${tagStr}</span>
          <button class="seg-copy-btn" data-tag="${tagStr}" title="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>`;
    }).join('');

    html += `
      <div class="segment-card" style="border-left: 3px solid ${seg.color};" data-seg="${seg.id}">
        <div class="segment-header" style="background: ${seg.bgTint};" onclick="this.closest('.segment-card').classList.toggle('seg-collapsed')">
          <div class="segment-title-row">
            <span class="segment-emoji">${seg.emoji}</span>
            <div class="segment-text">
              <span class="segment-title" style="color: ${seg.color};">${seg.title}</span>
              <span class="segment-subtitle">${seg.subtitle}</span>
            </div>
            <button class="segment-copy-all" data-seg-id="${seg.id}" title="Copy all ${seg.title} tags"
              style="border-color: ${seg.color}40; color: ${seg.color};">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              ${segTags.length}
            </button>
            <span class="segment-arrow">▼</span>
          </div>
        </div>
        <div class="segment-pills-wrap">${tagsPillsHtml}</div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  // Attach individual copy-button handlers
  container.querySelectorAll('.seg-copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tag = btn.getAttribute('data-tag');
      await copyHashtag(tag);
      btn.classList.add('seg-btn-copied');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><path d="M20 6L9 17l-5-5"/></svg>';
      setTimeout(() => {
        btn.classList.remove('seg-btn-copied');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      }, 1400);
    });
  });

  // Attach copy-all handlers
  container.querySelectorAll('.segment-copy-all').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // don't collapse header
      const segId = btn.getAttribute('data-seg-id');
      const seg = SEGMENT_CONFIG.find(s => s.id === segId);
      if (!seg) return;
      const [start, end] = seg.range;
      const segTags = (hashtags || []).slice(start, Math.min(end, (hashtags || []).length));
      const tagStrings = segTags.map(h => h.tag || h);
      await copyMultipleTags(tagStrings);
      const prev = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M20 6L9 17l-5-5"/></svg> Copied!`;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = prev;
        btn.classList.remove('copied');
      }, 1800);
    });
  });
}


/**
 * Render categorized Magic Search results
 */
export function renderCategorizedHashtags(container, categories, analysis, ideas, amplification) {
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) skeleton.classList.add('hidden');
  container.style.display = '';

  let html = '';

  // Build rich ARIA strategy sections
  const hasRichData = ideas && (ideas.titles || ideas.keywords || ideas.descriptions || ideas.timestamps);
  const hasAnalysis = analysis && analysis.length > 0;

  if (hasRichData || hasAnalysis) {
    // --- KEYWORDS ---
    let keywordsHtml = '';
    if (ideas?.keywords && ideas.keywords.length > 0) {
      keywordsHtml = `
        <div class="aria-section">
          <div class="aria-section-title">🔑 Keywords</div>
          <div class="aria-pills">
            ${ideas.keywords.map(k => `<span class="aria-pill">${k}</span>`).join('')}
          </div>
        </div>`;
    }

    // --- TITLES ---
    let titlesHtml = '';
    if (ideas?.titles && ideas.titles.length > 0) {
      titlesHtml = `
        <div class="aria-section">
          <div class="aria-section-title">📝 Content Titles</div>
          <div class="aria-cards-scroll">
            ${ideas.titles.map(t => `<div class="aria-card">${t}</div>`).join('')}
          </div>
        </div>`;
    }

    // --- POSTING TIMES ---
    let timesHtml = '';
    if (ideas?.timestamps && ideas.timestamps.length > 0) {
      timesHtml = `
        <div class="aria-section">
          <div class="aria-section-title">🕐 Best Posting Times</div>
          <div class="aria-cards-scroll">
            ${ideas.timestamps.map(t => `<div class="aria-card aria-card-time">⏰ ${t}</div>`).join('')}
          </div>
        </div>`;
    }

    // --- DESCRIPTIONS ---
    let descHtml = '';
    if (ideas?.descriptions && ideas.descriptions.length > 0) {
      descHtml = `
        <div class="aria-section">
          <div class="aria-section-title">📋 Optimized Descriptions</div>
          ${ideas.descriptions.map((d, i) => `
            <div class="aria-desc-block">
              <div class="aria-desc-text">${d}</div>
            </div>
          `).join('')}
        </div>`;
    }

    // --- GROWTH STRATEGY ---
    let growthHtml = '';
    if (analysis) {
      growthHtml = `
        <div class="aria-section">
          <div class="aria-section-title">📈 Growth Strategy</div>
          <div class="aria-growth-summary">${analysis}</div>
          ${amplification ? `<div class="aria-quickwin"><span class="aria-quickwin-badge">⚡ Quick Win</span> ${amplification}</div>` : ''}
        </div>`;
    }

    html += `
      <div class="premium-ideas-wrapper" id="premium-ideas-wrapper">
        <div class="premium-ideas-content" id="premium-ideas-content">
          <div class="magic-analysis-header">
            <span class="magic-analysis-icon">✨</span>
            <strong>ARIA — AI Content Strategy</strong>
          </div>
          ${keywordsHtml}
          ${titlesHtml}
          ${timesHtml}
          ${descHtml}
          ${growthHtml}
        </div>
        <div class="premium-lock-overlay" id="premium-lock-overlay">
          <div class="lock-icon">🔒</div>
          <div class="lock-title">Login to Unlock Full Strategy</div>
          <div class="lock-desc">
            Create a free account to get 6 Magic Searches per month with full access to keywords, titles, descriptions, posting times, and growth strategy.
          </div>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
            <button class="modal-cta lock-btn">Login / Register</button>
            <button class="modal-cta modal-cta-secondary" onclick="document.getElementById('pricing-modal')?.classList.add('visible')">View Pricing</button>
          </div>
        </div>
      </div>
    `;
  } else if (analysis) {
    // Even for simple analysis, use the lockable wrapper
    html += `
      <div class="premium-ideas-wrapper" id="premium-ideas-wrapper">
        <div class="premium-ideas-content" id="premium-ideas-content">
          <div class="magic-analysis-header">
            <span class="magic-analysis-icon">✨</span>
            <strong>ARIA — AI Content Strategy</strong>
          </div>
          <div class="aria-section">
            <div class="aria-section-title">📈 Growth Strategy</div>
            <div class="aria-growth-summary">${analysis}</div>
            ${amplification && amplification !== analysis ? `<div class="aria-quickwin"><span class="aria-quickwin-badge">⚡ Quick Win</span> ${amplification}</div>` : ''}
          </div>
        </div>
        <div class="premium-lock-overlay" id="premium-lock-overlay">
          <div class="lock-icon">🔒</div>
          <div class="lock-title">Login to Unlock Full Strategy</div>
          <div class="lock-desc">
            Create a free account to get 6 Magic Searches per month with full access to keywords, titles, descriptions, posting times, and growth strategy.
          </div>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
            <button class="modal-cta lock-btn">Login / Register</button>
            <button class="modal-cta modal-cta-secondary" onclick="document.getElementById('pricing-modal')?.classList.add('visible')">View Pricing</button>
          </div>
        </div>
      </div>
    `;
  }

  // Render each category
  const categoryOrder = ['tier_1_high_volume', 'tier_2_mid_volume', 'tier_3_niche_targeted', 'bonus_trending_tags'];

  for (const catKey of categoryOrder) {
    const cat = categories[catKey];
    if (!cat || !cat.tags || cat.tags.length === 0) continue;

    html += `
      <div class="category-section" data-category="${catKey}">
        <div class="category-header">
          <div class="category-info">
            <span class="category-label">${cat.label}</span>
            <span class="category-desc">${cat.desc}</span>
          </div>
          <button class="category-copy-btn" data-category="${catKey}" title="Copy all ${cat.label} tags">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy ${cat.tags.length}
          </button>
        </div>
        <div class="category-tags">
          ${cat.tags.map((h, i) => buildHashtagRow(h, i)).join('')}
        </div>
      </div>
    `;
  }
  html += `
    <div class="feedback-row" id="magic-feedback-row" style="text-align: center; margin-top: 20px; padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05); color: #fff;">
      <span style="margin-right: 15px; font-weight: 500; font-family: 'Outfit', sans-serif;">Was this helpful?</span>
      <button class="feedback-btn" data-rating="positive" style="background:none; border:none; font-size: 1.2rem; cursor:pointer; margin-right: 5px; transition: transform 0.2s;">👍</button>
      <button class="feedback-btn" data-rating="negative" style="background:none; border:none; font-size: 1.2rem; cursor:pointer; transition: transform 0.2s;">👎</button>
    </div>
  `;

  container.innerHTML = html;
  const premiumOverlay = document.getElementById('premium-lock-overlay');
  const premiumContent = document.getElementById('premium-ideas-content');
  if (premiumOverlay && premiumContent) {
    if (window.premiumTimeout) clearTimeout(window.premiumTimeout);

    const applyBlur = () => {
      window.premiumTimeout = setTimeout(() => {
        premiumContent.classList.add('blurred');
        premiumOverlay.classList.add('visible');
      }, 5000); // 5 seconds then lock
    };

    // Only apply blur if user is NOT logged in
    if (!currentUser) {
      applyBlur();
    }
  }

  // Attach individual copy handlers
  attachCopyHandlers(container);

  // Attach category copy handlers
  container.querySelectorAll('.category-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const catKey = btn.getAttribute('data-category');
      const cat = categories[catKey];
      if (cat && cat.tags) {
        await copyMultipleTags(cat.tags.map(t => t.tag));
        trackHashtagsCopied(window.currentPlatform || 'unknown', document.getElementById('search-input')?.value || 'general', 'category_' + catKey);
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg> Copied!`;
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy ${cat.tags.length}`;
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  });

  // Attach feedback handlers
  const feedbackRow = container.querySelector('#magic-feedback-row');
  if (feedbackRow) {
    feedbackRow.querySelectorAll('.feedback-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rating = btn.getAttribute('data-rating');
        // Hide the row immediately for UX
        feedbackRow.style.display = 'none';

        const platform = window.currentPlatform || 'instagram';
        const topic = document.getElementById('search-input')?.value || 'general';
        const modelUsed = window.lastMagicModelUsed || 'unknown';

        trackResultFeedback(rating, platform, topic, modelUsed, 1);

        // Push background request
        try {
          await fetch('http://localhost:3001/api/feedback/magic-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searchId: 'client-session-' + Date.now(),
              platform: window.currentPlatform || 'instagram',
              topic: document.getElementById('search-input')?.value || 'general',
              modelUsed: window.lastMagicModelUsed || 'unknown',
              rating: rating
            })
          });
        } catch (err) {
          console.error('Failed to submit feedback');
        }
      });
    });
  }
}

function buildHashtagRow(hashtag, index) {
  const delay = Math.min(index * 25, 400);
  const rankClass = index < 3 ? ' top-3' : '';
  const hotIcon = hashtag.isHot ? '<span class="hashtag-hot">🔥</span>' : '';
  const scoreWidth = hashtag.aiScore || 0;

  return `
    <div class="hashtag-row" style="animation-delay: ${delay % 400}ms" data-tag="${hashtag.tag}">
      <span class="hashtag-rank${rankClass}">${hashtag.rank}</span>
      <div class="hashtag-info">
        <div class="hashtag-tag">${hashtag.tag}</div>
        <div class="hashtag-meta">
          <span class="hashtag-volume">${hashtag.volumeFormatted || formatVolume(hashtag.volume)}</span>
          <div class="hashtag-score-bar">
            <div class="hashtag-score-fill" style="width: ${scoreWidth}%"></div>
          </div>
          ${hotIcon}
        </div>
      </div>
      <button class="hashtag-copy-btn" data-copy="${hashtag.tag}" title="Copy ${hashtag.tag}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>
  `;
}

function attachCopyHandlers(container) {
  container.querySelectorAll('.hashtag-copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tag = btn.getAttribute('data-copy');
      await copyHashtag(tag);

      btn.classList.add('copied');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      }, 1500);
    });
  });
}

function formatVolume(num) {
  if (!num) return '';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

let loadingInterval;
let loadingStartMs = 0;

export function showSkeleton() {
  const skeleton = document.getElementById('skeleton-loader');
  const hashtagList = document.getElementById('hashtag-list');
  if (hashtagList) hashtagList.style.display = 'none';
  if (!skeleton) return;
  skeleton.classList.remove('hidden');

  const statusEl = document.getElementById('loading-status');
  const tipEl = document.getElementById('loading-tip');
  if (statusEl && tipEl) {
    loadingStartMs = Date.now();
    statusEl.textContent = "Connecting to AI...";
    const phrases = [
      "🐾 Sniffing out the best tags...",
      "🎾 Fetching your custom growth matrix...",
      "🧠 Analyzing creator signals...",
      "💡 Pro Tip: A strong hook in the first 3 seconds is crucial!",
      "🚀 Synthesizing Content Strategy...",
      "🐕 Did you know? Instagram favors 3-5 hyper-relevant hashtags.",
      "🦴 Extracting Trending Entities...",
      "📉 Pro Tip: Consistency beats virality when building an audience."
    ];
    const statusWords = ["#trending", "AI Search", "Analyzing", "Tagging", "Viral", "Metadata", "Scoping"];

    let i = 0;
    let ticks = 0;
    tipEl.textContent = phrases[0];

    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = setInterval(() => {
      ticks++;

      if (ticks % 2 === 0) {
        i = (i + 1) % phrases.length;
        tipEl.style.opacity = '0';
        setTimeout(() => {
          tipEl.textContent = phrases[i];
          tipEl.style.opacity = '1';
        }, 300);
      }

      if (ticks > 15) {
        statusEl.textContent = "Almost there...";
      } else {
        statusEl.textContent = statusWords[ticks % statusWords.length];
      }
    }, 1000);
  }
}

export function updateStats(count, lastUpdated, source) {
  const statsCount = document.getElementById('stats-count');
  const statsUpdated = document.getElementById('stats-updated');

  if (statsCount) statsCount.textContent = `${count} tags`;
  if (statsUpdated) {
    let executionTimeStr = '';
    if (loadingStartMs > 0) {
      const elapsedMs = Date.now() - loadingStartMs;
      executionTimeStr = ` • Generated in ${(elapsedMs / 1000).toFixed(1)}s`;
      loadingStartMs = 0; // reset
      if (loadingInterval) clearInterval(loadingInterval);
    }
    const ago = getTimeAgo(new Date(lastUpdated));
    const sourceLabel = source ? ` • ${source}` : '';
    statsUpdated.textContent = `Updated ${ago}${sourceLabel}${executionTimeStr}`;
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
