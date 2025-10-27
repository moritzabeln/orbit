import React from 'react';
import { StyleSheet, View } from 'react-native';
import ProfilePicture from './ProfilePicture';

interface MapProfilePictureProps {
    userId: string;
    size?: number;
    showBorder?: boolean;
    borderColor?: string;
    borderWidth?: number;
    speed?: number; // Speed in m/s
    showSpeedBadge?: boolean;
}

/**
 * MapProfilePicture component - wrapper around ProfilePicture designed for map markers
 * 
 * This component adds padding around the ProfilePicture to ensure that elements like
 * the speed badge don't get clipped by the map marker's bounds. Map markers use the
 * outer component's dimensions to determine their clickable/visible area, so we need
 * to add invisible padding for absolutely positioned elements.
 * 
 * Features:
 * - Adds top/horizontal padding to accommodate speed badge
 * - Maintains proper centering for map markers
 * - Transparent container to avoid visual artifacts
 */
const MapProfilePicture: React.FC<MapProfilePictureProps> = ({
    userId,
    size = 50,
    showBorder = true,
    borderColor = '#fff',
    borderWidth = 3,
    speed,
    showSpeedBadge = false,
}) => {
    // Calculate padding needed for the badge
    // Badge is positioned at top: -8, and has a height of ~24px
    const topPadding = showSpeedBadge ? 20 : 0;
    const sidePadding = showSpeedBadge ? 10 : 0; // Small padding on sides for badge width

    return (
        <View style={[styles.container, {
            paddingTop: topPadding,
            paddingHorizontal: sidePadding
        }]}>
            <ProfilePicture
                userId={userId}
                size={size}
                showBorder={showBorder}
                borderColor={borderColor}
                borderWidth={borderWidth}
                speed={speed}
                showSpeedBadge={showSpeedBadge}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Transparent container that provides padding for absolutely positioned elements
        backgroundColor: 'transparent',
    },
});

export default MapProfilePicture;
