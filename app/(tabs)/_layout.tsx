import { MemberLocation } from "@/src/models/database";
import theme from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { getCurrentUser, onAuthStateChange } from "../../src/services/authService";
import { getBatteryInfo } from "../../src/services/batteryService";
import { updatePositionInAllGroups, updateUserBattery } from "../../src/services/databaseService";
import {
  defineLocationTask,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates
} from "../../src/services/locationService";

/**
 * Background location task that
 * - updates the user's position in all groups
 * - updates the user's battery info
 */
defineLocationTask(async (userLocations: MemberLocation[]) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('[Background Task] No authenticated user, skipping update');
      return;
    }

    const latestLocation = userLocations.sort((a, b) => b.timestamp - a.timestamp)[0];
    await updatePositionInAllGroups(user.uid, latestLocation);

    // Also update battery info alongside location
    const batteryInfo = await getBatteryInfo();
    if (batteryInfo.level >= 0) {
      await updateUserBattery(user.uid, batteryInfo.level, batteryInfo.state);
      console.log(`[Background Task] Position & Battery updated: ${batteryInfo.level}%, charging: ${batteryInfo.isCharging}`);
    }
  } catch (error) {
    console.error('[Background Task] Error updating position/battery:', error);
  }
});

export default function RootLayout() {
  useEffect(() => {
    const authUnsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // Start background location tracking
        const started = await startBackgroundLocationUpdates();
        if (started) {
          console.log('[App] Location tracking started');
        } else {
          console.warn('[App] Failed to start background location tracking');
        }
      } else {
        await stopBackgroundLocationUpdates();
        console.log('[App] Location tracking stopped');
      }
    });

    return () => {
      authUnsubscribe();
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
