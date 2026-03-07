// API Client + WebSocket utilities

const API_BASE = 'https://taglyai.onrender.com/api';
const TIMEOUT_MS = 10000; // 10 second timeout for all API requests

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

export async function fetchHashtags(platform, limit = 100) {
    const res = await fetchWithTimeout(`${API_BASE}/hashtags/${platform}?limit=${limit}`);
    const data = await res.json();
    return data;
}

export async function searchHashtags(platform, query) {
    const res = await fetchWithTimeout(`${API_BASE}/hashtags/${platform}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data;
}

export async function magicSearch(content, platform) {
    const res = await fetchWithTimeout(`${API_BASE}/hashtags/magic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform }),
        timeout: 20000 // Give magic search more time since it uses OpenAI
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
