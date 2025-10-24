import ThemedButton from '@/src/components/ThemedButton';
import theme from '@/src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { onAuthStateChange } from '../services/authService';
import { getGroupPositions, getUserGroups, GroupMember } from '../services/databaseService';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    profileMarkerContainer: {
        alignItems: 'center',
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    profileIconBlank: {
    },
    downArrow: {
        marginTop: -2,
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
    recenterText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 15,
    },
});



type Position = { latitude: number; longitude: number };
function computeRegion(positions: Position[]) {
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
    const [region, setRegion] = useState<Region>();
    const [user, setUser] = useState<any>(null);
    const [allPositions, setAllPositions] = useState<{ [groupId: string]: { [userId: string]: GroupMember } }>({});

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
            setAllPositions({});
            return;
        }

        const unsubscribeGroups = getUserGroups(user.uid, (userGroups) => {
            // Set up position listeners for all groups
            const positionUnsubscribers: (() => void)[] = [];

            userGroups.forEach((group) => {
                const unsubscribePositions = getGroupPositions(group.id, (positions) => {
                    setAllPositions(prev => ({
                        ...prev,
                        [group.id]: positions
                    }));
                });
                positionUnsubscribers.push(unsubscribePositions);
            });

            return () => {
                positionUnsubscribers.forEach(unsubscribe => unsubscribe());
            };
        });

        return () => {
            unsubscribeGroups();
        };
    }, [user]);

    // Get all positions from all groups
    const getAllMemberPositions = useCallback(() => {
        const positions: { latitude: number; longitude: number; id: string }[] = [];

        Object.values(allPositions).forEach((groupPositions) => {
            Object.values(groupPositions).forEach((member) => {
                if (member.latitude && member.longitude) {
                    positions.push({
                        latitude: member.latitude,
                        longitude: member.longitude,
                        id: member.id
                    });
                }
            });
        });

        return positions;
    }, [allPositions]);

    // Update region whenever positions change
    useEffect(() => {
        const memberPositions = getAllMemberPositions();
        const newRegion = computeRegion(memberPositions);
        setRegion(newRegion);
    }, [getAllMemberPositions]);

    // Center map on current user position
    const centerOnUser = () => {
        if (!user) return;

        // Find the current user's position
        const userPosition = (() => {
            for (const groupPositions of Object.values(allPositions)) {
                const userPos = groupPositions[user.uid];
                if (userPos && userPos.latitude && userPos.longitude) {
                    return {
                        latitude: userPos.latitude,
                        longitude: userPos.longitude
                    };
                }
            }
            return null;
        })();

        if (userPosition) {
            // Create a region centered on the user's position with a reasonable zoom
            const userRegion = {
                latitude: userPosition.latitude,
                longitude: userPosition.longitude,
                latitudeDelta: 0.01, // Closer zoom level
                longitudeDelta: 0.01
            };
            mapRef.current?.animateToRegion(userRegion, 1000);
        }
    };

    const onRegionChanged = (newRegion: Region) => {
        console.log('Region changed to:', newRegion);
    }

    const memberPositions = getAllMemberPositions();

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                onRegionChangeComplete={onRegionChanged}
            >
                {/* Show group members as profile icons with down arrows */}
                {memberPositions.map((member) => (
                    <Marker
                        key={member.id}
                        coordinate={{ latitude: member.latitude, longitude: member.longitude }}
                        anchor={{ x: 0.5, y: 1 }}
                        tracksViewChanges={false}
                    >
                        <View style={styles.profileMarkerContainer}>
                            {/* Custom marker content can be added here */}
                        </View>
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