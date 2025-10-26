import ProfilePicture from '@/src/components/ProfilePicture';
import theme from '@/src/theme/theme';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface GroupMemberCardProps {
    userId: string;
    name?: string;
    style?: ViewStyle;
}

const GroupMemberCard: React.FC<GroupMemberCardProps> = ({
    userId,
    name,
    style,
}) => {
    return (
        <View style={[styles.listItem, style]}>
            <ProfilePicture
                userId={userId}
                size={48}
            />
            <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{name || 'Unknown User'}</Text>
                <Text style={styles.listItemSubtitle}>Last seen 42 mins ago</Text>
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
    listItemSubtitle: {
        fontSize: 14,
        color: theme.Colors.Text.Secondary,
        marginTop: 2,
    },
});
