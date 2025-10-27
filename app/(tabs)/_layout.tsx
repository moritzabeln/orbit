import { MemberLocation } from "@/src/models/database";
import theme from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { getCurrentUser, onAuthStateChange } from "../../src/services/authService";
import { getBatteryInfo } from "../../src/services/batteryService";
import {
  getMembersAtPlaces,
  getUserGroups,
  getUserProfile,
  updatePositionInAllGroups,
  updateUserBattery
} from "../../src/services/databaseService";
import { locationPlaceIntegration } from "../../src/services/locationPlaceIntegration";
import {
  defineLocationTask,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates
} from "../../src/services/locationService";
import {
  notifyMemberArrived,
  notifyMemberLeft,
  requestNotificationPermissions
} from "../../src/services/notificationService";

/**
 * Background location task that
 * - updates the user's position in all groups
 * - updates the user's battery info
 * - processes location for place detection
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

    // Process location for place detection across all groups
    await locationPlaceIntegration.processLocationUpdate(latestLocation);

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
  const previousMembersAtPlaces = useRef<{ [groupId: string]: { [placeId: string]: { [userId: string]: any } } }>({});
  const unsubscribersRef = useRef<(() => void)[]>([]);

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

        // Set up listeners for notifications about other members at places
        const groupsUnsubscribe = getUserGroups(user.uid, (groups) => {
          // Clean up previous group listeners
          unsubscribersRef.current.forEach(unsub => unsub());
          unsubscribersRef.current = [];

          groups.forEach((group) => {
            // Listen for members at places changes in this group
            const membersAtPlacesUnsubscribe = getMembersAtPlaces(group.id, async (membersAtPlaces) => {
              const previous = previousMembersAtPlaces.current[group.id] || {};

              // Check for arrivals and departures
              for (const placeId in membersAtPlaces) {
                const currentMembers = membersAtPlaces[placeId];
                const previousMembers = previous[placeId] || {};

                // Get place info from locationPlaceIntegration
                const placeInfo = locationPlaceIntegration.getPlaceById(placeId);
                const placeName = placeInfo?.place.name || 'a place';

                // Check for new arrivals (members in current but not in previous)
                for (const userId in currentMembers) {
                  if (userId === user.uid) continue; // Skip notifications for current user

                  if (!previousMembers[userId]) {
                    // Member arrived - fetch their profile
                    getUserProfile(userId, async (profile) => {
                      const memberName = profile?.displayName || 'Someone';
                      await notifyMemberArrived(memberName, placeName);
                      console.log(`[App] Notification: ${memberName} arrived at ${placeName}`);
                    });
                  }
                }

                // Check for departures (members in previous but not in current)
                for (const userId in previousMembers) {
                  if (userId === user.uid) continue; // Skip notifications for current user

                  if (!currentMembers[userId]) {
                    // Member left - fetch their profile
                    getUserProfile(userId, async (profile) => {
                      const memberName = profile?.displayName || 'Someone';
                      await notifyMemberLeft(memberName, placeName);
                      console.log(`[App] Notification: ${memberName} left ${placeName}`);
                    });
                  }
                }
              }

              // Update the reference for next comparison
              if (!previousMembersAtPlaces.current[group.id]) {
                previousMembersAtPlaces.current[group.id] = {};
              }
              previousMembersAtPlaces.current[group.id] = membersAtPlaces;
            });

            unsubscribersRef.current.push(membersAtPlacesUnsubscribe);
          });
        });

        return () => {
          groupsUnsubscribe();
          unsubscribersRef.current.forEach(unsub => unsub());
          unsubscribersRef.current = [];
        };
      } else {
        await stopBackgroundLocationUpdates();
        locationPlaceIntegration.cleanup();
        console.log('[App] Location tracking stopped');
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
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
