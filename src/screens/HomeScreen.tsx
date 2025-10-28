import MapProfilePicture from '@/src/components/MapProfilePicture';
import ThemedButton from '@/src/components/ThemedButton';
import { MemberLocation, Place, UserWithLocation } from '@/src/models/database';
import { onAuthStateChange } from '@/src/services/authService';
import {
    getMultipleGroupPlaces,
    subscribeToMultipleGroupPositions,
    subscribeToUserGroupIds
} from '@/src/services/databaseService';
import theme from '@/src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'firebase/auth';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

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
    const [allPlaces, setAllPlaces] = useState<{ [groupId: string]: Place[] }>({});

    // Refs to track current subscriptions for proper cleanup
    const positionSubscriptionRef = useRef<(() => void) | null>(null);
    const placesSubscriptionRef = useRef<(() => void) | null>(null);

    // Auth state listener
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChange((currentUser) => {
            setUser(currentUser);
        });

        return unsubscribeAuth;
    }, []);

    // Listen to user's group IDs, then positions and places for those groups
    useEffect(() => {
        if (!user) {
            setAllPositions({});
            setAllPlaces({});
            // Clean up any existing subscriptions
            if (positionSubscriptionRef.current) {
                positionSubscriptionRef.current();
                positionSubscriptionRef.current = null;
            }
            if (placesSubscriptionRef.current) {
                placesSubscriptionRef.current();
                placesSubscriptionRef.current = null;
            }
            return;
        }

        const unsubscribeGroupIds = subscribeToUserGroupIds(user.uid, (groupIds) => {
            console.log(`[HomeScreen] Watching ${groupIds.length} groups`);

            // Clean up previous subscriptions before setting up new ones
            if (positionSubscriptionRef.current) {
                positionSubscriptionRef.current();
            }
            if (placesSubscriptionRef.current) {
                placesSubscriptionRef.current();
            }

            // Now listen to positions and places for these specific groups only
            positionSubscriptionRef.current = subscribeToMultipleGroupPositions(groupIds, (positions) => {
                setAllPositions(positions);
                console.log(`[HomeScreen] Updated positions for ${Object.keys(positions).length} groups`);
            });

            placesSubscriptionRef.current = getMultipleGroupPlaces(groupIds, (places) => {
                setAllPlaces(places);
                console.log(`[HomeScreen] Updated places for ${Object.keys(places).length} groups`);
            });
        });

        return () => {
            unsubscribeGroupIds();
            // Clean up position and place subscriptions on unmount
            if (positionSubscriptionRef.current) {
                positionSubscriptionRef.current();
                positionSubscriptionRef.current = null;
            }
            if (placesSubscriptionRef.current) {
                placesSubscriptionRef.current();
                placesSubscriptionRef.current = null;
            }
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
                customMapStyle={require('@/assets/map-style.json')}
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

                {/* Show places as circles with location icons */}
                {Object.values(allPlaces).flat().map((place) => (
                    <React.Fragment key={place.id}>
                        <Circle
                            center={{ latitude: place.lat, longitude: place.lng }}
                            radius={place.radius}
                            strokeColor={theme.Colors.Accent}
                            fillColor={`${theme.Colors.Accent}20`}
                            strokeWidth={2}
                        />
                        <Marker
                            coordinate={{ latitude: place.lat, longitude: place.lng }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={{
                                backgroundColor: theme.Colors.Background.Secondary,
                                borderRadius: 20,
                                padding: 4,
                                borderWidth: 1,
                                borderColor: theme.Colors.Accent,
                            }}>
                                <Ionicons name="location" size={16} color={theme.Colors.Accent} />
                            </View>
                        </Marker>
                    </React.Fragment>
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