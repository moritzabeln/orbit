import * as Location from 'expo-location';

export interface UserLocation {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    timestamp: number;
}

export const requestLocationPermissions = async (): Promise<boolean> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting location permissions:', error);
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

export const watchLocation = (
    callback: (location: UserLocation) => void,
    errorCallback?: (error: any) => void
): (() => void) => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
        try {
            const hasPermission = await requestLocationPermissions();
            if (!hasPermission) {
                errorCallback?.(new Error('Location permission denied'));
                return;
            }

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 10000, // Update every 10 seconds
                    distanceInterval: 10, // Or when moved 10 meters
                },
                (location) => {
                    const userLocation: UserLocation = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy,
                        timestamp: location.timestamp,
                    };
                    callback(userLocation);
                }
            );
        } catch (error) {
            console.error('Error watching location:', error);
            errorCallback?.(error);
        }
    };

    startWatching();

    return () => {
        if (subscription) {
            subscription.remove();
        }
    };
};