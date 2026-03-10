// Quota Enforcer – tracks Magic Search usage per user
// Skips enforcement if Firebase Admin isn't initialized (local dev)

export async function quotaEnforcerMiddleware(req, res, next) {
    try {
        const userId = req.user?.uid;
        // If no auth middleware is present, skip enforcement and allow
        if (!userId) {
            return next();
        }

        let db = null;
        try {
            const adminModule = await import('firebase-admin');
            const admin = adminModule.default;
            if (admin.apps && admin.apps.length > 0) {
                db = admin.firestore();
            }
        } catch { }

        // If Firebase isn't initialized, fail open (allow request)
        if (!db) return next();

        const userDocRef = db.collection('users').doc(userId);
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
    if (!userId) return;
    try {
        const adminModule = await import('firebase-admin');
        const admin = adminModule.default;
        if (!admin.apps || admin.apps.length === 0) return;
        const db = admin.firestore();
        await db.collection('users').doc(userId).set({
            magicSearchesUsedThisMonth: admin.firestore.FieldValue.increment(1),
            magicSearchResetDate: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.error('Failed to increment magic search count:', err);
    }
}
