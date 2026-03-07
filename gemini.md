# 🧠 Project Memory: A.N.T. Architecture Constitution (gemini.md)

## 🌟 North Star
To deliver the most accurate, zero-latency hashtag recommendations to influencers and businesses across 9 major platforms, wrapped in a premium UX that guarantees algorithm dominance.

## 💻 Tech Stack (The Build)
*   **Frontend (The UI):** Vite + Vanilla JavaScript + CSS
*   **Backend (The Kitchen):** Node.js + Express (Hosted on Render)
*   **Mobile Wrapper:** Capacitor.js (for Android `.aab` / `.apk`)
*   **Real-Time Data:** `socket.io` for live updates
*   **AI Engine:** OpenAI `gpt-4-vision-preview` (for image analysis) and `gpt-4o-mini` (for Magic Search)
*   **Offline Support:** Native Service Workers (`sw.js`)

## 🛡️ Self-Healing & Crash Protection Rules
*   **No Happy Path Assumptions**: All `fetch()` requests MUST be wrapped in an `AbortController`.
*   **Timeouts**: 10s standard, 25s for AI processes (in `src/utils/api.js`).
*   **Global Error Boundaries**: Trapped in `src/main.js` (`window.onerror`), displaying a graceful fallback UI to prevent "white screen of death" crashes.
*   **Offline First**: Service worker instantly serves cached PWA assets and previous fetched data.

## 🧱 A.N.T. Architecture Principles (3-Layer)
1.  **AI (A):** The core intelligence brain powering Tagly AI using OpenAI vision and prompt evaluation logic cleanly separated from the UI.
2.  **Network (N):** Real-time web-socket events, aggressive timeout policies, and background sync logic.
3.  **Terminal (T):** The user interface (Vanilla HTML/CSS/JS) decoupled from business logic. State flows smoothly without heavy frontend frameworks.

## 🛑 Halt Gate Conditions
**Before executing any changes:**
1. Update `task_plan.md` with intended tasks.
2. Record any critical insights in `findings.md`.
3. Read the current architecture constraints to ensure no violations.
4. Execute changes.
5. Update `progress.md` with a summary of what was completed.
