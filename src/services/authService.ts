import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    // @ts-ignore
    getReactNativePersistence,
    initializeAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import app from './firebaseConfig';

const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const signInWithEmailPassword = async (email: string, password: string): Promise<User> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};

export const signUpWithEmailPassword = async (email: string, password: string): Promise<User> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
};

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

export { auth };
