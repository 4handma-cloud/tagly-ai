const fs = require('fs');
const path = require('path');

const iconSrc = 'C:\\Users\\91700\\.gemini\\antigravity\\brain\\b542084b-7ef8-4002-a362-ec11b7d9ecb5\\tagly_app_icon_1772828796440.png';
const splashSrc = 'C:\\Users\\91700\\.gemini\\antigravity\\brain\\b542084b-7ef8-4002-a362-ec11b7d9ecb5\\tagly_splash_screen_1772828813065.png';

if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets', { recursive: true });
}

try {
    // Copy for Capacitor Assets Generator
    fs.copyFileSync(iconSrc, 'assets/icon.png');
    fs.copyFileSync(splashSrc, 'assets/splash.png');

    // Copy for Vite PWA / Web App
    fs.copyFileSync(iconSrc, 'public/pwa-192x192.png');
    fs.copyFileSync(iconSrc, 'public/pwa-512x512.png');
    fs.copyFileSync(iconSrc, 'public/apple-touch-icon.png');

    console.log('✅ AI-generated Icon & Splash screen have been copied into your project.');
    console.log('👉 Next Step: Run "npx @capacitor/assets generate" in your terminal to create all Android icon sizes.');
} catch (err) {
    console.error('Error copying files:', err.message);
}
