import "../global.css";
// Initialize i18next before any component mounts so the first render has
// translations available. Import ordering here matters — keep above providers.
import "@/i18n";

import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePushRegistration } from "@/hooks/usePushRegistration";

function RootContent() {
  const { colors } = useTheme();
  // Register for push once the user is authenticated (no-op on simulators).
  usePushRegistration(useAuthStore((s) => s.isAuthenticated));

  return (
    <>
      <StatusBar style={colors.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.warn(
        "[Fonts] Failed to load Poppins fallback in use:",
        fontError,
      );
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#050404",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#4A1942" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
