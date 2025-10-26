import { get, getDatabase, off, onValue, push, ref, set } from 'firebase/database';
import { Group, MemberPosition, UserProfile, UserWithProfile } from '../models/database';
import { getCurrentUser } from './authService';
import app from './firebaseConfig';

const database = getDatabase(app);

// Re-export models for backward compatibility
export type { Group, MemberPosition, UserProfile, UserWithProfile };

export const createGroup = async (name: string): Promise<string> => {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('User must be authenticated to create a group');
    }

    const groupsRef = ref(database, 'groups');
    const newGroupRef = push(groupsRef);

    const groupData: Omit<Group, 'id'> = {
        name,
        createdBy: user.uid,
        createdAt: Date.now(),
        members: {
            [user.uid]: true
        }
    };

    await set(newGroupRef, groupData);
    return newGroupRef.key!;
};

export const getUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
    const groupsRef = ref(database, 'groups');

    const listener = onValue(groupsRef, (snapshot) => {
        const groups: Group[] = [];
        snapshot.forEach((childSnapshot) => {
            const group = childSnapshot.val() as Omit<Group, 'id'>;
            if (group.members && group.members[userId]) {
                groups.push({
                    id: childSnapshot.key!,
                    ...group
                });
            }
        });
        callback(groups);
    });

    return () => off(groupsRef, 'value', listener);
};

export const addGroupMember = async (groupId: string, userId: string) => {
    const memberRef = ref(database, `groups/${groupId}/members/${userId}`);
    await set(memberRef, true);
};

export const updateMemberPosition = async (groupId: string, userId: string, latitude: number, longitude: number) => {
    const positionRef = ref(database, `groups/${groupId}/positions/${userId}`);
    await set(positionRef, {
        latitude,
        longitude,
        lastUpdated: Date.now()
    });
};

export const updatePositionInAllGroups = async (userId: string, latitude: number, longitude: number) => {
    // First get all groups the user is in
    const groupsRef = ref(database, 'groups');
    const snapshot = await get(groupsRef);

    const updatePromises: Promise<void>[] = [];

    snapshot.forEach((childSnapshot: any) => {
        const group = childSnapshot.val() as Omit<Group, 'id'>;
        if (group.members && group.members[userId]) {
            // User is a member of this group, update their position
            const positionRef = ref(database, `groups/${childSnapshot.key}/positions/${userId}`);
            updatePromises.push(set(positionRef, {
                latitude,
                longitude,
                lastUpdated: Date.now()
            }));
        }
    });

    await Promise.all(updatePromises);
};

export const getGroupPositions = (groupId: string, callback: (positions: { [userId: string]: MemberPosition }) => void) => {
    const positionsRef = ref(database, `groups/${groupId}/positions`);

    const listener = onValue(positionsRef, (snapshot) => {
        const positions: { [userId: string]: MemberPosition } = {};
        snapshot.forEach((childSnapshot) => {
            const positionData = childSnapshot.val();
            positions[childSnapshot.key!] = {
                latitude: positionData.latitude,
                longitude: positionData.longitude,
                lastUpdated: positionData.lastUpdated
            };
        });
        callback(positions);
    });

    return () => off(positionsRef, 'value', listener);
};

/**
 * Get all members in a group (returns member IDs and basic profile info)
 * This is more appropriate than getGroupPositions when you just need to display members
 * @param groupId - The group ID
 * @param callback - Callback function that receives the array of group members
 * @returns Unsubscribe function
 */
export const getGroupMembers = (groupId: string, callback: (members: UserWithProfile[]) => void) => {
    const groupRef = ref(database, `groups/${groupId}`);

    const listener = onValue(groupRef, async (snapshot) => {
        const groupData = snapshot.val();

        if (!groupData || !groupData.members) {
            callback([]);
            return;
        }

        const userIds = Object.keys(groupData.members);
        const members: UserWithProfile[] = [];

        // Fetch user profiles for each member
        for (const userId of userIds) {
            const userProfileRef = ref(database, `users/${userId}/profile`);
            try {
                const userSnapshot = await get(userProfileRef);
                const userProfile = userSnapshot.val() as UserProfile | null;

                members.push({
                    userId: userId,
                    profile: userProfile || {
                        displayName: 'Unknown User'
                    }
                });
            } catch (error) {
                console.error(`Error fetching user profile for ${userId}:`, error);
                // Still add the user with just their ID
                members.push({
                    userId: userId,
                    profile: {
                        displayName: 'Unknown User'
                    }
                });
            }
        }

        callback(members);
    });

    return () => off(groupRef, 'value', listener);
};

/**
 * Update user profile in the database
 * @param userId - The user ID
 * @param profileData - The profile data to update
 */
export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
    const profileRef = ref(database, `users/${userId}/profile`);

    // Get current profile data
    const snapshot = await get(profileRef);
    const currentProfile = snapshot.val() as UserProfile || {};

    // Merge with new data and update timestamp
    const updatedProfile: UserProfile = {
        ...currentProfile,
        ...profileData,
        updatedAt: Date.now()
    };

    await set(profileRef, updatedProfile);
};

/**
 * Get user profile from the database
 * @param userId - The user ID
 * @param callback - Callback function that receives the user profile
 * @returns Unsubscribe function
 */
export const getUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
    const profileRef = ref(database, `users/${userId}/profile`);

    const listener = onValue(profileRef, (snapshot) => {
        const profile = snapshot.val() as UserProfile | null;
        callback(profile);
    });

    return () => off(profileRef, 'value', listener);
};