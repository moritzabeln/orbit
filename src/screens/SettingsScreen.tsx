import GroupMemberCard from "@/src/components/GroupMemberCard";
import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUser, onAuthStateChange } from "../services/authService";
import { getGroupMembers, getUserGroups, Group, UserWithProfile } from "../services/databaseService";

export default function SettingsScreen() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [user, setUser] = useState(getCurrentUser());
    const [groupMembers, setGroupMembers] = useState<{ [groupId: string]: UserWithProfile[] }>({});

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChange((currentUser) => {
            setUser(currentUser);
        });

        return () => {
            unsubscribeAuth();
        };
    }, []);

    useEffect(() => {
        if (!user) {
            setGroups([]);
            setGroupMembers({});
            return;
        }

        let userUnsubscribers: (() => void)[] = [];

        const unsubscribeGroups = getUserGroups(user.uid, (userGroups) => {
            setGroups(userGroups);

            // Clean up old user listeners
            userUnsubscribers.forEach(unsubscribe => unsubscribe());
            userUnsubscribers = [];

            // Set up user listeners for all groups to get member data
            userGroups.forEach((group) => {
                const unsubscribeUsers = getGroupMembers(group.id, (members) => {
                    setGroupMembers(prev => ({
                        ...prev,
                        [group.id]: members
                    }));
                });
                userUnsubscribers.push(unsubscribeUsers);
            });
        });

        return () => {
            unsubscribeGroups();
            userUnsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [user]);

    const renderGroupItem = ({ item }: { item: Group }) => {
        const members = groupMembers[item.id] || [];

        return (
            <View style={{
                padding: theme.Spacing.Gap.Md,
                marginBottom: theme.Spacing.Gap.Md,
                backgroundColor: theme.Colors.Background.Secondary,
                borderRadius: theme.Spacing.Borders.Md,
                borderWidth: 1,
                borderColor: theme.Colors.Border,
            }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.Colors.Text.Primary,
                    marginBottom: members.length > 0 ? 12 : 0,
                }}>
                    {item.name}
                </Text>
                {members.map((member) => (
                    <GroupMemberCard
                        key={member.userId}
                        userId={member.userId}
                        name={member.profile.displayName}
                        batteryLevel={member.profile.batteryLevel}
                        batteryState={member.profile.batteryState}
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[theme.Component.PageContainer, {}]}>
            <PageHeader title="Settings" />
            <View style={theme.Component.PageInnerContainer}>
                <ThemedButton title="Account" onPress={() => {
                    router.navigate('/settings/account');
                }} />
                <View style={{ height: theme.Spacing.Gap.Md }} />
                <ThemedButton title="Create Group" onPress={() => {
                    router.navigate('/settings/create-group');
                }} />

                {groups.length > 0 && (
                    <>
                        <View style={{ height: theme.Spacing.Gap.Lg }} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: theme.Colors.Text.Primary,
                            alignSelf: 'flex-start',
                            marginBottom: theme.Spacing.Gap.Md,
                        }}>
                            Your Groups
                        </Text>
                        <FlatList
                            data={groups}
                            keyExtractor={(item) => item.id}
                            renderItem={renderGroupItem}
                            showsVerticalScrollIndicator={false}
                            style={{ width: '100%' }}
                        />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}