import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import { User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onAuthStateChange, signInWithEmailPassword, signOutUser, signUpWithEmailPassword } from "../../../src/services/authService";

export default function SettingsAccountScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        try {
            let signedInUser: User;
            if (isSignUp) {
                signedInUser = await signUpWithEmailPassword(email, password);
                Alert.alert("Success", "Account created successfully!");
            } else {
                signedInUser = await signInWithEmailPassword(email, password);
                Alert.alert("Success", "Signed in successfully!");
            }
            setUser(signedInUser);
        } catch (error) {
            Alert.alert('Error', `${isSignUp ? 'Sign up' : 'Sign in'} failed: ` + (error as Error).message);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOutUser();
            setUser(null);
            Alert.alert("Success", "Signed out successfully!");
        } catch (error) {
            Alert.alert("Error", "Sign-out failed: " + (error as Error).message);
        }
    };

    return (
        <SafeAreaView style={theme.Component.PageContainer}>
            <PageHeader title="Account" showBackButton />
            {user ? (
                <View style={{ alignItems: "center" }}>
                    <Text style={styles.text}>Welcome, {user.displayName || user.email}!</Text>
                    <Text style={styles.text}>Email: {user.email}</Text>
                    <ThemedButton title="Sign Out" onPress={handleSignOut} />
                </View>
            ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <TextInput
                        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, width: '80%' }}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, width: '80%' }}
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                    <ThemedButton title={isSignUp ? "Sign Up" : "Sign In"} onPress={handleAuth} />
                    <ThemedButton
                        title={`Switch to ${isSignUp ? 'Sign In' : 'Sign Up'}`}
                        onPress={() => setIsSignUp(!isSignUp)}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = {
    text: {
        fontSize: 16,
        marginBottom: 10,
        color: theme.Colors.Text.Primary,
    },
};