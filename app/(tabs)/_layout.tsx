import { onAuthStateChange } from "@/src/services/authService";
import {
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates
} from "@/src/services/locationService";
import theme from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";

// Import the task definition at the global scope
// This ensures TaskManager.defineTask is called before the task is registered
import "@/src/services/locationTaskDefinition";

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
