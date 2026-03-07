# Tagly AI 🚀

Tagly AI is a professional, high-performance web and Android application designed to provide real-time hashtag intelligence for content creators. Built with a stunning dark theme and sophisticated micro-animations, it offers dynamic hashtag generation powered by OpenAI Vision and real-time social platform APIs.

## 🏗️ The A.N.T. Architecture (Constitution)

This document acts as the primary "Project Memory" and single source of truth for the Tagly AI application constraints, stack, and maintenance procedures.

### 🌟 North Star
To deliver the most accurate, zero-latency hashtag recommendations to influencers and businesses across 9 major platforms, wrapped in a premium UX that guarantees algorithm dominance.

### 💻 Tech Stack (The Build)
*   **Frontend (The UI):** Vite + Vanilla JavaScript + CSS (No heavy frameworks for maximum speed).
*   **Backend (The Kitchen):** Node.js + Express (Hosted on Render).
*   **Mobile Wrapper:** Capacitor.js (Compiles the Vite web app into a native Android `.aab` / `.apk`).
*   **Real-Time Data:** `socket.io` for live updates.
*   **AI Engine:** OpenAI `gpt-4-vision-preview` (for image analysis) and `gpt-4o-mini` (for Magic Search).
*   **Offline Support:** Native Service Workers (`sw.js`).

---

## ⚙️ How to Maintain & Update (The Runbook)

### 1. Developing Locally
If you need to make changes to the app's design or logic, you must run both the frontend and backend simultaneously.

**Start the Backend (Terminal 1):**
\`\`\`bash
cd server
npm start
# Server runs on http://localhost:3001
\`\`\`

**Start the Frontend (Terminal 2):**
\`\`\`bash
npm run dev
# App runs on http://localhost:5173
\`\`\`

*Note: You must have a `.env` file in the `server` folder containing your `OPENAI_API_KEY`.*

### 2. Updating the Android App (Production Handoff)
Whenever you change the JavaScript or CSS code and want those changes to reflect in the Google Play Store Android app:

1.  **Build the Web Assets:**
    \`\`\`bash
    npm run build
    \`\`\`
2.  **Sync with Capacitor (Move to Android folder):**
    \`\`\`bash
    npx cap copy android
    \`\`\`
3.  **Generate the Release Bundle (.aab):**
    \`\`\`bash
    cd android
    gradlew bundleRelease
    \`\`\`
4.  Upload the resulting file from `android/app/build/outputs/bundle/release/app-release.aab` to the Google Play Console.

### 3. Deploying the Backend (Render.com)
The backend is mapped to a GitHub repository and deployed to Render.
*   **Live URL:** `https://taglyai.onrender.com`
*   **Note:** The free tier of Render spins down the server after 15 minutes of inactivity. The first request after entering sleep mode will take ~50 seconds to resolve. Upgrade to a paid plan ($7/mo) to remove this delay.

---

## 🛡️ Self-Healing & Crash Protection
The architecture implements strict "No Happy Path Assumptions":
*   **API Timeouts:** All `fetch()` requests are wrapped in an `AbortController` (10s standard, 25s for AI processes) inside `src/utils/api.js`.
*   **Global Error Boundaries:** Prevent "white screen of death" crashes. Trapped in `src/main.js` (`window.onerror`), displaying a graceful fallback UI.
*   **Offline Mode:** Service worker instantly serves cached PWA assets and previous hashtag fetches while displaying a non-intrusive "No Internet" toast notification.
