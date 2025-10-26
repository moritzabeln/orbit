import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import * as ImagePicker from 'expo-image-picker';
import { User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onAuthStateChange, signInWithEmailPassword, signOutUser, signUpWithEmailPassword } from "../services/authService";
import { getUserProfile, updateUserProfile, UserProfile } from "../services/databaseService";
import { getProfilePictureURL, uploadProfilePicture } from "../services/storageService";

export default function AccountScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [profilePictureURL, setProfilePictureURL] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            setUser(currentUser);
            console.log(`Auth state changed. Current user is now: ${currentUser ? currentUser.email : 'null'} UID: ${currentUser ? currentUser.uid : 'N/A'}`);

            if (!currentUser) {
                setProfilePictureURL(null);
                setUserProfile(null);
                setDisplayName('');
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

    // Subscribe to user profile changes
    useEffect(() => {
        if (!user) return;

        const unsubscribe = getUserProfile(user.uid, (profile) => {
            setUserProfile(profile);
            setDisplayName(profile?.displayName || '');
        });

        return () => {
            unsubscribe();
        };
    }, [user]);

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

    const handleSaveDisplayName = async () => {
        if (!user) return;

        try {
            await updateUserProfile(user.uid, {
                displayName: displayName.trim() || undefined,
                email: user.email || undefined,
            });
            setIsEditingDisplayName(false);
            Alert.alert("Success", "Display name updated successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to update display name: " + (error as Error).message);
        }
    };

    const handleCancelEditDisplayName = () => {
        setDisplayName(userProfile?.displayName || '');
        setIsEditingDisplayName(false);
    };

    return (
        <SafeAreaView style={theme.Component.PageContainer}>
            <PageHeader title="Account" showBackButton />
            {user ? (
                <View style={styles.container}>
                    {/* Profile Picture */}
                    <TouchableOpacity onPress={pickImage} disabled={isUploadingImage}>
                        <View style={styles.profilePictureContainer}>
                            {isUploadingImage ? (
                                <View style={styles.profilePicture}>
                                    <ActivityIndicator size="large" color={theme.Colors.Accent} />
                                </View>
                            ) : profilePictureURL ? (
                                <Image source={{ uri: profilePictureURL, cache: 'reload' }} style={styles.profilePicture} />
                            ) : (
                                <View style={styles.profilePicturePlaceholder}>
                                    <Text style={styles.placeholderText}>
                                        {displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Text style={styles.editBadgeText}>✏️</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Display Name Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Name</Text>
                            {isEditingDisplayName ? (
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity onPress={handleCancelEditDisplayName}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSaveDisplayName}>
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setIsEditingDisplayName(true)}>
                                    <Text style={styles.editButton}>Edit</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {isEditingDisplayName ? (
                            <TextInput
                                style={styles.input}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Enter your display name"
                                placeholderTextColor={theme.Colors.Text.Secondary}
                                autoFocus
                            />
                        ) : (
                            <Text style={styles.infoValue}>
                                {displayName || 'Not set'}
                            </Text>
                        )}
                    </View>

                    {/* Email Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user.email}</Text>
                    </View>

                    <View style={styles.signOutButtonContainer}>
                        <ThemedButton title="Sign Out" onPress={handleSignOut} />
                    </View>
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
        width: '100%',
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
    infoCard: {
        ...theme.Component.Card,
        width: '100%',
        marginBottom: theme.Spacing.Gap.Md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: theme.Colors.Text.Secondary,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 18,
        color: theme.Colors.Text.Primary,
        fontWeight: '500',
    },
    editButton: {
        fontSize: 14,
        color: theme.Colors.Accent,
        fontWeight: '600',
    },
    saveButtonText: {
        fontSize: 14,
        color: theme.Colors.Accent,
        fontWeight: '600',
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#EF4444', // Red color for cancel
        fontWeight: '600',
    },
    input: {
        backgroundColor: theme.Colors.Background.Primary,
        borderWidth: 1,
        borderColor: theme.Colors.Border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: theme.Colors.Text.Primary,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: theme.Colors.Accent,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: theme.Colors.TextOnAccent,
        fontSize: 14,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.Colors.Border,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: theme.Colors.Text.Primary,
        fontSize: 14,
        fontWeight: '600',
    },
    signOutButtonContainer: {
        width: '100%',
        marginTop: theme.Spacing.Gap.Md,
    },
    text: {
        fontSize: 16,
        marginBottom: 10,
        color: theme.Colors.Text.Primary,
    },
});