import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Message from '../models/Message.js';
import Review from '../models/Review.js';

const router = express.Router();
const PMF_TARGET = 70;

function startOfISOWeek(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1 - day);
    return d;
}

function weekKey(date) {
    const d = startOfISOWeek(date);
    const yr = d.getFullYear();
    const startOfYear = new Date(yr, 0, 1);
    const wn = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${yr}-W${String(wn).padStart(2, '0')}`;
}

function relativeWeek(regDate, evtDate) {
    const regMon = startOfISOWeek(regDate).getTime();
    const evtMon = startOfISOWeek(evtDate).getTime();
    return Math.floor((evtMon - regMon) / (7 * 86400000));
}

router.get('/pmf-cohorts', async (req, res) => {
    try {
        const users = await User.find({}, { uid: 1, createdAt: 1 }).lean();
        if (!users.length) return res.json({ cohorts: [], overview: {}, pmfTarget: PMF_TARGET, generatedAt: new Date() });

        const cohortMap = {};
        users.forEach(u => {
            const wk = weekKey(u.createdAt);
            if (!cohortMap[wk]) cohortMap[wk] = [];
            cohortMap[wk].push({ uid: u.uid, registrationDate: u.createdAt });
        });

        const soldProducts = await Product.find(
            { status: 'sold', buyerId: { $exists: true, $ne: null, $ne: '' } },
            { buyerId: 1, updatedAt: 1, createdAt: 1 }
        ).lean();

        const purchaseMap = {};
        soldProducts.forEach(p => {
            const buyDate = p.updatedAt || p.createdAt;
            if (!buyDate) return;
            if (!purchaseMap[p.buyerId]) purchaseMap[p.buyerId] = [];
            purchaseMap[p.buyerId].push(new Date(buyDate));
        });

        const totalUsers = users.length;
        const totalProducts = await Product.countDocuments();
        const totalMessages = await Message.countDocuments();
        const totalReviews = await Review.countDocuments();
        const totalSold = soldProducts.length;
        const uniqueBuyers = Object.keys(purchaseMap).length;

        const MONTHS_FR = ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
            'Juil.', 'Août', 'Sep.', 'Oct.', 'Nov.', 'Déc.'];

        function weekLabel(monday) {
            const sunday = new Date(monday);
            sunday.setDate(sunday.getDate() + 6);
            return `${monday.getDate()}–${sunday.getDate()} ${MONTHS_FR[sunday.getMonth()]}`;
        }

        const now = new Date();
        const MAX_WEEKS = 12;
        const existingKeys = Object.keys(cohortMap).sort();
        const firstMonday = startOfISOWeek(cohortMap[existingKeys[0]][0].registrationDate);
        const currentMonday = startOfISOWeek(now);

        // Generate ALL weeks from first inscription to today (no gaps)
        const allMondaysMs = [];
        for (let d = new Date(firstMonday); d <= currentMonday; d.setDate(d.getDate() + 7)) {
            allMondaysMs.push(new Date(d));
        }

        const cohorts = allMondaysMs.map(monday => {
            const wk = weekKey(monday);
            const members = cohortMap[wk] || [];
            const totalInCohort = members.length;
            const weeksElapsed = Math.floor((currentMonday - monday) / (7 * 86400000));
            const maxWeek = Math.min(weeksElapsed, MAX_WEEKS - 1);

            const retention = [];
            if (totalInCohort === 0) {
                // Empty week: show null for all columns
                for (let w = 0; w <= maxWeek; w++) retention.push(null);
            } else {
                for (let w = 0; w <= maxWeek; w++) {
                    const weekEndDate = new Date(monday.getTime() + (w + 1) * 7 * 86400000);
                    if (weekEndDate > now && w > 0) { retention.push(null); continue; }
                    const activeCount = members.filter(({ uid, registrationDate }) => {
                        const purchases = purchaseMap[uid];
                        return purchases && purchases.some(d => relativeWeek(registrationDate, d) === w);
                    }).length;
                    retention.push(Math.round((activeCount / totalInCohort) * 100));
                }
            }

            return {
                weekKey: wk,
                label: weekLabel(monday),
                utilisateursAcquis: totalInCohort,
                isEmpty: totalInCohort === 0,
                retention,
                pmfW1: retention[1] ?? null,
                pmfReached: retention[1] !== null && retention[1] >= PMF_TARGET,
            };
        });

        const w1values = cohorts.filter(c => c.retention.length > 1 && c.retention[1] !== null).map(c => c.retention[1]);
        const avgW1 = w1values.length ? Math.round(w1values.reduce((a, b) => a + b, 0) / w1values.length) : 0;

        res.json({
            cohorts,
            overview: { totalUsers, uniqueBuyers, totalProducts, totalSold, totalMessages, totalReviews, avgW1 },
            pmfTarget: PMF_TARGET,
            generatedAt: new Date(),
        });
    } catch (err) {
        console.error('PMF error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
