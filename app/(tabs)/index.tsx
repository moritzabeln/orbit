

import theme from '@/src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import groupPositions from '../../mock/groupPositions.json';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  profileMarkerContainer: {
    alignItems: 'center',
    width: 100,
    height: 100,
  },
  profileIconBlank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#ccc',
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

function Index() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>();

  const initialRegion = computeRegion(groupPositions);

  useEffect(() => {
    setRegion(initialRegion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Center map on current user (for now, initial region)
  const centerOnUser = () => {
    mapRef.current?.animateToRegion(initialRegion, 1000);
  };

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
        {groupPositions.map((member) => (
          <Marker
            key={member.id}
            coordinate={{ latitude: member.latitude, longitude: member.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            image={require('../../assets/images/icon.png')}
          >
            <View style={styles.profileMarkerContainer}>
              <Image
                source={{ uri: `../../assets/icon.png` }}
              />
              <View style={styles.profileIconBlank} />
              <Ionicons name="caret-down" size={24} color={theme.Colors.Text} style={styles.downArrow} />
            </View>
          </Marker>
        ))}
      </MapView>
      {/* Custom re-center button */}
      <TouchableOpacity style={styles.customRecenterButton} onPress={centerOnUser}>
        <Ionicons name="compass" size={22} color="#fff" />
        <Text style={styles.recenterText}>Center on Me</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Index;


