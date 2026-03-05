// Hashtag List Component – Supports both regular and categorized (Magic Search) display

import { copyHashtag, copyMultipleTags } from '../utils/clipboard.js';

export function renderHashtagList(container, hashtags) {
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) skeleton.classList.add('hidden');

  if (!hashtags || hashtags.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p class="empty-state-text">No hashtags found. Try a different search.</p>
      </div>
    `;
    return;
  }

  const html = hashtags.map((hashtag, index) => buildHashtagRow(hashtag, index)).join('');
  container.innerHTML = html;
  attachCopyHandlers(container);
}

/**
 * Render categorized Magic Search results
 */
export function renderCategorizedHashtags(container, categories, analysis) {
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) skeleton.classList.add('hidden');

  let html = '';

  // Analysis banner
  if (analysis) {
    html += `<div class="magic-analysis">
      <span class="magic-analysis-icon">🔮</span>
      <span class="magic-analysis-text">${analysis}</span>
    </div>`;
  }

  // Render each category
  const categoryOrder = ['high_reach', 'niche', 'regional', 'low_competition'];

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

  container.innerHTML = html;

  // Attach individual copy handlers
  attachCopyHandlers(container);

  // Attach category copy handlers
  container.querySelectorAll('.category-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const catKey = btn.getAttribute('data-category');
      const cat = categories[catKey];
      if (cat && cat.tags) {
        await copyMultipleTags(cat.tags.map(t => t.tag));
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg> Copied!`;
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy ${cat.tags.length}`;
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  });
}

function buildHashtagRow(hashtag, index) {
  const delay = Math.min(index * 25, 400);
  const rankClass = index < 3 ? ' top-3' : '';
  const hotIcon = hashtag.isHot ? '<span class="hashtag-hot">🔥</span>' : '';
  const scoreWidth = hashtag.aiScore || 0;

  return `
    <div class="hashtag-row" style="animation-delay: ${delay}ms" data-tag="${hashtag.tag}">
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

export function showSkeleton() {
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) skeleton.classList.remove('hidden');
}

export function updateStats(count, lastUpdated, source) {
  const statsCount = document.getElementById('stats-count');
  const statsUpdated = document.getElementById('stats-updated');

  if (statsCount) statsCount.textContent = `${count} hashtags`;
  if (statsUpdated) {
    const ago = getTimeAgo(new Date(lastUpdated));
    const sourceLabel = source ? ` • ${source}` : '';
    statsUpdated.textContent = `Updated ${ago}${sourceLabel}`;
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
