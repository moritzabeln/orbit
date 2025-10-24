import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
    const router = useRouter();

    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>Settings</Text>
            <TouchableOpacity onPress={() => {
                router.navigate('/settings/account');
            }}>
                <Text>Account</Text>
            </TouchableOpacity>
        </View>
    );
}
