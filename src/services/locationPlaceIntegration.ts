import { MemberLocation, Place } from '../models/database';
import { getCurrentUser } from './authService';
import { getGroupPlaces, getUserGroups } from './databaseService';
import { placeDetectionService } from './placeDetectionService';

/**
 * Service to integrate location updates with place detection
 * This maintains a list of all places across all groups for the current user
 */
class LocationPlaceIntegration {
    private allPlaces: Map<string, Place[]> = new Map(); // groupId -> places
    private unsubscribers: (() => void)[] = [];
    private placesById: Map<string, { place: Place; groupId: string }> = new Map(); // placeId -> {place, groupId}

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

        // Listen to all user's groups
        const groupsUnsubscribe = getUserGroups(user.uid, (groups) => {
            console.log(`[LocationPlaceIntegration] Loaded ${groups.length} groups`);

            // For each group, listen to its places
            groups.forEach((group) => {
                const placesUnsubscribe = getGroupPlaces(group.id, (places) => {
                    console.log(`[LocationPlaceIntegration] Group ${group.name}: ${places.length} places`);
                    this.allPlaces.set(group.id, places);

                    // Update places by ID map for easy lookup
                    places.forEach((place) => {
                        this.placesById.set(place.id, { place, groupId: group.id });
                    });
                });
                this.unsubscribers.push(placesUnsubscribe);
            });
        });

        this.unsubscribers.push(groupsUnsubscribe);
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
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        this.allPlaces.clear();
        this.placesById.clear();
        placeDetectionService.reset();
    }
}

// Export singleton instance
export const locationPlaceIntegration = new LocationPlaceIntegration();
