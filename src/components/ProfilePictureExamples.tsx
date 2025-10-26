import ProfilePicture from '@/src/components/ProfilePicture';
import theme from '@/src/theme/theme';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * ProfilePictureExamples - Demonstration component showing various use cases
 * This file serves as a reference for developers implementing profile pictures
 */
const ProfilePictureExamples: React.FC = () => {
    // Example user IDs (replace with real user IDs in production)
    const exampleUserId = 'user123';

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Profile Picture Examples</Text>

            {/* Example 1: Small Size (Chat/List) */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Small (32px) - Chat Messages</Text>
                <View style={styles.row}>
                    <ProfilePicture
                        userId={exampleUserId}
                        size={32}
                        borderWidth={2}
                    />
                    <Text style={styles.exampleText}>User sent a message</Text>
                </View>
            </View>

            {/* Example 2: Medium Size (Default) */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Medium (50px) - Default Map Marker</Text>
                <ProfilePicture
                    userId={exampleUserId}
                    size={50}
                />
            </View>

            {/* Example 3: Large Size (Profile Header) */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Large (100px) - Profile Header</Text>
                <ProfilePicture
                    userId={exampleUserId}
                    size={100}
                    borderColor={theme.Colors.Accent}
                    borderWidth={4}
                />
            </View>

            {/* Example 4: No Border */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Without Border</Text>
                <ProfilePicture
                    userId={exampleUserId}
                    size={60}
                    showBorder={false}
                />
            </View>

            {/* Example 5: Custom Border Color */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Custom Border Color (Accent)</Text>
                <ProfilePicture
                    userId={exampleUserId}
                    size={60}
                    borderColor={theme.Colors.Accent}
                    borderWidth={3}
                />
            </View>

            {/* Example 6: List Item */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>List Item Layout</Text>
                <View style={styles.listItem}>
                    <ProfilePicture
                        userId={exampleUserId}
                        size={48}
                    />
                    <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>John Doe</Text>
                        <Text style={styles.listItemSubtitle}>Last seen 2 hours ago</Text>
                    </View>
                </View>
            </View>

            {/* Example 7: Group of Profile Pictures */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Multiple Profiles (Overlapping)</Text>
                <View style={styles.profileGroup}>
                    <ProfilePicture
                        userId="user1"
                        size={40}
                        style={{ marginLeft: 0 }}
                    />
                    <ProfilePicture
                        userId="user2"
                        size={40}
                        style={{ marginLeft: -12 }}
                    />
                    <ProfilePicture
                        userId="user3"
                        size={40}
                        style={{ marginLeft: -12 }}
                    />
                </View>
            </View>

            {/* Example 8: With Background Card */}
            <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>Card Header with Profile</Text>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ProfilePicture
                            userId={exampleUserId}
                            size={40}
                            borderWidth={2}
                        />
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>User Activity</Text>
                            <Text style={styles.cardSubtitle}>2 hours ago</Text>
                        </View>
                    </View>
                    <Text style={styles.cardContent}>
                        This is an example of a card with a profile picture in the header.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

export default ProfilePictureExamples;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.Colors.Background.Primary,
        padding: theme.Spacing.Gap.Lg,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.Colors.Text.Primary,
        marginBottom: theme.Spacing.Gap.Lg,
    },
    exampleContainer: {
        marginBottom: theme.Spacing.Gap.Lg,
        padding: theme.Spacing.Gap.Md,
        backgroundColor: theme.Colors.Background.Secondary,
        borderRadius: theme.Spacing.Borders.Md,
        borderWidth: 1,
        borderColor: theme.Colors.Border,
    },
    exampleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.Colors.Text.Primary,
        marginBottom: theme.Spacing.Gap.Md,
    },
    exampleText: {
        fontSize: 14,
        color: theme.Colors.Text.Secondary,
        marginLeft: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.Spacing.Gap.Md,
        backgroundColor: theme.Colors.Background.Primary,
        borderRadius: theme.Spacing.Borders.Md,
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
    profileGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    card: {
        backgroundColor: theme.Colors.Background.Primary,
        borderRadius: theme.Spacing.Borders.Md,
        padding: theme.Spacing.Gap.Md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.Spacing.Gap.Md,
    },
    cardHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.Colors.Text.Primary,
    },
    cardSubtitle: {
        fontSize: 12,
        color: theme.Colors.Text.Secondary,
        marginTop: 2,
    },
    cardContent: {
        fontSize: 14,
        color: theme.Colors.Text.Secondary,
        lineHeight: 20,
    },
});
