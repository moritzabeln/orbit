import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View, ViewStyle } from 'react-native';
import { getProfilePictureURL } from '../services/storageService';
import theme from '../theme/theme';

interface ProfilePictureProps {
    userId: string;
    size?: number;
    showBorder?: boolean;
    borderColor?: string;
    borderWidth?: number;
    style?: ViewStyle;
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * ProfilePicture component - displays a user's profile picture with loading and error states
 * 
 * Features:
 * - Automatic loading from storage service
 * - Loading indicator while fetching
 * - Fallback to placeholder icon if no image or error
 * - Customizable size, border, and styling
 * - Caching handled by storage service
 */
const ProfilePicture: React.FC<ProfilePictureProps> = ({
    userId,
    size = 50,
    showBorder = true,
    borderColor = '#fff',
    borderWidth = 3,
    style,
    onLoad,
    onError,
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadImage = async () => {
            setIsLoading(true);
            setHasError(false);

            try {
                const url = await getProfilePictureURL(userId);
                if (mounted) {
                    setImageUrl(url);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error loading profile picture:', error);
                if (mounted) {
                    setHasError(true);
                    setIsLoading(false);
                    onError?.();
                }
            }
        };

        loadImage();

        return () => {
            mounted = false;
        };
    }, [userId, onError]);

    const containerStyle: ViewStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.Colors.Accent,
        borderWidth: showBorder ? borderWidth : 0,
        borderColor: showBorder ? borderColor : 'transparent',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        ...style,
    };

    const imageStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    const iconSize = Math.max(size * 0.5, 16);

    return (
        <View style={containerStyle}>
            {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : imageUrl && !hasError ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={imageStyle}
                    onLoad={onLoad}
                    onError={() => {
                        setHasError(true);
                        onError?.();
                    }}
                />
            ) : (
                <Ionicons name="person" size={iconSize} color="#fff" />
            )}
        </View>
    );
};

export default ProfilePicture;
