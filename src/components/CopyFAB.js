// Copy FAB Component – "Copy Top 30" floating action button

import { copyMultipleTags } from '../utils/clipboard.js';
import { trackHashtagsCopied } from '../lib/analytics/taglyAnalytics.js';

let currentHashtags = [];

export function updateFABData(hashtags) {
    currentHashtags = hashtags;
}

export function initCopyFAB() {
    const fab = document.getElementById('copy-fab');
    if (!fab) return;

    fab.addEventListener('click', async () => {
        const top30 = currentHashtags.slice(0, 30).map(h => h.tag || h);
        if (top30.length === 0) return;

        await copyMultipleTags(top30);
        trackHashtagsCopied(window.currentPlatform || 'instagram', 'general', 'all');

        // Visual feedback
        fab.classList.add('copied');
        const originalHTML = fab.innerHTML;
        fab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span>Copied!</span>
    `;

        setTimeout(() => {
            fab.classList.remove('copied');
            fab.innerHTML = originalHTML;
        }, 2000);
    });
}
