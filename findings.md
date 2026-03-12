# 🔍 Technical Findings & Research (findings.md)

### Firestore Authentication (Render Deployment)
- **Bug identified**: Server logs showed `16 UNAUTHENTICATED` errors for Firestore caching.
- **Root Cause**: Environment variables (Project ID, Private Key) often contain surrounding quotes or mangled newlines when copied from local `.env` files to the Render dashboard.
- **Fix**: Modified `server/lib/firebaseAdmin.js` to automatically `.trim()` and `.replace(/^["']|["']$/g, '')` all credentials before initializing the Admin SDK.

### UI & UX Refinements
- **Magic Search Modal**:
    - Problem: Full-screen modal trapped users, content cut off on small screens.
    - Solution: Implemented a centered 480px popup for desktop and a standard "Bottom Sheet" for mobile with slide-up animations. Added an explicit ✕ close button.
- **Hero Section**: 
    - Goal: Save vertical space while maintaining interactivity.
    - Result: Segment height reduced to 140px. Orbiting logos replaced with a static "dice grid" (2x4) anchored left below the labels.

### AI Search Logic
- Magic Search now cycles through DeepSeek R1, Qwen 2.5, Gemini Pro, and Llama 3.3 for high-fidelity responses.
- Sequential searching ensures diverse tag results even with repeated topics.
- Fallback logic triggers `llama-3.3-70b` if specialized models fail.
