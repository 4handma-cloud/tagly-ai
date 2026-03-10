import admin from 'firebase-admin';

export async function saveFeedback(userId, searchId, platform, topic, modelUsed, rating) {
    try {
        const db = admin.firestore();
        await db.collection('feedback').add({
            userId,
            searchId,
            platform,
            topic,
            modelUsed,
            rating, // 'positive' or 'negative'
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Check if 3 consecutive negative ratings on the exact same topic exist
        const recentNegative = await getRecentNegativeFeedback(userId, topic);
        if (recentNegative >= 3) {
            await triggerClaudeRegeneration(userId, platform, topic);
        }
    } catch (err) {
        console.warn('Failed saving feedback:', err.message);
    }
}

async function getRecentNegativeFeedback(userId, topic) {
    try {
        const db = admin.firestore();
        const querySnapshot = await db.collection('feedback')
            .where('userId', '==', userId)
            .where('topic', '==', topic)
            .orderBy('timestamp', 'desc')
            .limit(3)
            .get();

        if (querySnapshot.empty) return 0;

        let count = 0;
        querySnapshot.forEach(doc => {
            if (doc.data().rating === 'negative') {
                count++;
            }
        });

        // Only return 3 if ALL 3 recent were negative
        return count === 3 ? 3 : count;
    } catch (err) {
        console.warn('Failed getting recent feedback:', err.message);
        return 0;
    }
}

async function triggerClaudeRegeneration(userId, platform, topic) {
    // Can be linked to the sequencer logic later, just a stub for now.
    console.log(`♻️ Auto-regenerating with Claude due to 3 negative ratings for topic: ${topic}`);
}
