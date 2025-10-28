import { getCurrentUser } from './authService';
import { getUserProfile, subscribeToMembersAtPlaces, subscribeToUserGroupIds } from './databaseService';
import { notifyMemberArrived, notifyMemberLeft } from './notificationService';

/**
 * Service to handle place entry/exit notifications
 * Listens to changes in membersAtPlaces and triggers notifications based on arrivals and departures
 */
class PlaceNotificationService {
    private unsubscribers: (() => void)[] = [];
    private previousMembersAtPlaces: Map<string, { [placeId: string]: { [userId: string]: any } }> = new Map();
    private placeNamesCache: Map<string, string> = new Map(); // placeId -> name
    private isRunning = false;
    private groupIdsUnsubscriber: (() => void) | null = null;

    /**
     * Start listening for place entry/exit notifications
     */
    async start(): Promise<void> {
        const user = getCurrentUser();
        if (!user) {
            console.warn('[PlaceNotificationService] No authenticated user');
            return;
        }

        if (this.isRunning) {
            console.log('[PlaceNotificationService] Already running');
            return;
        }

        this.isRunning = true;
        console.log('[PlaceNotificationService] Starting...');

        this.groupIdsUnsubscriber = null;

        // Listen to user's group IDs
        const unsubscribeGroupIds = subscribeToUserGroupIds(user.uid, (groupIds) => {
            console.log(`[PlaceNotificationService] Watching ${groupIds.length} groups for place notifications`);

            // Clean up existing group listeners
            this.unsubscribers.forEach(unsub => unsub());
            this.unsubscribers = [];

            // Set up listener for each group's membersAtPlaces
            groupIds.forEach((groupId) => {
                const unsubscribe = subscribeToMembersAtPlaces(groupId, (membersAtPlaces) => {
                    this.handleMembersAtPlacesUpdate(user.uid, groupId, membersAtPlaces);
                });
                this.unsubscribers.push(unsubscribe);
            });
        });

        this.groupIdsUnsubscriber = unsubscribeGroupIds;
    }

    /**
     * Handle updates to membersAtPlaces for a group
     */
    private async handleMembersAtPlacesUpdate(
        currentUserId: string,
        groupId: string,
        currentMembersAtPlaces: { [placeId: string]: { [userId: string]: any } }
    ): Promise<void> {
        const previous = this.previousMembersAtPlaces.get(groupId) || {};

        // Check for arrivals and departures
        for (const placeId in currentMembersAtPlaces) {
            const currentMembers = currentMembersAtPlaces[placeId];
            const previousMembers = previous[placeId] || {};

            // Get place name (we'll need to cache this or pass it differently)
            const placeName = this.placeNamesCache.get(placeId) || 'a place';

            // Check for new arrivals
            for (const userId in currentMembers) {
                // Skip notifications for current user (optional - you can change this)
                // if (userId === currentUserId) continue;

                if (!previousMembers[userId]) {
                    // Member arrived - fetch their profile and notify
                    const profile = await getUserProfile(userId);
                    const memberName = profile?.displayName || 'Someone';
                    await notifyMemberArrived(memberName, placeName);
                    console.log(`[PlaceNotificationService] ${memberName} arrived at ${placeName}`);
                }
            }

            // Check for departures
            for (const userId in previousMembers) {
                // Skip notifications for current user (optional - you can change this)
                // if (userId === currentUserId) continue;

                if (!currentMembers[userId]) {
                    // Member left - fetch their profile and notify
                    const profile = await getUserProfile(userId);
                    const memberName = profile?.displayName || 'Someone';
                    await notifyMemberLeft(memberName, placeName);
                    console.log(`[PlaceNotificationService] ${memberName} left ${placeName}`);
                }
            }
        }

        // Check for places that no longer have any members (all left)
        for (const placeId in previous) {
            if (!currentMembersAtPlaces[placeId]) {
                const previousMembers = previous[placeId];
                const placeName = this.placeNamesCache.get(placeId) || 'a place';

                // All members left this place
                for (const userId in previousMembers) {
                    // Skip notifications for current user (optional)
                    // if (userId === currentUserId) continue;

                    const profile = await getUserProfile(userId);
                    const memberName = profile?.displayName || 'Someone';
                    await notifyMemberLeft(memberName, placeName);
                    console.log(`[PlaceNotificationService] ${memberName} left ${placeName}`);
                }
            }
        }

        // Update the reference for next comparison
        this.previousMembersAtPlaces.set(groupId, currentMembersAtPlaces);
    }

    /**
     * Update the place names cache (call this when places are loaded)
     * This helps provide better notification messages
     */
    updatePlaceNames(placeId: string, placeName: string): void {
        this.placeNamesCache.set(placeId, placeName);
    }

    /**
     * Stop listening for notifications and clean up
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }

        console.log('[PlaceNotificationService] Stopping...');
        if (this.groupIdsUnsubscriber) {
            this.groupIdsUnsubscriber();
            this.groupIdsUnsubscriber = null;
        }
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.previousMembersAtPlaces.clear();
        this.isRunning = false;
    }

    /**
     * Check if the service is currently running
     */
    isActive(): boolean {
        return this.isRunning;
    }
}

// Export singleton instance
export const placeNotificationService = new PlaceNotificationService();
