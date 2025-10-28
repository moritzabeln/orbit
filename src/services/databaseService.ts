import { get, getDatabase, off, onValue, push, ref, remove, set } from 'firebase/database';
import { Group, MemberAtPlace, MemberLocation, Place, UserProfile, UserWithProfile } from '../models/database';
import { getCurrentUser } from './authService';
import app from './firebaseConfig';

const database = getDatabase(app);

/**
 * Add a group reference to a user's groups list
 * Stored at: users/{userId}/groups/{groupId}
 * @param userId - The user ID
 * @param groupId - The group ID
 * @param groupName - The group name (for easy reference)
 */
const addGroupToUser = async (userId: string, groupId: string, groupName: string) => {
    const userGroupRef = ref(database, `users/${userId}/groups/${groupId}`);
    await set(userGroupRef, {
        name: groupName,
        joinedAt: Date.now()
    });
};

/**
 * Remove a group reference from a user's groups list
 * @param userId - The user ID
 * @param groupId - The group ID
 */
export const removeGroupFromUser = async (userId: string, groupId: string) => {
    const userGroupRef = ref(database, `users/${userId}/groups/${groupId}`);
    await remove(userGroupRef);
};

/**
 * Get all group IDs for a user (lightweight - just IDs)
 * This is more efficient than getUserGroups when you only need group IDs
 * @param userId - The user ID
 * @param callback - Callback function that receives array of group IDs
 * @returns Unsubscribe function
 */
export const subscribeToUserGroupIds = (userId: string, callback: (groupIds: string[]) => void) => {
    const userGroupsRef = ref(database, `users/${userId}/groups`);

    const listener = onValue(userGroupsRef, (snapshot) => {
        console.log(`[DatabaseService] Received group IDs update for user ${userId}`);
        const groupIds: string[] = [];
        snapshot.forEach((childSnapshot) => {
            groupIds.push(childSnapshot.key!);
        });
        callback(groupIds);
    });

    return () => off(userGroupsRef, 'value', listener);
};


export const createGroup = async (name: string): Promise<string> => {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('User must be authenticated to create a group');
    }

    const groupsRef = ref(database, 'groups');
    const newGroupRef = push(groupsRef);
    const groupId = newGroupRef.key!;

    const groupData: Omit<Group, 'id'> = {
        name,
        createdBy: user.uid,
        createdAt: Date.now(),
        members: {
            [user.uid]: true
        },
        membersAtPlaces: {},
        positions: {},
        places: {},
    };

    await set(newGroupRef, groupData);

    // Also add group to user's groups list
    await addGroupToUser(user.uid, groupId, name);

    return groupId;
};

/**
 * Get group name by ID
 * @param groupId - The group ID
 * @returns Promise that resolves to the group name or null if not found
 */
export const getGroupNameAsync = async (groupId: string): Promise<string | null> => {
    const groupRef = ref(database, `groups/${groupId}/name`);
    const snapshot = await get(groupRef);
    if (snapshot.exists()) {
        return snapshot.val() as string;
    }
    return null;
}

/**
 * Listen to positions for multiple groups efficiently
 * This sets up individual listeners for each group's positions
 * @param groupIds - Array of group IDs to listen to
 * @param callback - Callback that receives all positions grouped by groupId
 * @returns Unsubscribe function that cleans up all listeners
 */
export const subscribeToMultipleGroupPositions = (
    groupIds: string[],
    callback: (allPositions: { [groupId: string]: { [userId: string]: MemberLocation } }) => void
) => {
    const unsubscribers: (() => void)[] = [];
    const allPositions: { [groupId: string]: { [userId: string]: MemberLocation } } = {};

    groupIds.forEach((groupId) => {
        const unsubscribe = subscribeToGroupPositions(groupId, (positions) => {
            allPositions[groupId] = positions;
            callback({ ...allPositions });
        });
        unsubscribers.push(unsubscribe);
    });

    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
};

/**
 * Listen to places for multiple groups efficiently
 * This sets up individual listeners for each group's places
 * @param groupIds - Array of group IDs to listen to
 * @param callback - Callback that receives all places grouped by groupId
 * @returns Unsubscribe function that cleans up all listeners
 */
export const getMultipleGroupPlaces = (
    groupIds: string[],
    callback: (allPlaces: { [groupId: string]: Place[] }) => void
) => {
    const unsubscribers: (() => void)[] = [];
    const allPlaces: { [groupId: string]: Place[] } = {};

    groupIds.forEach((groupId) => {
        const unsubscribe = subscribeToGroupPlaces(groupId, (places) => {
            allPlaces[groupId] = places;
            callback({ ...allPlaces });
        });
        unsubscribers.push(unsubscribe);
    });

    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
};


