import ThemedButton from '@/src/components/ThemedButton';
import theme from '@/src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import groupPositions from '../../mock/groupPositions.json';
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

    const initialRegion = computeRegion(groupPositions);

    useEffect(() => {
        setRegion(initialRegion);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Center map on current user (for now, initial region)
    const centerOnUser = () => {
        mapRef.current?.animateToRegion(initialRegion, 1000);
    };

    // Get all positions from all groups
    const getAllMemberPositions = () => {
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
    };

    const memberPositions = getAllMemberPositions();

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                region={region}
                onRegionChangeComplete={setRegion}
            >
                {/* Show group members as profile icons with down arrows */}
                {memberPositions.map((member) => (
                    <Marker
                        key={member.id}
                        coordinate={{ latitude: member.latitude, longitude: member.longitude }}
                        anchor={{ x: 0.5, y: 1 }}
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