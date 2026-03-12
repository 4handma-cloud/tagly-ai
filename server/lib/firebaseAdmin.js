import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
} = process.env;

if (!admin.apps.length) {
    if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
        try {
            // Clean up credentials (strip surrounding quotes, spaces, and handle mangled newlines)
            const cleanProjectId = FIREBASE_PROJECT_ID.trim().replace(/^["']|["']$/g, '');
            const cleanClientEmail = FIREBASE_CLIENT_EMAIL.trim().replace(/^["']|["']$/g, '');
            let cleanPrivateKey = FIREBASE_PRIVATE_KEY.trim().replace(/^["']|["']$/g, '');
            
            // Normalize all literal "\n" to actual newlines
            cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
            
            // Ensure no extra \r or weird line endings
            cleanPrivateKey = cleanPrivateKey.replace(/\r/g, '');

            // Diagnostics (masked)
            const keyHeader = cleanPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----');
            const keyFooter = cleanPrivateKey.includes('-----END PRIVATE KEY-----');
            const keyLen = cleanPrivateKey.length;
            
            console.log(`[Firebase Diagnostics] Project: ${cleanProjectId}`);
            console.log(`[Firebase Diagnostics] Email: ${cleanClientEmail}`);
            console.log(`[Firebase Diagnostics] Key Header OK: ${keyHeader} / Footer OK: ${keyFooter} / Length: ${keyLen}`);

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: cleanProjectId,
                    clientEmail: cleanClientEmail,
                    privateKey: cleanPrivateKey,
                }),
                projectId: cleanProjectId
            });
            console.log(`✅ Firebase Admin Successfully Initialized`);
        } catch (error) {
            console.error('❌ Firebase Admin Initialization CRITICAL FAILURE:', error.stack);
        }
    } else {
        console.warn('⚠️ Missing FIREBASE_PROJECT_ID, CLIENT_EMAIL or PRIVATE_KEY. Firebase Admin running in limited/fallback mode.');
        try {
            admin.initializeApp(); // Fallback to ADC
        } catch (e) {
            console.warn('⚠️ ADC Fallback failed.');
        }
    }
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

export { admin as default, db, auth };
