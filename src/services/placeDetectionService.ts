import { MemberLocation, Place } from '../models/database';
import { getCurrentUser } from './authService';
import {
    removeMemberFromPlace,
    setMemberAtPlace
} from './databaseService';

/**
 * Location cache entry
 */
interface LocationCacheEntry {
    location: MemberLocation;
    timestamp: number;
}

/**
 * Place detection state for tracking consecutive detections
 */
interface PlaceDetectionState {
    placeId: string;
    consecutiveDetections: number;
}

/**
 * Service to manage location caching and place detection.
 * Detects when a user is present at defined places based on location updates.
 * Caches the last X location updates and requires Y consecutive detections to confirm presence in a place.
 */
class PlaceDetectionService {
    private locationCache: LocationCacheEntry[] = [];
    private readonly MAX_CACHE_SIZE = 5;
    private readonly REQUIRED_CONSECUTIVE_DETECTIONS = 3;
    private placeDetectionStates: Map<string, PlaceDetectionState> = new Map();
    private currentPlaces: Set<string> = new Set(); // Places user is currently at

    /**
     * Add a location to the cache (maintains last 5 locations)
     */
    addLocationToCache(location: MemberLocation): void {
        const entry: LocationCacheEntry = {
            location,
            timestamp: Date.now()
        };

        this.locationCache.push(entry);

        // Keep only the last 5 locations
        if (this.locationCache.length > this.MAX_CACHE_SIZE) {
            this.locationCache.shift();
        }

        console.log(`[PlaceDetection] Cache size: ${this.locationCache.length}`);
    }

    /**
     * Get the cached locations
     */
    getLocationCache(): LocationCacheEntry[] {
        return [...this.locationCache];
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @returns Distance in meters
     */
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Check if a location is within a place's radius
     */
    private isLocationInPlace(location: MemberLocation, place: Place): boolean {
        const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            place.lat,
            place.lng
        );
        return distance <= place.radius;
    }

    /**
     * Process location update and detect places
     * @param location - New location update
     * @param groupId - Group ID
     * @param places - Array of places to check against
     */
    async processLocationUpdate(
        location: MemberLocation,
        groupId: string,
        places: Place[]
    ): Promise<void> {
        const user = getCurrentUser();
        if (!user) {
            console.warn('[PlaceDetection] No authenticated user');
            return;
        }

        // Add to cache
        this.addLocationToCache(location);

        // Check each place
        for (const place of places) {
            const isInPlace = this.isLocationInPlace(location, place);
            const stateKey = `${groupId}-${place.id}`;
            const currentState = this.placeDetectionStates.get(stateKey);

            if (isInPlace) {
                // User is within the place radius
                if (currentState) {
                    // Increment consecutive detections
                    currentState.consecutiveDetections++;
                    this.placeDetectionStates.set(stateKey, currentState);

                    console.log(
                        `[PlaceDetection] ${place.name}: ${currentState.consecutiveDetections}/${this.REQUIRED_CONSECUTIVE_DETECTIONS} detections`
                    );

                    // Check if threshold is met
                    if (
                        currentState.consecutiveDetections >= this.REQUIRED_CONSECUTIVE_DETECTIONS &&
                        !this.currentPlaces.has(place.id)
                    ) {
                        // User has arrived at the place
                        console.log(`[PlaceDetection] User arrived at ${place.name}`);
                        this.currentPlaces.add(place.id);
                        await setMemberAtPlace(groupId, place.id, user.uid, {
                            arrivedAt: Date.now(),
                            userId: user.uid
                        });
                        console.log(`Current places: ${Array.from(this.currentPlaces).join(', ')}`);
                    }
                } else {
                    // First detection
                    this.placeDetectionStates.set(stateKey, {
                        placeId: place.id,
                        consecutiveDetections: 1
                    });
                    console.log(`[PlaceDetection] First detection at ${place.name}`);
                }
            } else {
                // User is not within the place radius
                if (currentState) {
                    // Reset consecutive detections
                    this.placeDetectionStates.delete(stateKey);
                }

                if (this.currentPlaces.has(place.id)) {
                    // User has left the place
                    console.log(`[PlaceDetection] User left ${place.name}`);
                    this.currentPlaces.delete(place.id);
                    await removeMemberFromPlace(groupId, place.id, user.uid);
                }
            }
        }
    }

    /**
     * Reset detection state (useful when switching groups or signing out)
     */
    reset(): void {
        this.locationCache = [];
        this.placeDetectionStates.clear();
        this.currentPlaces.clear();
        console.log('[PlaceDetection] State reset');
    }

    /**
     * Get current places user is at
     */
    getCurrentPlaces(): string[] {
        return Array.from(this.currentPlaces);
    }
}

// Export singleton instance
export const placeDetectionService = new PlaceDetectionService();
