import { useEffect, useState } from "react";
import { View, Image } from "react-native";
import { Redirect } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAgencyStore } from "@/stores/useAgencyStore";

const SPLASH_DURATION_MS = 1600;
const LOGO_SIZE = 180;

export default function SplashScreen() {
  const [splashDone, setSplashDone] = useState(false);
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const pairedAgencyId = useAgencyStore((s) => s.paired?.id ?? null);
  const agencyServerSynced = useAgencyStore((s) => s.serverSynced);

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
    initialize();
    const timer = setTimeout(() => setSplashDone(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [initialize, opacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const splash = (
    <View className="flex-1 items-center justify-center bg-white">
      <Animated.View style={logoStyle}>
        <Image
          source={require("../assets/logo.png")}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );

  if (splashDone && isHydrated) {
    if (isAuthenticated) {
      if (pairedAgencyId) {
        return <Redirect href="/home" />;
      }
      // Stay on the splash until the server has answered which agencies this
      // customer belongs to (useAgencyPairingSync, mounted in _layout).
      // Deciding before the answer arrives would send anyone holding a valid
      // server-side pairing — a reinstall, a new phone, an App Review tester
      // on a pre-paired demo account — to the scan screen with no way back.
      if (!agencyServerSynced) {
        return splash;
      }
      return <Redirect href="/scan" />;
    }
    return <Redirect href="/onboarding" />;
  }

  return splash;
}
