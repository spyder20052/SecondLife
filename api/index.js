import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Routes — imported from server/ (NOT api/routes) to stay within 1 serverless function
import userRoute from '../server/routes/users.js';
import productRoute from '../server/routes/products.js';
import messageRoute from '../server/routes/messages.js';
import reviewRoute from '../server/routes/reviews.js';
import authRoute from '../server/routes/auth.js';
import analyticsRoute from '../server/routes/analytics.js';
import waitlistRoute from '../server/routes/waitlist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not defined.');
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
}

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/messages', messageRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/waitlist', waitlistRoute);

app.get('/', (req, res) => res.send('SecondLife API is running!'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

export default app;

// Local dev start
const entryFile = process.argv[1];
if (entryFile === __filename) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
