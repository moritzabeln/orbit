import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import app from './firebaseConfig';

const storage = getStorage(app);

export const uploadProfilePicture = async (userId: string, uri: string): Promise<string> => {
    try {
        // Fetch the image as a blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Create a reference to the profile picture location
        const storageRef = ref(storage, `profilePictures/${userId}`);

        // Upload the file
        await uploadBytes(storageRef, blob);

        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
};

export const getProfilePictureURL = async (userId: string): Promise<string | null> => {
    try {
        const storageRef = ref(storage, `profilePictures/${userId}`);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch {
        // File doesn't exist or other error
        console.log('No profile picture found for user:', userId);
        return null;
    }
};
