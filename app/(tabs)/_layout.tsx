import theme from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { onAuthStateChange } from "../../src/services/authService";
import { getBatteryInfo } from "../../src/services/batteryService";
import { updatePositionInAllGroups, updateUserBattery } from "../../src/services/databaseService";
import { watchLocation } from "../../src/services/locationService";

export default function RootLayout() {
  useEffect(() => {
    let locationUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChange((user) => {
      if (user) {
        // User is authenticated, start location tracking
        locationUnsubscribe = watchLocation(
          async (location) => {
            try {
              // Update position in all groups the user belongs to
              await updatePositionInAllGroups(user.uid, location.latitude, location.longitude);

              // Also update battery info alongside location
              const batteryInfo = await getBatteryInfo();
              if (batteryInfo.level >= 0) {
                await updateUserBattery(user.uid, batteryInfo.level, batteryInfo.state);
                console.log(`Location & Battery updated: ${batteryInfo.level}%, charging: ${batteryInfo.isCharging}`);
              }
            } catch (error) {
              console.error('Error updating position/battery:', error);
            }
          },
          (error) => {
            console.error('Location tracking error:', error);
          }
        );
      } else {
        // User is not authenticated, stop tracking
        if (locationUnsubscribe) {
          locationUnsubscribe();
          locationUnsubscribe = null;
        }
      }
    });

    return () => {
      authUnsubscribe();
      if (locationUnsubscribe) {
        locationUnsubscribe();
      }
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.Colors.Background.Menu,
          borderColor: theme.Colors.Border,
        },
        tabBarActiveTintColor: theme.Colors.Accent,
        tabBarInactiveTintColor: theme.Colors.Text.Secondary,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginTop: 8,
          // TODO: Find a better way to center icons vertically
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
