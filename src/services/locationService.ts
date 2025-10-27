import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

export interface UserLocation {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    timestamp: number;
}

/**
 * Request foreground location permissions
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting location permissions:', error);
        return false;
    }
};

/**
 * Request background location permissions (needed for startLocationUpdatesAsync)
 */
export const requestBackgroundLocationPermissions = async (): Promise<boolean> => {
    try {
        const { status } = await Location.requestBackgroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting background location permissions:', error);
        return false;
    }
};

export const getCurrentLocation = async (): Promise<UserLocation | null> => {
    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
};

/**
 * Start background location updates
 * Uses startLocationUpdatesAsync for background tracking with less frequent updates
 */
export const startBackgroundLocationUpdates = async (): Promise<boolean> => {
    try {
        // Check if task is already registered
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

        if (isRegistered) {
            // For debugging.
            const forceRestart = true;
            if (forceRestart) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                console.log('[Background Location] Restarting task as forceRestart is true');
            } else {
                console.log('[Background Location] Already running');
                return true;
            }
        }

        // Request background permissions
        const hasBackgroundPermission = await requestBackgroundLocationPermissions();
        if (!hasBackgroundPermission) {
            console.warn('[Background Location] Background permission denied');
            return false;
        }

        // Start location updates
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 10000, // Update every 10 seconds in background
            distanceInterval: 10, // Or when moved 10 meters
            deferredUpdatesInterval: 30000,
            foregroundService: {
                notificationTitle: 'Orbit is tracking your location',
                notificationBody: 'Sharing location with your groups',
                killServiceOnDestroy: false,
            },
            pausesUpdatesAutomatically: false,
            activityType: Location.ActivityType.Fitness,
        });

        console.log('[Background Location] Started');
        return true;
    } catch (error) {
        console.error('[Background Location] Error starting:', error);
        return false;
    }
};

/**
 * Stop background location updates
 */
export const stopBackgroundLocationUpdates = async (): Promise<void> => {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

        if (isRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            console.log('[Background Location] Stopped');
        }
    } catch (error) {
        console.error('[Background Location] Error stopping:', error);
    }
};