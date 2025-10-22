import { ActionCodeSettings, getAuth, isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signOut, User } from 'firebase/auth';
import app from './firebaseConfig';

const auth = getAuth(app);

export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const sendSignInLink = async (email: string) => {
    const actionCodeSettings: ActionCodeSettings = {
        url: 'localhost',
        android: {
            packageName: 'com.mabeln.orbit',
            installApp: true,
            minimumVersion: '1',
        },
        handleCodeInApp: true,
    };
    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    } catch (error) {
        console.error('Error sending sign-in link:', error);
        throw error;
    }
};

export const signInWithEmailLinkAuth = async (email: string, emailLink: string): Promise<User> => {
    try {
        if (isSignInWithEmailLink(auth, emailLink)) {
            const result = await signInWithEmailLink(auth, email, emailLink);
            return result.user;
        } else {
            throw new Error('Invalid sign-in link');
        }
    } catch (error) {
        console.error('Error signing in with email link:', error);
        throw error;
    }
};

export { auth, isSignInWithEmailLink };
