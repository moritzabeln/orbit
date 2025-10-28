import { MemberLocation, Place } from '../models/database';
import { getCurrentUser } from './authService';
import { getMultipleGroupPlaces, subscribeToUserGroupIds } from './databaseService';
import { placeDetectionService } from './placeDetectionService';
import { placeNotificationService } from './placeNotificationService';

/**
 * Service to integrate location updates with place detection
 * This maintains a list of all places across all groups for the current user
 */
class LocationPlaceIntegration {
    private allPlaces: Map<string, Place[]> = new Map(); // groupId -> places
    private unsubscribers: (() => void)[] = [];
    private placesById: Map<string, { place: Place; groupId: string }> = new Map(); // placeId -> {place, groupId}
    private placesUnsubscriber: (() => void) | null = null;

    /**
     * Initialize listeners for all groups and their places
     */
    async initialize(): Promise<void> {
        const user = getCurrentUser();
        if (!user) {
            console.warn('[LocationPlaceIntegration] No authenticated user');
            return;
        }

        // Clean up existing listeners
        this.cleanup();

        this.placesUnsubscriber = null;

        // Listen to user's group IDs (lightweight)
        const unsubscribeGroupIds = subscribeToUserGroupIds(user.uid, (groupIds) => {
            console.log(`[LocationPlaceIntegration] Loaded ${groupIds.length} groups`);

            // Unsubscribe previous places listener if exists
            if (this.placesUnsubscriber) {
                this.placesUnsubscriber();
            }

            // Listen to places for all groups
            const unsubscribePlaces = getMultipleGroupPlaces(groupIds, (allPlaces) => {
                // Update the internal state
                Object.entries(allPlaces).forEach(([groupId, places]) => {
                    this.allPlaces.set(groupId, places);

                    // Update places by ID map for easy lookup
                    places.forEach((place) => {
                        this.placesById.set(place.id, { place, groupId });
                        // Also update the place notification service cache
                        placeNotificationService.updatePlaceNames(place.id, place.name);
                    });
                });

                console.log(`[LocationPlaceIntegration] Total places loaded: ${this.placesById.size}`);
            });

            this.placesUnsubscriber = unsubscribePlaces;
        });

        this.unsubscribers.push(unsubscribeGroupIds);
    }

    /**
     * Process a location update through place detection for all groups
     */
    async processLocationUpdate(location: MemberLocation): Promise<void> {
        // Process for each group
        for (const [groupId, places] of this.allPlaces.entries()) {
            await placeDetectionService.processLocationUpdate(location, groupId, places);
        }
    }

    /**
     * Get place information by ID
     */
    getPlaceById(placeId: string): { place: Place; groupId: string } | undefined {
        return this.placesById.get(placeId);
    }

    /**
     * Get all places for a group
     */
    getPlacesForGroup(groupId: string): Place[] {
        return this.allPlaces.get(groupId) || [];
    }

    /**
     * Cleanup all listeners
     */
    cleanup(): void {
        if (this.placesUnsubscriber) {
            this.placesUnsubscriber();
            this.placesUnsubscriber = null;
        }
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        this.allPlaces.clear();
        this.placesById.clear();
        placeDetectionService.reset();
    }
}

// Export singleton instance
export const locationPlaceIntegration = new LocationPlaceIntegration();
