export default {
  expo: {
    name: "Orbit",
    slug: "orbit",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    notification: {
      icon: "./assets/images/icon-notification.png",
      color: "#8887ff",
      iosDisplayInForeground: true
    },
    scheme: "orbit",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mabeln.orbit",
      infoPlist: {
        NSLocationAlwaysAndWhenInUseUsageDescription: "Orbit needs your location to share it with your groups, even when the app is in the background.",
        NSLocationWhenInUseUsageDescription: "Orbit needs your location to share it with your groups.",
      },
      backgroundModes: ["location"],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    android: {
      adaptiveIcon: {
        monochromeImage: "./assets/images/icon-monochrome.png",
        foregroundImage: "./assets/images/icon-foreground.png",
        backgroundImage: "./assets/images/icon-background.png",
        backgroundColor: "#8887ff"
      },
      icon: "./assets/images/icon.png",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.mabeln.orbit",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "INTERNET"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          isAndroidBackgroundLocationEnabled: true,
          isIosBackgroundLocationEnabled: true,
          locationAlwaysAndWhenInUsePermission: "Orbit needs your location to share it with your groups, even when the app is in the background.",
          locationWhenInUsePermission: "Orbit needs your location to share it with your groups.",
        }
      ],
      "expo-task-manager",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};