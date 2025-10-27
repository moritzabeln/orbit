import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { MemberLocation } from '../models/database';
import { getCurrentUser } from './authService';
import { getBatteryInfo } from './batteryService';
import { updatePositionInAllGroups, updateUserBattery } from './databaseService';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

/**
 * Define the background location task at the global scope
 * This MUST be called at the top level, not inside any function
 * 
 * This file is imported at the app's entry point to ensure the task
 * is defined before it's registered or executed in the background.
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error('[Location Task] Error:', error);
        return;
    }

    if (data) {
        const { locations } = data;
        console.log('[Location Task] Locations received:', locations);

        if (locations && locations.length > 0) {
            try {
                const user = getCurrentUser();
                if (!user) {
                    console.log('[Background Task] No authenticated user, skipping update');
                    return;
                }

                const userLocations: MemberLocation[] = locations.map((loc: Location.LocationObject) => ({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    accuracy: loc.coords.accuracy,
                    timestamp: loc.timestamp,
                    heading: loc.coords.heading,
                    speed: loc.coords.speed,
                }));

                // Get the latest location
                const latestLocation = userLocations.sort((a, b) => b.timestamp - a.timestamp)[0];
                await updatePositionInAllGroups(user.uid, latestLocation);

                // Also update battery info alongside location
                const batteryInfo = await getBatteryInfo();
                if (batteryInfo.level >= 0) {
                    await updateUserBattery(user.uid, batteryInfo.level, batteryInfo.state);
                    console.log(`[Background Task] Position & Battery updated: ${batteryInfo.level}%, charging: ${batteryInfo.isCharging}`);
                }
            } catch (error) {
                console.error('[Background Task] Error updating position/battery:', error);
            }
        }
    }
});
