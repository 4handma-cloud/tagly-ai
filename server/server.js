// Tagly AI – Express + Socket.io Server

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import hashtagRoutes from './routes/hashtags.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import feedbackRoutes from './routes/feedback.js';
import { initScheduler } from './services/scheduler.js';
import { getTopHashtags, getAllPlatforms } from './services/hashtagEngine.js';
import { isAIAvailable } from './services/aiScoring.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

// Webhook route needs raw body for Stripe signature validation, so configure it before global parsers
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', hashtagRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// Serve Static Frontend (Production Build)
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    // Exclude API routes from fallback
    if (!req.path.startsWith('/api')) {
        if (req.path === '/admin' || req.path === '/admin.html') {
            return res.sendFile(path.join(__dirname, '../dist/admin.html'));
        }
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
});

// WebSocket Connections
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current data immediately on connect
    socket.emit('connected', {
        message: 'Connected to Tagly AI',
        platforms: getAllPlatforms(),
        aiEnabled: isAIAvailable(),
        timestamp: new Date().toISOString()
    });

    // Handle platform subscription
    socket.on('subscribe:platform', (platform) => {
        const hashtags = getTopHashtags(platform);
        socket.emit('hashtags:data', {
            platform,
            data: hashtags,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Initialize scheduler with Socket.io
initScheduler(io);

// Start server
const aiMode = isAIAvailable() ? '🤖 GPT-5.2 (LIVE)' : '📦 Simulated';
server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║      🏷️  TAGLY AI – Server Running         ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  🌐 API:       http://localhost:${PORT}       ║`);
    console.log('║  🔌 WebSocket: Socket.io enabled           ║');
    console.log('║  ⏰ Refresh:   Every 15 minutes             ║');
    console.log('║  📊 Platforms: 9                            ║');
    console.log(`║  🧠 AI Mode:   ${aiMode.padEnd(25)}  ║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
});

export { io };
