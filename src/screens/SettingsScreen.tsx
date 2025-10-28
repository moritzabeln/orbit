import GroupMemberCard from "@/src/components/GroupMemberCard";
import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import { getGroupNameAsync, subscribeToGroupMembers, subscribeToGroupPlaces, subscribeToUserGroupIds } from "@/src/services/databaseService";
import theme from "@/src/theme/theme";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Place, UserWithProfile } from "../models/database";
import { getCurrentUser, onAuthStateChange } from "../services/authService";

export default function SettingsScreen() {
    const router = useRouter();
    const [groupIds, setGroupIds] = useState<string[]>([]);
    const [user, setUser] = useState(getCurrentUser());
    const [groupMembers, setGroupMembers] = useState<{ [groupId: string]: UserWithProfile[] }>({});
    const [activeTabs, setActiveTabs] = useState<{ [groupId: string]: 'people' | 'places' }>({});
    const [groupPlaces, setGroupPlaces] = useState<{ [groupId: string]: Place[] }>({});
    const [groupNames, setGroupNames] = useState<{ [groupId: string]: string }>({});

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
            setGroupIds([]);
            setGroupMembers({});
            return;
        }

        let userUnsubscribers: (() => void)[] = [];

        const unsubscribeGroups = subscribeToUserGroupIds(user.uid, (userGroupIds) => {
            setGroupIds(userGroupIds);

            // Clean up old user listeners
            userUnsubscribers.forEach(unsubscribe => unsubscribe());
            userUnsubscribers = [];

            // Set up user listeners for all groups to get member data
            userGroupIds.forEach((groupId) => {
                const unsubscribeUsers = subscribeToGroupMembers(groupId, (members) => {
                    setGroupMembers(prev => ({
                        ...prev,
                        [groupId]: members
                    }));
                });
                userUnsubscribers.push(unsubscribeUsers);

                // Set up places listeners for all groups
                const unsubscribePlaces = subscribeToGroupPlaces(groupId, (places) => {
                    setGroupPlaces(prev => ({
                        ...prev,
                        [groupId]: places
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

    // Fetch group names when groupIds change
    useEffect(() => {
        const fetchGroupNames = async () => {
            const names: { [groupId: string]: string } = {};
            await Promise.all(
                groupIds.map(async (groupId) => {
                    const name = await getGroupNameAsync(groupId);
                    names[groupId] = name || 'Unknown Group';
                })
            );
            setGroupNames(names);
        };

        if (groupIds.length > 0) {
            fetchGroupNames();
        } else {
            setGroupNames({});
        }
    }, [groupIds]);

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

    const renderGroupItem = ({ item }: { item: string }) => {
        const members = groupMembers[item] || [];
        const activeTab = activeTabs[item] || 'people';

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
                    {groupNames[item]}
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
                        onPress={() => setActiveTabs(prev => ({ ...prev, [item]: 'people' }))}
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
                        onPress={() => setActiveTabs(prev => ({ ...prev, [item]: 'places' }))}
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
                                params: { groupId: item }
                            });
                        }} />
                        <FlatList
                            data={groupPlaces[item] || []}
                            keyExtractor={(place) => place.id}
                            renderItem={(placeInfo) => renderPlaceItem({ item: placeInfo.item, groupId: item })}
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

                {groupIds.length > 0 && (
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
                            data={groupIds}
                            keyExtractor={(item) => item}
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