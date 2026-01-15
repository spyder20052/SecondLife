import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBFz5J7BvJSjKd8dPwcEaC3SCqoRzmPyoM",
    authDomain: "mvpeep-8b36e.firebaseapp.com",
    projectId: "mvpeep-8b36e",
    storageBucket: "mvpeep-8b36e.firebasestorage.app",
    messagingSenderId: "32004942624",
    appId: "1:32004942624:web:d73a26b196b0fa55a34545",
    measurementId: "G-4G6FYV4P6V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        // ...
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        // ...
    }
});

export const storage = getStorage(app);
export const appId = 'second-life-mvp';
