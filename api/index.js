import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import Routes (NOTE: .js extension is required in ESM)
import userRoute from './routes/users.js';
import productRoute from './routes/products.js';
import messageRoute from './routes/messages.js';
import reviewRoute from './routes/reviews.js';
import authRoute from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not defined.");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("✅ Connected to MongoDB"))
        .catch(err => console.error("❌ MongoDB connection error:", err));
}

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/messages', messageRoute);
app.use('/api/reviews', reviewRoute);

app.get('/', (req, res) => {
    res.send('SecondLife API is running (ESM)!');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Export for Vercel
export default app;

// Local Server Start
// Check if file is run directly using import.meta.url
const entryFile = process.argv[1];

if (entryFile === __filename) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally on port ${PORT}`);
    });
}
