// API Client + WebSocket utilities
import { auth } from './firebase.js';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://taglyai.onrender.com/api';

const TIMEOUT_MS = 35000; // 35 second timeout for AI generation

async function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

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
        timeout: 25000
    });
    const data = await res.json();
    return data;
}

export async function magicSearch(payload) {
    const headers = await getAuthHeaders();
    const res = await fetchWithTimeout(`${API_BASE}/hashtags/magic-search`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        timeout: 60000
    });
    const data = await res.json();
    return data;
}

export async function imageToTag(file, platform) {
    const user = auth.currentUser;
    const headers = {};
    if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('platform', platform);

    const res = await fetchWithTimeout(`${API_BASE}/hashtags/image-to-tag`, {
        method: 'POST',
        headers: headers,
        body: formData,
        timeout: 25000
    });
    const data = await res.json();
    return data;
}
