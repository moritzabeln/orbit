// Import the task definition at the global scope
// This ensures TaskManager.defineTask is called before the task is registered
import "@/src/services/locationTaskDefinition";

import { locationPlaceIntegration } from "@//src/services/locationPlaceIntegration";
import { requestNotificationPermissions } from "@//src/services/notificationService";
import { onAuthStateChange } from "@/src/services/authService";
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from "@/src/services/locationService";
import { placeNotificationService } from "@/src/services/placeNotificationService";
import theme from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on mount
    requestNotificationPermissions();

    const authUnsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // Start background location tracking
        const started = await startBackgroundLocationUpdates();
        if (started) {
          console.log('[App] Location tracking started');
        } else {
          console.warn('[App] Failed to start background location tracking');
        }

        // Initialize location-place integration for place detection
        await locationPlaceIntegration.initialize();

        // Start place notification service
        await placeNotificationService.start();
        console.log('[App] Place notification service started');
      } else {
        // Stop services when user logs out
        await stopBackgroundLocationUpdates();
        locationPlaceIntegration.cleanup();
        placeNotificationService.stop();
        console.log('[App] All location services stopped');
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
