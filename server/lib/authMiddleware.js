import { auth } from './firebaseAdmin.js';

export async function firebaseAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided — allow request but req.user will be undefined
        return next();
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        if (auth) {
            const decodedToken = await auth.verifyIdToken(idToken);
            req.user = decodedToken;
        }
        next();
    } catch (error) {
        console.error('🔒 Firebase Auth Error:', error.message);
        // We still allow it to find out if it's a guest, but you could block here if you wanted.
        // For Magic Search, we handle guest vs user in the route.
        next();
    }
}
