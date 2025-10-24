import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUser, onAuthStateChange } from "../services/authService";
import { getUserGroups, Group } from "../services/databaseService";

export default function SettingsScreen() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [user, setUser] = useState(getCurrentUser());

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
            return;
        }

        const unsubscribeGroups = getUserGroups(user.uid, (userGroups) => {
            setGroups(userGroups);
        });

        return () => {
            unsubscribeGroups();
        };
    }, [user]);

    const renderGroupItem = ({ item }: { item: Group }) => (
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
            }}>
                {item.name}
            </Text>
        </View>
    );

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