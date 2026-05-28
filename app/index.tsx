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

  if (splashDone && isHydrated) {
    if (isAuthenticated) {
      // Pairing with an agency via QR is OPTIONAL. If the user is already
      // paired, drop them into their agency home. Otherwise send them to
      // the public catalog (`/search`) where they can browse every agency
      // without scanning anything. They can pair later from the search UI
      // or from the scan tab whenever they want.
      if (pairedAgencyId) {
        return <Redirect href="/home" />;
      }
      return <Redirect href="/search" />;
    }
    return <Redirect href="/onboarding" />;
  }

  return (
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
}
