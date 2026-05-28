import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useBookingDetail } from "@/hooks/useBookings";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/* ─── Pulsing rings behind avatar ─── */
function PulseRings() {
  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0.2);
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.1);

  useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.2, { duration: 0 })
      ),
      -1,
      false
    );
    scale2.value = withRepeat(
      withSequence(
        withTiming(1.9, { duration: 2000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
        withTiming(0.1, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <>
      <Animated.View style={[styles.pulseRing, ring2Style]} />
      <Animated.View style={[styles.pulseRing, ring1Style]} />
    </>
  );
}

export default function CallScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const { data: booking } = useBookingDetail(id);
  const agencyLogo = "P";
  const agencyName = booking?.agencyName || t("call.fallbackAgency");

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={["#050404", "#1a0a16"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* ─── Top: Call status ─── */}
        <View style={styles.topSection}>
          <Text style={styles.callLabel}>{t("call.status")}</Text>
          <Text style={styles.callDuration}>
            {formatDuration(callDuration)}
          </Text>
        </View>

        {/* ─── Center: Agency info ─── */}
        <View style={styles.centerSection}>
          <View style={styles.avatarContainer}>
            <PulseRings />
            <LinearGradient
              colors={["#4A1942", "#7A2968"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{agencyLogo}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.agencyName}>{agencyName}</Text>
          <Text style={styles.phoneNumber}>{t("call.phoneNumber")}</Text>
        </View>

        {/* ─── Bottom: Controls ─── */}
        <View style={styles.bottomSection}>
          <View style={styles.controlsRow}>
            {/* Speaker */}
            <TouchableOpacity
              style={styles.controlBtn}
              activeOpacity={0.7}
              onPress={() => setIsSpeaker((v) => !v)}
            >
              <View
                style={[
                  styles.controlCircle,
                  isSpeaker && styles.controlCircleActive,
                ]}
              >
                <Volume2
                  size={24}
                  color={isSpeaker ? "#1F1F1F" : "#EAEAEA"}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.controlLabel}>{t("call.speaker")}</Text>
            </TouchableOpacity>

            {/* Mute */}
            <TouchableOpacity
              style={styles.controlBtn}
              activeOpacity={0.7}
              onPress={() => setIsMuted(!isMuted)}
            >
              <View
                style={[
                  styles.controlCircle,
                  isMuted && styles.controlCircleActive,
                ]}
              >
                {isMuted ? (
                  <MicOff size={24} color="#EAEAEA" strokeWidth={1.5} />
                ) : (
                  <Mic size={24} color="#EAEAEA" strokeWidth={1.5} />
                )}
              </View>
              <Text style={styles.controlLabel}>
                {isMuted ? t("call.muted") : t("call.mic")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* End Call */}
          <TouchableOpacity
            style={styles.endCallBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <PhoneOff size={28} color="#EAEAEA" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 48,
  },

  /* Top */
  topSection: {
    alignItems: "center",
    paddingTop: 48,
  },
  callLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.5)",
    marginBottom: 8,
  },
  callDuration: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#EAEAEA",
  },

  /* Center */
  centerSection: {
    alignItems: "center",
  },
  avatarContainer: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseRing: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#4A1942",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 42,
    color: "#EAEAEA",
  },
  agencyName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#EAEAEA",
    marginBottom: 8,
  },
  phoneNumber: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(234, 234, 234, 0.6)",
  },

  /* Bottom */
  bottomSection: {
    alignItems: "center",
    paddingBottom: 48,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 32,
  },
  controlBtn: {
    alignItems: "center",
    gap: 8,
  },
  controlCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(234, 234, 234, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlCircleActive: {
    backgroundColor: "#4A1942",
  },
  controlLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.6)",
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
  },
});
