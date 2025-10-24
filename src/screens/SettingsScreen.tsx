import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={[theme.Component.PageContainer, { alignItems: "center" }]}>
            <PageHeader title="Settings" />
            <View style={theme.Component.PageInnerContainer}>
                <ThemedButton title="Account" onPress={() => {
                    router.navigate('/settings/account');
                }} />
            </View>
        </SafeAreaView>
    );
}