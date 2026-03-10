// Quota Enforcer – tracks Magic Search usage per user
import admin, { db } from '../firebaseAdmin.js';

export async function quotaEnforcerMiddleware(req, res, next) {
    try {
        const userId = req.user?.uid;
        if (!userId || !db) return next();

        const userDocRef = db.collection('tagly_users').doc(userId);
        const user = await userDocRef.get();

        if (!user.exists) return next();

        const userData = user.data();
        const MAGIC_SEARCH_FREE_LIMIT = parseInt(process.env.MAGIC_SEARCH_FREE_LIMIT) || 10;
        const searchesUsed = userData.magicSearchesUsedThisMonth || 0;

        if (!userData.isPaidUser && searchesUsed >= MAGIC_SEARCH_FREE_LIMIT) {
            const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
            return res.status(403).json({
                error: 'QUOTA_EXCEEDED',
                message: 'You have used all 10 free Magic Searches this month.',
                showUpgradeModal: true,
                searchesUsed,
                resetDate: nextMonth.toISOString()
            });
        }

        next();
    } catch (err) {
        console.error('Quota Enforcement Error:', err);
        next(); // Fail open
    }
}

export async function incrementMagicSearchCount(userId) {
    if (!userId || !db) return;
    try {
        await db.collection('tagly_users').doc(userId).set({
            searchesUsedThisMonth: admin.firestore.FieldValue.increment(1),
            magicSearchResetDate: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.error('Failed to increment magic search count:', err);
    }
}
