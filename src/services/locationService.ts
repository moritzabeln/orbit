import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LOCATION_TASK_NAME } from './locationTaskDefinition';

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
        console.log(`[Background Location] Task registered: ${isRegistered}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

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

        let tasks = await TaskManager.getRegisteredTasksAsync();
        console.log(`[Background Location] Registered tasks: ${JSON.stringify(tasks)}`);

        const isBackgroundLocationAvailableAsync = await Location.isBackgroundLocationAvailableAsync();
        const hasServicesEnabledAsync = await Location.hasServicesEnabledAsync();
        console.log(`[Background Location] isBackgroundLocationAvailable: ${isBackgroundLocationAvailableAsync}, hasServicesEnabled: ${hasServicesEnabledAsync}`);
        // Wait for a short moment to ensure the checks are complete

        console.log('[Background Location] Waiting briefly to ensure services are ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Request background permissions
        const hasForegroundPermission = await requestLocationPermissions();
        if (!hasForegroundPermission) {
            console.warn('[Background Location] Foreground permission denied');
            return false;
        }
        const hasBackgroundPermission = await requestBackgroundLocationPermissions();
        if (!hasBackgroundPermission) {
            console.warn('[Background Location] Background permission denied');
            return false;
        }

        console.log(`[Background Location] Starting location updates with task name: ${LOCATION_TASK_NAME}`);
        // Start location updates
        await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }); // Warm up location services
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Highest,
            activityType: Location.ActivityType.Fitness,
            timeInterval: 1000, // Update every 1 second in background
            distanceInterval: 0,
            deferredUpdatesInterval: 5000,
            foregroundService: {
                notificationTitle: 'Orbit is tracking your location',
                notificationBody: 'Sharing location with your groups',
                killServiceOnDestroy: false,
            },
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: false,
            mayShowUserSettingsDialog: true,
        });
        await Location.watchPositionAsync({ accuracy: Location.Accuracy.Highest, timeInterval: 1000 }, (e) => {
            console.log(`[Background Location] Position changed: ${JSON.stringify(e)}`);
        });
        await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }); // Warm up location services

        console.log('[Background Location] Started');

        tasks = await TaskManager.getRegisteredTasksAsync();
        console.log(`[Background Location] Registered tasks: ${JSON.stringify(tasks)}`);

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