import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createGroup } from "../services/databaseService";

export default function CreateGroupScreen() {
    const [groupName, setGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        setIsCreating(true);
        try {
            await createGroup(groupName.trim());
            Alert.alert('Success', 'Group created successfully!');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to create group: ' + (error as Error).message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <SafeAreaView style={theme.Component.PageContainer}>
            <PageHeader title="Create Group" showBackButton />
            <View style={[theme.Component.PageInnerContainer, { alignItems: 'center' }]}>
                <TextInput
                    style={{
                        borderWidth: 1,
                        borderColor: theme.Colors.Border,
                        padding: theme.Spacing.Gap.Md,
                        marginBottom: theme.Spacing.Gap.Lg,
                        width: '100%',
                        borderRadius: theme.Spacing.Borders.Md,
                        backgroundColor: theme.Colors.Background.Secondary,
                        color: theme.Colors.Text.Primary,
                    }}
                    placeholder="Enter group name"
                    placeholderTextColor={theme.Colors.Text.Secondary}
                    value={groupName}
                    onChangeText={setGroupName}
                    autoCapitalize="words"
                />
                <ThemedButton
                    title={isCreating ? "Creating..." : "Create Group"}
                    onPress={handleCreateGroup}
                    disabled={isCreating}
                />
            </View>
        </SafeAreaView>
    );
}