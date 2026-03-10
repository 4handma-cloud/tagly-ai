import { Router } from 'express';
import { saveFeedback } from '../lib/ai/satisfactionTracker.js';

const router = Router();

router.post('/magic-search', async (req, res) => {
    try {
        const { searchId, platform, topic, modelUsed, rating } = req.body;
        const userId = req.user?.uid || 'anonymous'; // Ideally parsed from token middleware

        if (!rating || !['positive', 'negative'].includes(rating)) {
            return res.status(400).json({ success: false, error: 'Invalid rating' });
        }

        await saveFeedback(userId, searchId, platform, topic, modelUsed, rating);

        res.json({ success: true });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ success: false, error: 'Failed to save feedback.' });
    }
});

export default router;
