// API Client + WebSocket utilities

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://taglyai.onrender.com/api';
const TIMEOUT_MS = 35000; // 35 second timeout for AI generation

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = TIMEOUT_MS } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });

    clearTimeout(id);
    return response;
}

export async function fetchPlatforms() {
    const res = await fetchWithTimeout(`${API_BASE}/platforms`);
    const data = await res.json();
    return data.data;
}

export async function fetchHashtags(platform, limit = 30) {
    const res = await fetchWithTimeout(`${API_BASE}/hashtags/${platform}?limit=${limit}`);
    const data = await res.json();
    return data;
}

export async function searchHashtags(platform, query, limit = 30) {
    const res = await fetchWithTimeout(`${API_BASE}/hashtags/${platform}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        timeout: 25000 // Give basic topic search more time to prevent 500 errors if GPT is slightly slow
    });
    const data = await res.json();
    return data;
}

export async function magicSearch(payload) {
    const res = await fetchWithTimeout(`${API_BASE}/hashtags/magic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 60000 // Give magic search more time since it uses OpenAI Phase 2 chain-of-thought
    });
    const data = await res.json();
    return data;
}

export async function imageToTag(file, platform) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('platform', platform);

    const res = await fetchWithTimeout(`${API_BASE}/hashtags/image-to-tag`, {
        method: 'POST',
        body: formData,
        timeout: 25000 // Give image analysis more time
    });
    const data = await res.json();
    return data;
}
