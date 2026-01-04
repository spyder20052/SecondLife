import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';

// How long before a user is considered offline (in milliseconds)
const ONLINE_THRESHOLD_MS = 60 * 1000; // 1 minute (reduced from 2 for easier testing)

/**
 * Save user profile to Firestore (including email)
 */
export const saveUserProfile = async (user) => {
    if (!user || !user.uid) return;

    try {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            lastSeen: new Date().toISOString(),
            lastActive: Date.now() // Timestamp for online detection
        }, { merge: true });

        console.log('[UserProfile] Saved user profile for:', user.uid);
    } catch (error) {
        console.error('[UserProfile] Error saving profile:', error);
    }
};

/**
 * Update user's last activity timestamp (for online detection)
 */
export const updateUserActivity = async (userId) => {
    if (!userId) return;

    try {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userId);
        await setDoc(userRef, {
            lastActive: Date.now()
        }, { merge: true });
    } catch (error) {
        // Silently fail - this is not critical
        console.debug('[UserProfile] Activity update failed:', error);
    }
};

/**
 * Check if a user is currently online (active in last 2 minutes)
 */
export const isUserOnline = async (userId) => {
    if (!userId) return false;

    try {
        const profile = await getUserProfile(userId);
        if (!profile || !profile.lastActive) return false;

        const timeSinceActive = Math.max(0, Date.now() - profile.lastActive);
        const isOnline = timeSinceActive < ONLINE_THRESHOLD_MS;

        console.log(`[Presence] User ${userId} was last active ${Math.floor(timeSinceActive / 1000)}s ago. Online: ${isOnline}`);
        return isOnline;
    } catch (error) {
        console.error('[UserProfile] Error checking online status:', error);
        return false;
    }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId) => {
    if (!userId) return null;

    try {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('[UserProfile] Error getting profile:', error);
        return null;
    }
};

/**
 * Get user email from Firestore
 */
export const getUserEmail = async (userId) => {
    const profile = await getUserProfile(userId);
    return profile?.email || null;
};

