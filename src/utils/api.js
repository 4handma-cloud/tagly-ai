// API Client + WebSocket utilities

const API_BASE = '/api';

export async function fetchPlatforms() {
    const res = await fetch(`${API_BASE}/platforms`);
    const data = await res.json();
    return data.data;
}

export async function fetchHashtags(platform, limit = 100) {
    const res = await fetch(`${API_BASE}/hashtags/${platform}?limit=${limit}`);
    const data = await res.json();
    return data;
}

export async function searchHashtags(platform, query) {
    const res = await fetch(`${API_BASE}/hashtags/${platform}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data;
}

export async function magicSearch(content, platform) {
    const res = await fetch(`${API_BASE}/hashtags/magic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform }),
    });
    const data = await res.json();
    return data;
}

export async function imageToTag(file, platform) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('platform', platform);

    const res = await fetch(`${API_BASE}/hashtags/image-to-tag`, {
        method: 'POST',
        body: formData,
    });
    const data = await res.json();
    return data;
}
