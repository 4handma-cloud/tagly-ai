import fs from 'fs';
import path from 'path';

// AI Generated image paths
const iconSrc = 'C:\\Users\\91700\\.gemini\\antigravity\\brain\\b542084b-7ef8-4002-a362-ec11b7d9ecb5\\tagly_app_icon_1772828796440.png';
const splashSrc = 'C:\\Users\\91700\\.gemini\\antigravity\\brain\\b542084b-7ef8-4002-a362-ec11b7d9ecb5\\tagly_splash_screen_1772828813065.png';

console.log('⏳ Injecting icons and splash screens directly into Android resources...');

try {
    // 1. Inject Android Icons
    const mipmaps = ['hdpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    mipmaps.forEach(dpi => {
        const dir = path.join('android', 'app', 'src', 'main', 'res', `mipmap-${dpi}`);
        if (fs.existsSync(dir)) {
            fs.copyFileSync(iconSrc, path.join(dir, 'ic_launcher.png'));
            fs.copyFileSync(iconSrc, path.join(dir, 'ic_launcher_foreground.png'));
            fs.copyFileSync(iconSrc, path.join(dir, 'ic_launcher_round.png'));
        }
    });

    // 2. Inject Android Splash Screens
    const drawables = ['land-hdpi', 'land-mdpi', 'land-xhdpi', 'land-xxhdpi', 'land-xxxhdpi', 'port-hdpi', 'port-mdpi', 'port-xhdpi', 'port-xxhdpi', 'port-xxxhdpi'];
    drawables.forEach(dpi => {
        const dir = path.join('android', 'app', 'src', 'main', 'res', `drawable-${dpi}`);
        if (fs.existsSync(dir)) {
            fs.copyFileSync(splashSrc, path.join(dir, 'splash.png'));
        }
    });

    const baseSplash = path.join('android', 'app', 'src', 'main', 'res', 'drawable', 'splash.png');
    if (fs.existsSync(baseSplash)) {
        fs.copyFileSync(splashSrc, baseSplash);
    }

    // 3. Inject PWA / Web Icons
    fs.copyFileSync(iconSrc, path.join('public', 'pwa-192x192.png'));
    fs.copyFileSync(iconSrc, path.join('public', 'pwa-512x512.png'));
    fs.copyFileSync(iconSrc, path.join('public', 'apple-touch-icon.png'));

    console.log('✅ PERFECT! All assets successfully applied without using the Capacitor tool.');
} catch (err) {
    console.error('❌ Error copying files:', err.message);
}
