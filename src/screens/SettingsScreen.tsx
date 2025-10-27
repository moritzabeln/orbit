import GroupMemberCard from "@/src/components/GroupMemberCard";
import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Group, Place, UserWithProfile } from "../models/database";
import { getCurrentUser, onAuthStateChange } from "../services/authService";
import { getGroupMembers, getGroupPlaces, getUserGroups } from "../services/databaseService";

export default function SettingsScreen() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [user, setUser] = useState(getCurrentUser());
    const [groupMembers, setGroupMembers] = useState<{ [groupId: string]: UserWithProfile[] }>({});
    const [activeTabs, setActiveTabs] = useState<{ [groupId: string]: 'people' | 'places' }>({});
    const [groupPlaces, setGroupPlaces] = useState<{ [groupId: string]: Place[] }>({});

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

                // Set up places listeners for all groups
                const unsubscribePlaces = getGroupPlaces(group.id, (places) => {
                    setGroupPlaces(prev => ({
                        ...prev,
                        [group.id]: places
                    }));
                });
                userUnsubscribers.push(unsubscribePlaces);
            });
        });

        return () => {
            unsubscribeGroups();
            userUnsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [user]);

    const renderPlaceItem = ({ item, groupId }: { item: Place, groupId: string }) => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: theme.Colors.Background.Primary,
            borderRadius: 8,
            marginBottom: 8,
        }}>
            <Ionicons name="location" size={20} color={theme.Colors.Text.Primary} />
            <Text style={{
                flex: 1,
                fontSize: 16,
                color: theme.Colors.Text.Primary,
                marginLeft: 12,
            }}>
                {item.name}
            </Text>
            <TouchableOpacity
                style={{
                    padding: 8,
                    backgroundColor: theme.Colors.Background.Secondary,
                    borderRadius: 4,
                }}
                onPress={() => {
                    router.push({
                        pathname: '/settings/group/add-place',
                        params: {
                            groupId: groupId,
                            placeId: item.id,
                            placeData: JSON.stringify({
                                name: item.name,
                                lat: item.lat,
                                lng: item.lng,
                                radius: item.radius,
                            })
                        }
                    });
                }}
            >
                <Ionicons name="pencil" size={16} color={theme.Colors.Text.Primary} />
            </TouchableOpacity>
        </View>
    );

    const renderGroupItem = ({ item }: { item: Group }) => {
        const members = groupMembers[item.id] || [];
        const activeTab = activeTabs[item.id] || 'people';

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
                    marginBottom: 12,
                }}>
                    {item.name}
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'people' ? theme.Colors.Background.Primary : theme.Colors.Background.Secondary,
                            borderRadius: 4,
                            marginRight: 4,
                        }}
                        onPress={() => setActiveTabs(prev => ({ ...prev, [item.id]: 'people' }))}
                    >
                        <Text style={{
                            fontSize: 14,
                            fontWeight: activeTab === 'people' ? '600' : '400',
                            color: theme.Colors.Text.Primary,
                        }}>
                            People
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'places' ? theme.Colors.Background.Primary : theme.Colors.Background.Secondary,
                            borderRadius: 4,
                            marginLeft: 4,
                        }}
                        onPress={() => setActiveTabs(prev => ({ ...prev, [item.id]: 'places' }))}
                    >
                        <Text style={{
                            fontSize: 14,
                            fontWeight: activeTab === 'places' ? '600' : '400',
                            color: theme.Colors.Text.Primary,
                        }}>
                            Places
                        </Text>
                    </TouchableOpacity>
                </View>
                {activeTab === 'people' && members.map((member) => (
                    <GroupMemberCard
                        key={member.userId}
                        userId={member.userId}
                        name={member.profile.displayName}
                        batteryLevel={member.profile.batteryLevel}
                        batteryState={member.profile.batteryState}
                    />
                ))}
                {activeTab === 'places' && (
                    <View>
                        <ThemedButton title="Add place" onPress={() => {
                            router.push({
                                pathname: '/settings/group/add-place',
                                params: { groupId: item.id }
                            });
                        }} />
                        <FlatList
                            data={groupPlaces[item.id] || []}
                            keyExtractor={(place) => place.id}
                            renderItem={(placeInfo) => renderPlaceItem({ item: placeInfo.item, groupId: item.id })}
                            showsVerticalScrollIndicator={false}
                            style={{ width: '100%', marginTop: 12 }}
                        />
                    </View>
                )}
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