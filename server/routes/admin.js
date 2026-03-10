import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== 'Bearer fayekrana') {
            return res.status(403).json({ error: 'Unauthorized access.' });
        }

        if (admin.apps.length === 0) {
            // If running locally without GOOGLE_APPLICATION_CREDENTIALS, return mock data to prevent crash
            return res.status(200).json({
                users: [
                    { email: 'local@tagly.ai', displayName: 'Local Tester', subscriptionTier: 'growth', searchesUsedThisMonth: 12, launchMode: true, createdAt: new Date().toISOString() },
                    { email: 'demo@tagly.ai', displayName: 'Demo User', subscriptionTier: 'creator', searchesUsedThisMonth: 5, launchMode: false, createdAt: new Date().toISOString() }
                ],
                mock: true
            });
        }

        const db = admin.firestore();
        const snapshot = await db.collection('tagly_users').get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        res.json({ users });
    } catch (error) {
        console.error('Admin Fetch Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
