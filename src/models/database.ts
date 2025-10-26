/**
 * Database Models
 * 
 * This file defines the structure of data as it exists in Firebase Realtime Database.
 * Keep these interfaces in sync with your actual database schema.
 */

// ============================================================================
// User Models
// ============================================================================

/**
 * User profile stored at: /users/{userId}/profile
 */
export interface UserProfile {
    displayName?: string;
    email?: string;
    photoURL?: string;
    createdAt?: number;
    updatedAt?: number;
}

/**
 * Complete user data structure at: /users/{userId}
 */
export interface UserData {
    profile: UserProfile;
    // Add other user-related data here as needed
    // settings?: UserSettings;
    // preferences?: UserPreferences;
}

// ============================================================================
// Group Models
// ============================================================================

/**
 * Group data stored at: /groups/{groupId}
 */
export interface Group {
    id: string;
    name: string;
    createdBy: string;
    createdAt: number;
    members: { [userId: string]: boolean };
}

/**
 * Member position data stored at: /groups/{groupId}/positions/{userId}
 */
export interface MemberPosition {
    latitude: number;
    longitude: number;
    lastUpdated: number;
}

// ============================================================================
// Composed Types (combining base models)
// ============================================================================

/**
 * User with their profile data (for displaying in lists)
 */
export interface UserWithProfile {
    userId: string;
    profile: UserProfile;
}

/**
 * User with position data (for displaying on map)
 */
export interface UserWithPosition {
    userId: string;
    profile: UserProfile;
    position: MemberPosition;
}
