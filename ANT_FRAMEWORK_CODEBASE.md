# Tagly AI: The A.N.T. Framework & Core Codebase

This document contains the primary architectural constitution (Protocol 0 files) and the core execution files that implement the A.N.T. framework for Tagly AI. It is designed to be provided to an AI (like Gemini or Claude) to quickly understand the project's strict constraints, networking model, and error handling philosophies.

---

## Part 1: The Constitution (A.N.T. Architecture)

The A.N.T. (AI, Network, Terminal) architecture enforces a strict decoupling of concerns with aggressive error boundaries to prevent "White Screen of Death" scenarios on Android web wrappers (Capacitor.js).

### `gemini.md` (Project Memory & Constraints)
```markdown
# 🧠 Project Memory: A.N.T. Architecture Constitution

## 🌟 North Star
To deliver the most accurate, zero-latency hashtag recommendations wrapped in a premium UX that guarantees algorithm dominance.

## 💻 Tech Stack (The Build)
*   **Frontend**: Vite + Vanilla JavaScript + CSS (Strictly NO heavy frameworks like React/Vue for maximum speed)
*   **Backend**: Node.js + Express (Hosted on Render)
*   **Mobile Wrapper**: Capacitor.js (for Android `.aab` / `.apk`)
*   **Real-Time Data**: `socket.io` for live updates
*   **Offline Mode**: Native Service Workers (`sw.js`)

## 🛡️ Self-Healing & Crash Protection Rules
*   **No Happy Path Assumptions**: All `fetch()` requests MUST be wrapped in an `AbortController`.
*   **Timeouts**: 10s standard, 25s for AI processes.
*   **Global Error Boundaries**: Trapped via `window.onerror`, displaying a graceful fallback UI.

## 🧱 A.N.T. Architecture Principles (3-Layer)
1.  **AI (A):** The core intelligence brain powering Tagly AI using OpenAI vision and prompt evaluation logic cleanly separated from the UI.
2.  **Network (N):** Real-time web-socket events, aggressive timeout policies, and background sync logic.
3.  **Terminal (T):** The user interface (Vanilla HTML/CSS/JS) decoupled from business logic. State flows smoothly without heavy frontend frameworks.
```

---

## Part 2: Implementation of the "Network" Layer (N)

The Network layer is responsible for enforcing the "No Happy Path" rules via `AbortController` and custom timeouts.

### `src/utils/api.js` (The Timeout Wrapper)
This file guarantees that no network request will hang indefinitely, which is critical for Capacitor mobile apps running on spotty connections.

```javascript
// API Client + WebSocket utilities

const API_BASE = 'https://taglyai.onrender.com/api';
const TIMEOUT_MS = 10000; // 10 second timeout for all standard API requests

// The Core A.N.T. Network Guardian
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

// Example Implementation: Image AI (Requires longer timeout)
export async function imageToTag(file, platform) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('platform', platform);

    const res = await fetchWithTimeout(`${API_BASE}/hashtags/image-to-tag`, {
        method: 'POST',
        body: formData,
        timeout: 25000 // Give OpenAI vision analysis more time (25 seconds)
    });
    const data = await res.json();
    return data;
}

// ... other endpoints (magicSearch, fetchHashtags) follow the exact same pattern
```

---

## Part 3: Implementation of the "Terminal" Layer (T)

The Terminal layer connects the UI to the Network layer and implements the Global Error Boundaries defined in the Protocol 0 Constitution.

### `src/main.js` (Core Application & Error Boundaries)
This file initializes the app, connects to Socket.io for live updates, and sets up the crash protection nets.

```javascript
// Tagly AI – Main Application Entry Point

let state = {
    currentPlatform: 'tiktok',
    hashtags: [],
    searchQuery: '',
    isLoading: false,
    isMagicMode: false,
    socket: null,
};

async function init() {
    console.log('🏷️ Tagly AI initializing...');

    // 1. Setup A.N.T Global Error Boundaries IMMEDIATELY
    initErrorBoundaries();

    // 2. Setup Offline tracking (UI updates when connection drops)
    initOfflineTracking();

    // ... widget initialization ...

    // 3. Register Service Worker for true Offline Support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }

    // 4. Load initial data & Connect WebSocket
    await loadHashtags();
    connectWebSocket();
}

// ─── Global Error Boundaries (The Safety Net) ───────────────────────────
function initErrorBoundaries() {
    // Catches synchronous UI rendering errors
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        console.error('Crash Protection Caught Error:', msg, error);
        showCrashUI();
        return false;
    };

    // Catches asynchronous API/Timeout errors
    window.addEventListener('unhandledrejection', function (event) {
        console.error('Crash Protection Unhandled Promise:', event.reason);
        showCrashUI();
    });
}

// The Graceful Degradation UI
function showCrashUI() {
    const listContainer = document.getElementById('hashtag-list');
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.classList.add('hidden');
    
    // Replace the UI with a friendly error state instead of a white screen
    if (listContainer && listContainer.innerHTML.indexOf('empty-state') === -1) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon" style="color:#ff6b35;">💥</div>
                <p class="empty-state-text" style="color:#ff6b35; margin-bottom: 8px;">Oops! Something went wrong.</p>
                <p style="font-size: 12px; color: var(--text-secondary); max-width: 300px; margin: 0 auto; margin-bottom: 16px;">
                    We trapped an unexpected error to keep the app running.
                </p>
                <button class="modal-cta" onclick="window.location.reload()">Reload App</button>
            </div>
        `;
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
```

---

## Part 4: Backend Context

### `server/server.js` (Express + Socket.io)
The lightweight backend that serves the real-time websocket connections to support the A.N.T architecture.

```javascript
import express from 'express';
import { Server } from 'socket.io';
// ... imports ...

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: ['http://localhost:5173', 'http://localhost:3000'] }
});

// Serve frontend and handle API routes
app.use('/api', hashtagRoutes);
app.use(express.static(path.join(__dirname, '../dist')));

// WebSocket Connections for Real-Time Updates (The 'N' in A.N.T.)
io.on('connection', (socket) => {
    socket.emit('connected', {
        message: 'Connected to Tagly AI',
        aiEnabled: isAIAvailable()
    });

    socket.on('subscribe:platform', (platform) => {
        socket.emit('hashtags:data', {
            platform,
            data: getTopHashtags(platform)
        });
    });
});
```
