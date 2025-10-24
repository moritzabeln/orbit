import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import theme from '../theme/theme';

interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightContent?: React.ReactNode;
    style?: ViewStyle;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    showBackButton = false,
    onBackPress,
    rightContent,
    style,
}) => {
    const router = useRouter();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.leftSection}>
                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={theme.Colors.Text.Primary}
                        />
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>{title}</Text>
            </View>

            {rightContent && (
                <View style={styles.rightSection}>
                    {rightContent}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.Spacing.Gap.Md,
        paddingVertical: theme.Spacing.Gap.Md,
        backgroundColor: theme.Colors.Background.Primary,
        // borderBottomWidth: 1,
        borderBottomColor: theme.Colors.Border,
        minHeight: 60,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: theme.Spacing.Gap.Md / 2,
        padding: 4,
        borderRadius: theme.Spacing.Borders.Md,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.Colors.Text.Primary,
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default PageHeader;