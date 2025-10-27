import MapProfilePicture from '@/src/components/MapProfilePicture';
import ThemedButton from '@/src/components/ThemedButton';
import theme from '@/src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'firebase/auth';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { MemberLocation, UserWithLocation } from '../models/database';
import { onAuthStateChange } from '../services/authService';
import { getGroupPositions, getUserGroups } from '../services/databaseService';

type Position = { latitude: number; longitude: number };

function computeRegion(positions: Position[]): Region {
    if (positions.length === 0) {
        // Default region when no positions available
        return {
            latitude: 50.9380,
            longitude: 6.9578,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
        };
    }

    const lats = positions.map((p) => p.latitude);
    const lons = positions.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLon + maxLon) / 2;
    // Add a small buffer to delta
    const latitudeDelta = Math.max(0.01, (maxLat - minLat) * 1.5);
    const longitudeDelta = Math.max(0.01, (maxLon - minLon) * 1.5);
    return { latitude, longitude, latitudeDelta, longitudeDelta };
}

function HomeScreen() {
    const mapRef = useRef<MapView>(null);
    const [initialRegion] = useState<Region>(() => ({
        latitude: 50.9380,
        longitude: 6.9578,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
    }));
    const [user, setUser] = useState<User | null>(null);
    const [allPositions, setAllPositions] = useState<{ [groupId: string]: { [userId: string]: MemberLocation } }>({});

    // Auth state listener
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChange((currentUser) => {
            setUser(currentUser);
        });

        return unsubscribeAuth;
    }, []);

    // Groups and positions listeners
    useEffect(() => {
        if (!user) {
            setAllPositions({});
            return;
        }

        let positionUnsubscribers: (() => void)[] = [];

        const unsubscribeGroups = getUserGroups(user.uid, (userGroups) => {
            // Clean up old position listeners
            positionUnsubscribers.forEach(unsubscribe => unsubscribe());
            positionUnsubscribers = [];

            // Set up position listeners for all groups
            userGroups.forEach((group) => {
                const unsubscribePositions = getGroupPositions(group.id, (positions) => {
                    setAllPositions(prev => ({
                        ...prev,
                        [group.id]: positions
                    }));
                });
                positionUnsubscribers.push(unsubscribePositions);
            });
        });

        return () => {
            unsubscribeGroups();
            positionUnsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [user]);

    // Get all positions from all groups (memoized)
    const memberPositions = useMemo(() => {
        const positions: UserWithLocation[] = [];

        Object.entries(allPositions).forEach(([, groupPositions]) => {
            Object.entries(groupPositions).forEach(([userId, position]) => {
                if (position.latitude && position.longitude) {
                    positions.push({
                        userId: userId,
                        profile: {}, // Profile can be fetched separately if needed
                        location: position,
                    });
                }
            });
        });

        return positions;
    }, [allPositions]);

    // Animate map to fit all markers when positions change
    useEffect(() => {
        if (memberPositions.length > 0 && mapRef.current) {
            const newRegion = computeRegion(memberPositions.map((member) => ({
                latitude: member.location.latitude,
                longitude: member.location.longitude
            })));
            mapRef.current.animateToRegion(newRegion, 1000);
        }
    }, [memberPositions]);

    // Center map on current user position
    const centerOnUser = () => {
        if (!user) return;

        // Find the current user's position
        for (const groupPositions of Object.values(allPositions)) {
            const userPos = groupPositions[user.uid];
            if (userPos && userPos.latitude && userPos.longitude) {
                const userRegion: Region = {
                    latitude: userPos.latitude,
                    longitude: userPos.longitude,
                    latitudeDelta: 0.01, // Closer zoom level
                    longitudeDelta: 0.01
                };
                mapRef.current?.animateToRegion(userRegion, 1000);
                return;
            }
        }
    };

    const onRegionChanged = (newRegion: Region) => {
    };

    const onMapReady = () => {
        // mapRef.current?.render();
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                onRegionChangeComplete={onRegionChanged}
                onMapReady={onMapReady}
                userInterfaceStyle='dark'
            >
                {/* Show group members as profile icons */}
                {memberPositions.map((member) => (
                    <Marker
                        key={member.userId}
                        coordinate={{ latitude: member.location.latitude, longitude: member.location.longitude }}
                        anchor={{ x: 0.5, y: 0.5 }}

                    >
                        <MapProfilePicture
                            userId={member.userId}
                            size={50}
                            showBorder={true}
                            borderColor="#fff"
                            borderWidth={3}
                            speed={member.location.speed}
                            showSpeedBadge={true}
                        />
                    </Marker>
                ))}
            </MapView>
            {/* Custom re-center button */}
            <ThemedButton
                title="Center on Me"
                onPress={centerOnUser}
                style={styles.customRecenterButton}
                prefix={<Ionicons name="compass" size={22} color="#fff" />}
            />
        </View>
    );
}

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    customRecenterButton: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        backgroundColor: theme.Colors.Accent,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        elevation: 2,
    },
});