import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import theme from '../theme/theme';

interface ThemedButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    style?: ViewStyle;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
}

const ThemedButton: React.FC<ThemedButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    style,
    prefix,
    suffix,
}) => {
    const buttonStyle = [
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style,
    ];

    const textStyle = [
        styles.text,
        variant === 'primary' ? styles.primaryText : styles.secondaryText,
        disabled && styles.disabledText,
    ];

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            {prefix && <View style={styles.prefix}>{prefix}</View>}
            <Text style={textStyle}>{title}</Text>
            {suffix && <View style={styles.suffix}>{suffix}</View>}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: theme.Spacing.Gap.Md,
        paddingVertical: theme.Spacing.Gap.Md / 2,
        borderRadius: theme.Spacing.Borders.Xl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44, // For accessibility
        flexDirection: 'row',
    },
    primary: {
        backgroundColor: theme.Colors.Accent,
    },
    secondary: {
        backgroundColor: theme.Colors.Background.Secondary,
        borderWidth: 1,
        borderColor: theme.Colors.Border,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: theme.Colors.TextOnAccent,
    },
    secondaryText: {
        color: theme.Colors.Text.Primary,
    },
    disabledText: {
        // Text color remains the same for disabled state
    },
    prefix: {
        marginRight: theme.Spacing.Gap.Md / 2,
    },
    suffix: {
        marginLeft: theme.Spacing.Gap.Md / 2,
    },
});

export default ThemedButton;
