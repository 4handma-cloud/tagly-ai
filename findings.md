# 🔎 Technical Findings & Research (findings.md)

This document records all architectural decisions, discovered bugs, framework limitations, and research outcomes.

## Technical Baseline (March 2026)
*   **Current Architecture**: Tagly AI uses a vanilla JS frontend with Vite, connected to a Node.js/Express backend.
*   **Mobile App Strategy**: Capacitor.js is used to wrap the Vite output into an Android release bundle.
*   **Hosting Context**: The backend is hosted on a free Render tier, meaning it spins down after 15 minutes of inactivity. The PWA/Service Worker is essential to mask this ~50s cold start latency from the user.
*   **Error Prevention**: Due to strict instructions, global error handlers must catch unhandled rejections to prevent complete blank screens on Android web views.
