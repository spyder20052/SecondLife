// How long before a user is considered offline (in milliseconds)
const ONLINE_THRESHOLD_MS = 60 * 1000; // 1 minute

/**
 * Save user profile to MongoDB API
 */
export const saveUserProfile = async (user) => {
    if (!user) return;
    try {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL,
            lastActive: new Date()
        };

        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
    } catch (err) {
        console.error("Error saving user profile to API:", err);
    }
};

/**
 * Update last active timestamp
 */
export const updateUserActivity = async (userId) => {
    if (!userId) return;
    try {
        await fetch('/api/users', {
            method: 'POST', // UPSERT
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId, lastActive: new Date(), isOnline: true })
        });
    } catch (err) {
        // Silent error
    }
};

/**
 * Get user profile from API
 */
export const getUserProfile = async (userId) => {
    if (!userId) return null;
    try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
            return await res.json();
        }
        return null;
    } catch (error) {
        console.error('[UserProfile] Error getting profile:', error);
        return null;
    }
};

/**
 * Check if a user is currently online (active in last 1 minute)
 */
export const isUserOnline = async (userId) => {
    if (!userId) return false;

    try {
        const profile = await getUserProfile(userId);
        if (!profile || !profile.lastActive) return false;

        const lastActiveDate = new Date(profile.lastActive);
        const timeSinceActive = Math.max(0, Date.now() - lastActiveDate.getTime());
        const isOnline = timeSinceActive < ONLINE_THRESHOLD_MS;

        return isOnline;
    } catch (error) {
        console.error('[UserProfile] Error checking online status:', error);
        return false;
    }
};

/**
 * Get user email from API
 */
export const getUserEmail = async (userId) => {
    const profile = await getUserProfile(userId);
    return profile?.email || null;
};

