import * as Linking from 'expo-linking';
import { User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth, isSignInWithEmailLink, onAuthStateChange, sendSignInLink, signInWithEmailLinkAuth, signOutUser } from "../../src/services/authService";

export default function SettingsAccountScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser);
        });

        const handleUrl = async (url: string) => {
            if (isSignInWithEmailLink(auth, url)) {
                Alert.prompt('Enter your email', 'Enter the email you used to sign in', (inputEmail) => {
                    if (inputEmail) {
                        signInWithEmailLinkAuth(inputEmail, url)
                            .then((signedInUser) => {
                                setUser(signedInUser);
                                Alert.alert("Success", "Signed in successfully!");
                            })
                            .catch((error) => {
                                Alert.alert("Error", "Sign-in failed: " + (error as Error).message);
                            });
                    }
                });
            }
        };

        Linking.getInitialURL().then(url => {
            if (url) handleUrl(url);
        });

        const subscription = Linking.addEventListener('url', (event) => {
            handleUrl(event.url);
        });

        return () => {
            unsubscribe();
            subscription.remove();
        };
    }, []);

    const handleSendSignInLink = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        try {
            await sendSignInLink(email);
            Alert.alert('Success', 'Sign-in link sent to your email');
        } catch (error) {
            Alert.alert('Error', 'Failed to send sign-in link: ' + (error as Error).message);
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Account</Text>
            {user ? (
                <View style={{ alignItems: "center" }}>
                    <Text>Welcome, {user.displayName || user.email}!</Text>
                    <Text>Email: {user.email}</Text>
                    <Button title="Sign Out" onPress={handleSignOut} />
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
                    <Button title="Send Sign-In Link" onPress={handleSendSignInLink} />
                </View>
            )}
        </View>
    );
}