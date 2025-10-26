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
  startForegroundLocationUpdates,
  stopBackgroundLocationUpdates,
  UserLocation
} from "../../src/services/locationService";

// Define the background location task at the top level
defineLocationTask(async (location: UserLocation) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('[Background] No authenticated user, skipping update');
      return;
    }

    // Update position in all groups
    await updatePositionInAllGroups(user.uid, location.latitude, location.longitude);

    // Also update battery info alongside location
    const batteryInfo = await getBatteryInfo();
    if (batteryInfo.level >= 0) {
      await updateUserBattery(user.uid, batteryInfo.level, batteryInfo.state);
      console.log(`[Background] Position & Battery updated: ${batteryInfo.level}%, charging: ${batteryInfo.isCharging}`);
    }
  } catch (error) {
    console.error('[Background] Error updating position/battery:', error);
  }
});

export default function RootLayout() {
  useEffect(() => {
    let foregroundUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // Start foreground location tracking (10 seconds)
        foregroundUnsubscribe = startForegroundLocationUpdates(
          async (location) => {
            try {
              await updatePositionInAllGroups(user.uid, location.latitude, location.longitude);

              const batteryInfo = await getBatteryInfo();
              if (batteryInfo.level >= 0) {
                await updateUserBattery(user.uid, batteryInfo.level, batteryInfo.state);
                console.log(`[Foreground] Position & Battery updated: ${batteryInfo.level}%, charging: ${batteryInfo.isCharging}`);
              }
            } catch (error) {
              console.error('[Foreground] Error updating:', error);
            }
          },
          (error) => {
            console.error('[Foreground] Location error:', error);
          }
        );

        // Start background location tracking (30 seconds)
        const started = await startBackgroundLocationUpdates();
        if (started) {
          console.log('[App] Location tracking started (foreground: 10s, background: 30s)');
        } else {
          console.warn('[App] Failed to start background location tracking');
        }
      } else {
        // User is not authenticated, stop tracking
        if (foregroundUnsubscribe) {
          foregroundUnsubscribe();
          foregroundUnsubscribe = null;
        }
        await stopBackgroundLocationUpdates();
        console.log('[App] Location tracking stopped');
      }
    });

    return () => {
      authUnsubscribe();
      if (foregroundUnsubscribe) {
        foregroundUnsubscribe();
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
