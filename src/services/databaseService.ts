import { get, getDatabase, off, onValue, push, ref, set } from 'firebase/database';
import { getCurrentUser } from './authService';
import app from './firebaseConfig';

const database = getDatabase(app);

export interface Group {
    id: string;
    name: string;
    createdBy: string;
    createdAt: number;
    members: { [userId: string]: boolean };
}

export interface GroupMember {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    lastUpdated?: number;
    profilePictureURL?: string;
}

export interface UserProfile {
    userId: string;
    displayName?: string;
    profilePictureURL?: string;
}

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
    // Get user profile to include profile picture URL
    const profile = await getUserProfile(userId);

    const positionRef = ref(database, `groups/${groupId}/positions/${userId}`);
    await set(positionRef, {
        latitude,
        longitude,
        lastUpdated: Date.now(),
        profilePictureURL: profile?.profilePictureURL || null,
    });
};

export const updatePositionInAllGroups = async (userId: string, latitude: number, longitude: number) => {
    // First get all groups the user is in
    const groupsRef = ref(database, 'groups');
    const snapshot = await get(groupsRef);

    // Get user profile to include profile picture URL
    const profile = await getUserProfile(userId);

    const updatePromises: Promise<void>[] = [];

    snapshot.forEach((childSnapshot: any) => {
        const group = childSnapshot.val() as Omit<Group, 'id'>;
        if (group.members && group.members[userId]) {
            // User is a member of this group, update their position
            const positionRef = ref(database, `groups/${childSnapshot.key}/positions/${userId}`);
            updatePromises.push(set(positionRef, {
                latitude,
                longitude,
                lastUpdated: Date.now(),
                profilePictureURL: profile?.profilePictureURL || null,
            }));
        }
    });

    await Promise.all(updatePromises);
};

export const getGroupPositions = (groupId: string, callback: (positions: { [userId: string]: GroupMember }) => void) => {
    const positionsRef = ref(database, `groups/${groupId}/positions`);

    const listener = onValue(positionsRef, (snapshot) => {
        const positions: { [userId: string]: GroupMember } = {};
        snapshot.forEach((childSnapshot) => {
            positions[childSnapshot.key!] = {
                id: childSnapshot.key!,
                ...childSnapshot.val()
            };
        });
        callback(positions);
    });

    return () => off(positionsRef, 'value', listener);
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
    const userRef = ref(database, `users/${userId}/profile`);
    await set(userRef, {
        ...profileData,
        userId,
        lastUpdated: Date.now()
    });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = ref(database, `users/${userId}/profile`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        return snapshot.val() as UserProfile;
    }
    return null;
};

export const watchUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
    const userRef = ref(database, `users/${userId}/profile`);

    const listener = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as UserProfile);
        } else {
            callback(null);
        }
    });

    return () => off(userRef, 'value', listener);
};