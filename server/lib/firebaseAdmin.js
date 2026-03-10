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
            // Ensure the private key handles newlines correctly
            const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: FIREBASE_PROJECT_ID,
                    clientEmail: FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                projectId: FIREBASE_PROJECT_ID
            });
            console.log('✅ Firebase Admin Initialized with Environment Variables');
        } catch (error) {
            console.error('❌ Firebase Admin Init Error:', error.message);
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
