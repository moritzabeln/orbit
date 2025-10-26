import ProfilePicture from '@/src/components/ProfilePicture';
import theme from '@/src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface GroupMemberCardProps {
    userId: string;
    name?: string;
    batteryLevel?: number;
    batteryState?: number; // 1=UNKNOWN, 2=UNPLUGGED, 3=CHARGING, 4=FULL
    style?: ViewStyle;
}

const GroupMemberCard: React.FC<GroupMemberCardProps> = ({
    userId,
    name,
    batteryLevel,
    batteryState,
    style,
}) => {
    const isCharging = batteryState === 3 || batteryState === 4; // CHARGING or FULL

    const getBatteryColor = (level?: number): string => {
        if (level === undefined || level < 0) return theme.Colors.Text.Secondary;
        if (isCharging) return '#34C759'; // Green when charging
        if (level <= 20) return '#FF3B30'; // Red for low battery
        if (level <= 50) return '#FF9500'; // Orange for medium battery
        return '#34C759'; // Green for good battery
    };

    const getBatteryIcon = (level?: number): keyof typeof Ionicons.glyphMap => {
        if (level === undefined || level < 0) return 'battery-dead-outline';
        if (isCharging) return 'battery-charging';
        if (level <= 20) return 'battery-dead';
        if (level <= 50) return 'battery-half';
        return 'battery-full';
    };

    return (
        <View style={[styles.listItem, style]}>
            <ProfilePicture
                userId={userId}
                size={48}
            />
            <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{name || 'Unknown User'}</Text>
                <View style={styles.subtitleRow}>
                    {batteryLevel !== undefined && batteryLevel >= 0 && (
                        <View style={styles.batteryContainer}>
                            <Ionicons
                                name={getBatteryIcon(batteryLevel)}
                                size={16}
                                color={getBatteryColor(batteryLevel)}
                            />
                            <Text style={[styles.batteryText, { color: getBatteryColor(batteryLevel) }]}>
                                {batteryLevel}%
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default GroupMemberCard;

const styles = StyleSheet.create({
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.Spacing.Gap.Md,
        backgroundColor: theme.Colors.Background.Primary,
        borderRadius: theme.Spacing.Borders.Md,
        marginBottom: theme.Spacing.Gap.Md,
    },
    listItemContent: {
        marginLeft: 12,
        flex: 1,
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.Colors.Text.Primary,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 8,
    },
    listItemSubtitle: {
        fontSize: 14,
        color: theme.Colors.Text.Secondary,
    },
    batteryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    batteryText: {
        fontSize: 13,
        fontWeight: '500',
    },
});
