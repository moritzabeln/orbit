import PageHeader from "@/src/components/PageHeader";
import ThemedButton from "@/src/components/ThemedButton";
import theme from "@/src/theme/theme";
import Slider from "@react-native-community/slider";
import { getCurrentPositionAsync } from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { savePlace, updatePlace } from "../../../../src/services/databaseService";

export default function AddPlaceScreen() {
    const router = useRouter();
    const { groupId, placeId, placeData } = useLocalSearchParams();
    const [region, setRegion] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [radius, setRadius] = useState(100);
    const [name, setName] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Calculate map deltas to barely cover the radius
    const calculateDeltasForRadius = (lat: number, radiusMeters: number) => {
        // 1 degree latitude ≈ 111,000 meters
        const latDelta = (2 * radiusMeters) / 111000;
        // 1 degree longitude ≈ 111,000 * cos(latitude) meters
        const lngDelta = (2 * radiusMeters) / (111000 * Math.cos(lat * Math.PI / 180));
        return { latitudeDelta: latDelta, longitudeDelta: lngDelta };
    };

    useEffect(() => {
        const getLocation = async () => {
            try {
                const location = await getCurrentPositionAsync({});
                setRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });
            } catch (error) {
                console.error("Error getting location:", error);
            }
        };

        // Check if we're editing an existing place
        if (placeData) {
            try {
                const place = JSON.parse(placeData as string);
                setName(place.name);
                setRadius(place.radius);
                const deltas = calculateDeltasForRadius(place.lat, place.radius);
                setRegion({
                    latitude: place.lat,
                    longitude: place.lng,
                    ...deltas,
                });
                setIsEditing(true);
            } catch (error) {
                console.error("Error parsing place data:", error);
            }
        } else {
            getLocation();
        }
    }, [placeData]);

    const handleConfirm = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter a name for the place.");
            return;
        }
        try {
            if (isEditing && placeId) {
                await updatePlace(groupId as string, placeId as string, {
                    name: name.trim(),
                    lat: region.latitude,
                    lng: region.longitude,
                    radius,
                });
            } else {
                await savePlace(groupId as string, {
                    name: name.trim(),
                    lat: region.latitude,
                    lng: region.longitude,
                    radius,
                });
            }
            router.back();
        } catch (error) {
            console.error("Error saving place:", error);
            Alert.alert("Error", "Failed to save place.");
        }
    };

    return (
        <SafeAreaView style={[theme.Component.PageContainer]}>
            <PageHeader title={isEditing ? "Edit Place" : "Add Place"} showBackButton={true} />
            <View style={[{ flex: 1 }]}>
                <MapView
                    style={{ flex: 1, borderRadius: 8 }}
                    region={region}
                    onRegionChangeComplete={setRegion}
                    provider={PROVIDER_GOOGLE}
                    customMapStyle={require("@/assets/map-style.json")}
                >
                    <Marker
                        coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                        tracksViewChanges={false}
                    />
                    <Circle
                        center={{ latitude: region.latitude, longitude: region.longitude }}
                        radius={radius}
                        strokeColor={theme.Colors.Accent}
                        fillColor={`${theme.Colors.Accent}20`}
                    />
                </MapView>
                <View style={{ padding: theme.Spacing.Gap.Lg }}>
                    <TextInput
                        style={{
                            borderWidth: 1,
                            borderColor: theme.Colors.Border,
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16,
                            marginBottom: 16,
                            color: theme.Colors.Text.Primary,
                            backgroundColor: theme.Colors.Background.Secondary,
                        }}
                        placeholder="Place name"
                        value={name}
                        onChangeText={setName}
                    />
                    <Text style={{ fontSize: 16, marginBottom: 8, color: theme.Colors.Text.Primary }}>Radius: {radius} meters</Text>
                    <Slider
                        style={{ marginBottom: 16 }}
                        minimumValue={30}
                        maximumValue={200}
                        step={10}
                        value={radius}
                        onValueChange={setRadius}
                    />
                    <ThemedButton title="Confirm" onPress={handleConfirm} />
                </View>
            </View>
        </SafeAreaView>
    );
}