export const addGroupMember = async (groupId: string, userId: string) => {
    const memberRef = ref(database, `groups/${groupId}/members/${userId}`);
    await set(memberRef, true);

    // Also add group to user's groups list
    const groupSnapshot = await get(ref(database, `groups/${groupId}`));
    const groupData = groupSnapshot.val();
    if (groupData) {
        await addGroupToUser(userId, groupId, groupData.name);
    }
};

export const updateMemberPosition = async (groupId: string, userId: string, latitude: number, longitude: number) => {
    const positionRef = ref(database, `groups/${groupId}/positions/${userId}`);
    await set(positionRef, {
        latitude,
        longitude,
        lastUpdated: Date.now()
    });
};

/**
 * Update position of a user in all their groups
 * @param userId - The user ID
 * @param location - The location data
 */
export const updatePositionInAllGroups = async (userId: string, location: MemberLocation) => {
    // First get all groups the user is in
    const userGroupsRef = ref(database, `users/${userId}/groups`);
    const snapshot = await get(userGroupsRef);
    if (!snapshot.exists()) {
        return;
    }

    const updatePromises: Promise<void>[] = [];
    snapshot.forEach((childSnapshot) => {
        const groupId = childSnapshot.key!;
        const positionRef = ref(database, `groups/${groupId}/positions/${userId}`);
        const updatePromise = set(positionRef, {
            ...location,
            lastUpdated: Date.now()
        });
        updatePromises.push(updatePromise);
    });

    await Promise.all(updatePromises);
};

/**
 * Subscribe to position updates for a specific group
 * @param groupId - The group ID
 * @param callback - Callback function that receives the positions data of each update
 * @returns Unsubscribe function
 */
export const subscribeToGroupPositions = (groupId: string, callback: (positions: { [userId: string]: MemberLocation }) => void) => {
    const positionsRef = ref(database, `groups/${groupId}/positions`);

    console.log(`[DatabaseService] Subscribing to position updates for group ${groupId}`);
    const listener = onValue(positionsRef, (snapshot) => {
        console.log(`[DatabaseService] Received position update for group ${groupId}`);
        const positions: { [userId: string]: MemberLocation } = {};
        snapshot.forEach((childSnapshot) => {
            const positionData = childSnapshot.val();
            positions[childSnapshot.key!] = {
                latitude: positionData.latitude,
                longitude: positionData.longitude,
                timestamp: positionData.lastUpdated,
                accuracy: positionData.accuracy,
                heading: positionData.heading,
                speed: positionData.speed
            };
        });
        callback(positions);
    });

    return () => {
        console.log(`[DatabaseService] Unsubscribing from position updates for group ${groupId}`);
        off(positionsRef, 'value', listener);
    };
}

/**
 * Subscribe to members of a specific group. Fetches user profiles as well.
 * @param groupId - The group ID
 * @param callback - Callback that is called every time the members list changes. Receives an array of UserWithProfile.
 * @returns Unsubscribe function
 */
export const subscribeToGroupMembers = (groupId: string, callback: (members: UserWithProfile[]) => void) => {
    const membersRef = ref(database, `groups/${groupId}/members`);

    console.log(`[DatabaseService] Subscribing to members of group ${groupId}`);
    const listener = onValue(membersRef, async (snapshot) => {
        console.log(`[DatabaseService] Received members update for group ${groupId}`);
        const membersData = snapshot.val();

        if (!membersData) {
            callback([]);
            return;
        }

        const userIds = Object.keys(membersData);
        const members: UserWithProfile[] = [];

        // Fetch user profiles in parallel for better performance
        const profilePromises = userIds.map(async (userId) => {
            const userProfileRef = ref(database, `users/${userId}/profile`);
            try {
                const userSnapshot = await get(userProfileRef);
                const userProfile = userSnapshot.val() as UserProfile | null;

                return {
                    userId: userId,
                    profile: userProfile || {
                        displayName: 'Unknown User'
                    }
                };
            } catch (error) {
                console.error(`Error fetching user profile for ${userId}:`, error);
                // Still add the user with just their ID
                return {
                    userId: userId,
                    profile: {
                        displayName: 'Unknown User'
                    }
                };
            }
        });

        const resolvedMembers = await Promise.all(profilePromises);
        members.push(...resolvedMembers);

        callback(members);
    });

    return () => {
        console.log(`[DatabaseService] Unsubscribing from members of group ${groupId}`);
        off(membersRef, 'value', listener);
    };
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
 * Subscribe to user profile updates
 * @param userId - The user ID
 * @param callback - Callback function that receives the user profile updates
 * @returns Unsubscribe function
 */
export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
    const profileRef = ref(database, `users/${userId}/profile`);

    const listener = onValue(profileRef, (snapshot) => {
        const profile = snapshot.val() as UserProfile | null;
        callback(profile);
    });

    return () => off(profileRef, 'value', listener);
};

