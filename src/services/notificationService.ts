import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification handler to determine how notifications are displayed
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions
 * @returns true if permissions were granted, false otherwise
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permissions not granted');
            return false;
        }

        // Set up notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('place-notifications', {
                name: 'Place Notifications',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
};

/**
 * Schedule a local notification
 * @param title - Notification title
 * @param body - Notification body text
 */
export const scheduleLocalNotification = async (title: string, body: string): Promise<void> => {
    try {
        console.log('Scheduling notification:', title, body);
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // null means show immediately
        });
    } catch (error) {
        console.error('Error scheduling notification:', error);
    }
};

/**
 * Show notification for member arriving at a place
 * @param memberName - Display name of the member
 * @param placeName - Name of the place
 */
export const notifyMemberArrived = async (memberName: string, placeName: string): Promise<void> => {
    await scheduleLocalNotification(
        `${memberName} arrived`,
        `${memberName} arrived at ${placeName}`
    );
};

/**
 * Show notification for member leaving a place
 * @param memberName - Display name of the member
 * @param placeName - Name of the place
 */
export const notifyMemberLeft = async (memberName: string, placeName: string): Promise<void> => {
    await scheduleLocalNotification(
        `${memberName} left`,
        `${memberName} left ${placeName}`
    );
};
