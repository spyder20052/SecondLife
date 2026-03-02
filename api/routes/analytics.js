import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Message from '../models/Message.js';
import Review from '../models/Review.js';

const router = express.Router();

/**
 * PMF Cohort Analysis
 * Calculates retention by cohort month.
 * A user is "active" in month N after registration if they:
 * - posted a product, OR
 * - sent a message, OR
 * - left a review
 * within that calendar month.
 */
router.get('/pmf-cohorts', async (req, res) => {
    try {
        // Fetch all users sorted by creation date
        const users = await User.find({}, { uid: 1, createdAt: 1 }).lean();

        if (!users.length) {
            return res.json({ cohorts: [], generatedAt: new Date() });
        }

        // Build a map: uid -> cohort month key (YYYY-MM)
        const userCohortMap = {};
        const cohortMap = {}; // key: "YYYY-MM" -> array of uids

        users.forEach(u => {
            const d = new Date(u.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            userCohortMap[u.uid] = { cohortKey: key, registeredAt: d };
            if (!cohortMap[key]) cohortMap[key] = [];
            cohortMap[key].push(u.uid);
        });

        // Fetch all activity events (uid + date)
        // Products posted
        const products = await Product.find({}, { sellerId: 1, createdAt: 1 }).lean();
        // Messages sent
        const messages = await Message.find({}, { senderId: 1, timestamp: 1 }).lean();
        // Reviews posted
        const reviews = await Review.find({}, { reviewerId: 1, createdAt: 1 }).lean();

        // Build activity map: uid -> Set of "YYYY-MM" months where they were active
        const activityMap = {}; // uid -> Set<"YYYY-MM">

        const addActivity = (uid, date) => {
            if (!uid || !date) return;
            const d = new Date(date);
            if (isNaN(d)) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!activityMap[uid]) activityMap[uid] = new Set();
            activityMap[uid].add(key);
        };

        products.forEach(p => addActivity(p.sellerId, p.createdAt));
        messages.forEach(m => addActivity(m.senderId, m.timestamp));
        reviews.forEach(r => addActivity(r.reviewerId, r.createdAt));

        // Also treat the registration month itself as active (M0)
        users.forEach(u => addActivity(u.uid, u.createdAt));

        // Compute cohorts sorted by date
        const sortedCohortKeys = Object.keys(cohortMap).sort();
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const cohorts = sortedCohortKeys.map(cohortKey => {
            const uids = cohortMap[cohortKey];
            const totalUsers = uids.length;

            // Parse cohort start month
            const [cy, cm] = cohortKey.split('-').map(Number);
            const cohortStart = new Date(cy, cm - 1, 1);

            // Determine how many months since this cohort to today
            const diffMonths = (today.getFullYear() - cy) * 12 + (today.getMonth() - (cm - 1));

            // Build retention array M0..Mn
            const retention = [];
            for (let monthOffset = 0; monthOffset <= diffMonths; monthOffset++) {
                const targetDate = new Date(cy, cm - 1 + monthOffset, 1);
                const targetKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

                // Don't count future months
                if (targetKey > currentMonthKey) {
                    retention.push(null);
                    continue;
                }

                const activeCount = uids.filter(uid => {
                    const userActivity = activityMap[uid];
                    return userActivity && userActivity.has(targetKey);
                }).length;

                retention.push(totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0);
            }

            // Human-readable month name (French)
            const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

            return {
                cohortKey,
                mois: monthNames[cm - 1],
                annee: cy,
                utilisateursAcquis: totalUsers,
                retention, // Array of % for M0, M1, M2, ...
            };
        });

        // Compute global stats
        const totalUsers = users.length;
        const activeUids = new Set([
            ...products.map(p => p.sellerId),
            ...messages.map(m => m.senderId),
            ...reviews.map(r => r.reviewerId),
        ]);

        const overview = {
            totalUsers,
            activeUsers: activeUids.size,
            totalProducts: products.length,
            totalMessages: messages.length,
            totalReviews: reviews.length,
            avgRetentionM1: (() => {
                const m1s = cohorts
                    .filter(c => c.retention.length > 1 && c.retention[1] !== null)
                    .map(c => c.retention[1]);
                return m1s.length ? Math.round(m1s.reduce((a, b) => a + b, 0) / m1s.length) : 0;
            })(),
        };

        res.json({
            cohorts,
            overview,
            generatedAt: new Date(),
        });
    } catch (err) {
        console.error('PMF Cohorts error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