/**
 * Get user profile once
 * @param userId - The user ID
 * @returns Promise that resolves to the user profile or null if not found
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const profileRef = ref(database, `users/${userId}/profile`);
    const snapshot = await get(profileRef);
    return snapshot.val() as UserProfile | null;
}

/**
 * Update user's battery level in the database
 * @param userId - The user ID
 * @param batteryLevel - Battery percentage (0-100)
 * @param batteryState - Battery state (optional)
 */
export const updateUserBattery = async (userId: string, batteryLevel: number, batteryState?: number) => {
    const profileRef = ref(database, `users/${userId}/profile`);

    // Get current profile data
    const snapshot = await get(profileRef);
    const currentProfile = snapshot.val() as UserProfile || {};

    // Update battery info
    const updatedProfile: UserProfile = {
        ...currentProfile,
        batteryLevel,
        batteryState,
        batteryLastUpdated: Date.now(),
        updatedAt: Date.now()
    };

    await set(profileRef, updatedProfile);
};

/**
 * Save a place to a group
 * @param groupId - The group ID
 * @param place - The place data
 */
export const savePlace = async (groupId: string, place: { name: string; lat: number; lng: number; radius: number }) => {
    const placesRef = ref(database, `groups/${groupId}/places`);
    const newPlaceRef = push(placesRef);
    await set(newPlaceRef, {
        ...place,
        createdAt: Date.now(),
    });
};

/**
 * Update an existing place in a group
 * @param groupId - The group ID
 * @param placeId - The place ID
 * @param place - The updated place data
 */
export const updatePlace = async (groupId: string, placeId: string, place: { name: string; lat: number; lng: number; radius: number }) => {
    const placeRef = ref(database, `groups/${groupId}/places/${placeId}`);
    await set(placeRef, {
        ...place,
        createdAt: Date.now(), // Update timestamp
    });
};

/**
 * Subscribe to changes in places for a specific group
 * @param groupId - The group ID
 * @param callback - Callback function that receives the array of places. Called every time the places change.
 * @returns Unsubscribe function
 */
export const subscribeToGroupPlaces = (groupId: string, callback: (places: Place[]) => void) => {
    const placesRef = ref(database, `groups/${groupId}/places`);

    const listener = onValue(placesRef, (snapshot) => {
        const places: Place[] = [];
        snapshot.forEach((childSnapshot) => {
            const placeData = childSnapshot.val();
            places.push({
                id: childSnapshot.key!,
                name: placeData.name,
                lat: placeData.lat,
                lng: placeData.lng,
                radius: placeData.radius,
                createdAt: placeData.createdAt
            });
        });
        callback(places);
    });

    return () => off(placesRef, 'value', listener);
};

/**
 * Set a member at a place in the database
 * @param groupId - The group ID
 * @param placeId - The place ID
 * @param userId - The user ID
 * @param data - Member at place data
 */
export const setMemberAtPlace = async (
    groupId: string,
    placeId: string,
    userId: string,
    data: MemberAtPlace
) => {
    const memberAtPlaceRef = ref(database, `groups/${groupId}/membersAtPlaces/${placeId}/${userId}`);
    // Check if member already exists to avoid overwriting arrival time
    const snapshot = await get(memberAtPlaceRef);
    if (snapshot.exists()) {
        console.log(`[DatabaseService] Member ${userId} already at place ${placeId} in group ${groupId}, not overwriting`);
        return;
    }
    await set(memberAtPlaceRef, data);
};

/**
 * Remove a member from a place in the database
 * @param groupId - The group ID
 * @param placeId - The place ID
 * @param userId - The user ID
 */
export const removeMemberFromPlace = async (
    groupId: string,
    placeId: string,
    userId: string
) => {
    const memberAtPlaceRef = ref(database, `groups/${groupId}/membersAtPlaces/${placeId}/${userId}`);
    await remove(memberAtPlaceRef);
};

/**
 * Subscribe to membersAtPlaces for a specific group.
 * @param groupId - The group ID
 * @param callback - Callback function that receives the members at places data. Called every time the members at a place change.
 * @returns Unsubscribe function
 */
export const subscribeToMembersAtPlaces = (
    groupId: string,
    callback: (data: { [placeId: string]: { [userId: string]: MemberAtPlace } }) => void
) => {
    const membersAtPlacesRef = ref(database, `groups/${groupId}/membersAtPlaces`);

    const listener = onValue(membersAtPlacesRef, (snapshot) => {
        const data: { [placeId: string]: { [userId: string]: MemberAtPlace } } = {};

        snapshot.forEach((placeSnapshot) => {
            const placeId = placeSnapshot.key!;
            data[placeId] = {};

            placeSnapshot.forEach((memberSnapshot) => {
                const userId = memberSnapshot.key!;
                data[placeId][userId] = memberSnapshot.val() as MemberAtPlace;
            });
        });

        callback(data);
    });

    return () => off(membersAtPlacesRef, 'value', listener);
};