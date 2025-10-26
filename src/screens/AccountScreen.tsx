import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import * as ImagePicker from 'expo-image-picker';
import { User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onAuthStateChange, signInWithEmailPassword, signOutUser, signUpWithEmailPassword } from "../services/authService";
import { getProfilePictureURL, uploadProfilePicture } from "../services/storageService";

export default function AccountScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [profilePictureURL, setProfilePictureURL] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            setUser(currentUser);
            console.log(`Auth state changed. Current user is now: ${currentUser ? currentUser.email : 'null'} UID: ${currentUser ? currentUser.uid : 'N/A'}`);

            if (!currentUser) {
                setProfilePictureURL(null);
            } else {
                await getProfilePictureURL(currentUser.uid).then((url) => {
                    setProfilePictureURL(url);
                }).catch((error) => {
                    console.error('Error fetching profile picture URL:', error);
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const pickImage = async () => {
        if (!user) return;

        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select a profile picture.');
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5, // Compress to reduce upload size
        });

        if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        if (!user) return;

        setIsUploadingImage(true);
        try {
            // Upload to the API
            await uploadProfilePicture(user.uid, uri);

            // Fetch the new profile picture (cache was cleared by upload)
            const newURL = await getProfilePictureURL(user.uid);
            setProfilePictureURL(newURL);

            Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to upload profile picture: ' + (error as Error).message);
            console.log('Error uploading image:', error);
        } finally {
            setIsUploadingImage(false);
        }
    };

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
                <View style={styles.container}>
                    <TouchableOpacity onPress={pickImage} disabled={isUploadingImage}>
                        <View style={styles.profilePictureContainer}>
                            {isUploadingImage ? (
                                <View style={styles.profilePicture}>
                                    <ActivityIndicator size="large" color={theme.Colors.Accent} />
                                </View>
                            ) : profilePictureURL ? (
                                <Image source={{ uri: profilePictureURL }} style={styles.profilePicture} />
                            ) : (
                                <View style={styles.profilePicturePlaceholder}>
                                    <Text style={styles.placeholderText}>
                                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Text style={styles.editBadgeText}>✏️</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
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

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20,
    },
    profilePictureContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    profilePicture: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.Colors.Background.Secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePicturePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.Colors.Accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 48,
        color: theme.Colors.TextOnAccent,
        fontWeight: 'bold',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.Colors.Accent,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: theme.Colors.Background.Primary,
    },
    editBadgeText: {
        fontSize: 18,
    },
    text: {
        fontSize: 16,
        marginBottom: 10,
        color: theme.Colors.Text.Primary,
    },
});