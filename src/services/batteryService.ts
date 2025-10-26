import * as Battery from 'expo-battery';

export interface BatteryInfo {
    level: number; // 0-100
    state: Battery.BatteryState;
    isCharging: boolean;
    timestamp: number;
}

/**
 * Get complete battery information using getPowerStateAsync
 */
export const getBatteryInfo = async (): Promise<BatteryInfo> => {
    try {
        const powerState = await Battery.getPowerStateAsync();

        // Convert from 0-1 to 0-100
        const level = Math.round(powerState.batteryLevel * 100);

        // Check if charging (state 3 = CHARGING or state 4 = FULL while plugged)
        const isCharging = powerState.batteryState === Battery.BatteryState.CHARGING ||
            powerState.batteryState === Battery.BatteryState.FULL;

        return {
            level,
            state: powerState.batteryState,
            isCharging,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('Error getting battery info:', error);
        return {
            level: -1,
            state: Battery.BatteryState.UNKNOWN,
            isCharging: false,
            timestamp: Date.now()
        };
    }
};