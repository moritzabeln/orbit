import { Directory, File, Paths } from 'expo-file-system';

// Custom API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_ORBIT_API_BASE_URL || '';
const API_KEY = process.env.EXPO_PUBLIC_ORBIT_API_KEY || '';

// Cache directory for profile pictures
const profilePicturesDir = new Directory(Paths.cache, 'profile_pictures');

/**
 * Clear cached profile picture for a specific user
 * @param userId - The user's ID
 */
export const clearProfilePictureCache = async (userId: string): Promise<void> => {
    const cachedFile = new File(profilePicturesDir, `${userId}_profile_picture.jpg`);
    if (cachedFile.exists) {
        await cachedFile.delete();
    }
};

/**
 * Clear all cached profile pictures
 */
export const clearAllProfilePictureCache = async (): Promise<void> => {
    if (profilePicturesDir.exists) {
        await profilePicturesDir.delete();
    }
};

/**
 * Upload a profile picture to the custom API
 * @param userId - The user's ID
 * @param uri - Local URI of the image to upload
 * @returns The file URL from the API
 */
export const uploadProfilePicture = async (userId: string, uri: string): Promise<string> => {
    // Validate configuration
    if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured. Please check your .env file.');
    }
    if (!API_KEY) {
        throw new Error('API_KEY is not configured. Please check your .env file.');
    }

    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Get the file extension from the URI
    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = `profile_picture.${fileExtension}`;

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('filename', 'profile_picture');

    // Create a file object from the blob
    // @ts-ignore - React Native FormData handles blobs differently
    formData.append('file', {
        uri: uri,
        type: blob.type || 'image/jpeg',
        name: fileName,
    });

    // Upload to custom API
    const uploadURL = `${API_BASE_URL}api/v1/files/upload`;

    const uploadResponse = await fetch(uploadURL, {
        method: 'POST',
        headers: {
            'X-API-KEY': API_KEY,
        },
        body: formData,
    }).catch((fetchError) => {
        throw new Error(`Network request failed. Please check: 1) API URL is correct, 2) Server is running, 3) Network connection is available. Error: ${fetchError.message}`);
    });

    if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${uploadResponse.status}`);
    }

    const data = await uploadResponse.json();

    if (!data.success || !data.file_url) {
        throw new Error('Invalid response from server');
    }

    // Clear the cached profile picture so it will be re-downloaded
    await clearProfilePictureCache(userId);

    // Return the full URL to the uploaded file
    return `${API_BASE_URL}${data.file_url}`;
};

/**
 * Ensure the cache directory exists
 */
const ensureCacheDir = async (): Promise<void> => {
    if (!profilePicturesDir.exists) {
        await profilePicturesDir.create();
    }
};

/**
 * Get the profile picture URL for a user
 * Downloads the image from the API and caches it locally
 * @param userId - The user's ID
 * @param forceRefresh - Force re-download even if cached
 * @returns A local file URI or null if not found
 */
export const getProfilePictureURL = async (
    userId: string,
    forceRefresh: boolean = false
): Promise<string | null> => {
    if (!API_BASE_URL) {
        return null;
    }

    // Ensure cache directory exists
    await ensureCacheDir();

    // Check for cached file
    const cachedFile = new File(profilePicturesDir, `${userId}_profile_picture.jpg`);

    // For testing force refresh
    // forceRefresh = true;

    if (cachedFile.exists && !forceRefresh) {
        // Return file URI directly - binary image can be loaded by Image component
        return cachedFile.uri;
    }

    if (forceRefresh && cachedFile.exists) {
        cachedFile.delete();
    }

    const filename = 'profile_picture';
    const url = `${API_BASE_URL}api/v1/files/get?userId=${userId}&filename=${filename}`;

    // Download the file using fetch with headers
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-API-KEY': API_KEY,
        },
    }).catch((fetchError) => {
        throw new Error(`Network request failed: ${fetchError.message}`);
    });

    if (response.status !== 200) {
        console.log(`Failed to fetch profile picture: HTTP ${response.status}`);
        console.log(`URL: ${url}`);
        try {
            const errorText = await response.text();
            console.error(`Response body: ${errorText.substring(0, 500)}`);
        } catch {
            console.error('Could not read error response body');
        }
        return null;
    }

    // Check Content-Type to ensure it's an image
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.startsWith('image/')) {
        return null;
    }

    // Download and save the binary image file
    const blob = await response.blob();

    // Convert blob to ArrayBuffer (binary data)
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as ArrayBuffer);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });

    cachedFile.write(new Uint8Array(arrayBuffer));

    return cachedFile.uri;
};
