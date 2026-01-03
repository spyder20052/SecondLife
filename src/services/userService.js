import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';

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
            lastSeen: new Date().toISOString()
        }, { merge: true }); // merge: true to not overwrite existing fields

        console.log('[UserProfile] Saved user profile for:', user.uid);
    } catch (error) {
        console.error('[UserProfile] Error saving profile:', error);
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
