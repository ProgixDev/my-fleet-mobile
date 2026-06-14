import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useBookingDetail } from "@/hooks/useBookings";
import { useAgency } from "@/hooks/useAgencies";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { useTheme } from "@/context/ThemeContext";
import { useSafeBack } from "@/hooks/useSafeBack";

const MAP_HEIGHT = 380;

// Fallback region (Nice, France) used when no agency address can be geocoded
// and the user has not granted location permission, so the map still renders.
const FALLBACK_REGION: Region = {
  latitude: 43.7102,
  longitude: 7.262,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type LatLng = { latitude: number; longitude: number };

/* ─── Real map (Apple Maps via PROVIDER_DEFAULT on iOS, no API key) ─── */
function RealMap({ address }: { address: string | undefined }) {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [ready, setReady] = useState(false);

  // Request foreground location permission + read the user's position once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch {
        // Permission denied or location unavailable — fall back silently.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Geocode the agency / pickup address into a coordinate.
  useEffect(() => {
    let cancelled = false;
    if (!address) {
      setReady(true);
      return;
    }
    (async () => {
      try {
        const results = await Location.geocodeAsync(address);
        if (cancelled) return;
        if (results.length > 0) {
          setPickup({
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          });
        }
      } catch {
        // Geocoding failed — fall back to user/default region.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // Fit the map to show the pickup marker (and the user when available).
  useEffect(() => {
    if (!ready) return;
    const points: LatLng[] = [];
    if (pickup) points.push(pickup);
    if (userCoords) points.push(userCoords);

    if (points.length === 0) return;

    if (points.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...points[0],
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        600,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 60, bottom: 120, left: 60 },
      animated: true,
    });
  }, [ready, pickup, userCoords]);

  // Initial region: prefer pickup, then user, then a sensible default.
  const initialRegion: Region = pickup
    ? { ...pickup, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : userCoords
      ? { ...userCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : FALLBACK_REGION;

  return (
    <View style={styles.mapContainer}>
      <MapView
        testID="tracking-map"
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {pickup && (
          <Marker
            testID="tracking-pickup-marker"
            coordinate={pickup}
            title={t("tracking.pickupLabel")}
            description={address}
          />
        )}
      </MapView>

      {!ready && (
        <View style={styles.mapLoading} pointerEvents="none">
          <ActivityIndicator color="#EAEAEA" />
        </View>
      )}
    </View>
  );
}

/* ─── Pulsing dot for timeline ─── */
function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.timelineDot, { backgroundColor: color }, animatedStyle]}
    />
  );
}

/* ─── Timeline steps ─── */
interface TimelineStep {
  statusKey: string;
  timeKey: string;
  completed: boolean;
  active: boolean;
}

const timelineSteps: TimelineStep[] = [
  { statusKey: "tracking.timeline.confirmed", timeKey: "tracking.timeline.confirmedTime", completed: true, active: false },
  { statusKey: "tracking.timeline.preparing", timeKey: "tracking.timeline.preparingTime", completed: true, active: false },
  { statusKey: "tracking.timeline.enRoute", timeKey: "tracking.timeline.enRouteTime", completed: false, active: true },
  { statusKey: "tracking.timeline.delivered", timeKey: "", completed: false, active: false },
];

/* ─── Main Screen ─── */
export default function TrackingScreen() {
  const router = useRouter();
  const goBack = useSafeBack("/home");
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();

  const { data: booking } = useBookingDetail(id);
  const pairedAgency = useAgencyStore((s) => s.paired);
  // Refresh the paired agency to get the freshest address; falls back to the
  // persisted store value (and that to undefined) so geocoding stays best-effort.
  const { data: agency } = useAgency(pairedAgency?.id ?? pairedAgency?.slug);
  const resolvedAgency = agency ?? pairedAgency;
  const agencyLogo = "P";
  const agencyName = booking?.agencyName || t("tracking.fallbackAgency");

  // Build the pickup address to geocode: street + city when available.
  const pickupAddress =
    [resolvedAgency?.address, resolvedAgency?.city]
      .filter((part): part is string => !!part && part.trim().length > 0)
      .join(", ") || undefined;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ─── Map Section ─── */}
      <View style={styles.mapSection}>
        <RealMap address={pickupAddress} />

        <SafeAreaView style={styles.mapBackRow} edges={["top"]}>
          <TouchableOpacity
            testID="tracking-back-button"
            onPress={goBack}
            style={styles.mapBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#EAEAEA" strokeWidth={1.5} />
          </TouchableOpacity>
        </SafeAreaView>

        {pickupAddress && (
          <View style={styles.pickupPill} pointerEvents="none">
            <MapPin size={14} color="#EAEAEA" strokeWidth={1.8} />
            <Text style={styles.pickupPillText} numberOfLines={1}>
              {t("tracking.pickupLabel")} · {pickupAddress}
            </Text>
          </View>
        )}
      </View>

      {/* ─── Bottom Card ─── */}
      <View style={[styles.bottomCard, { backgroundColor: colors.background }]}>
        <View style={styles.dragHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bottomContent}
        >
          {/* Timeline */}
          <View style={styles.timeline}>
            {timelineSteps.map((step, index) => (
              <View key={index} style={styles.timelineRow}>
                {step.active ? (
                  <PulsingDot color={colors.primary} />
                ) : (
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: step.completed
                          ? "#2ECC71"
                          : colors.border,
                      },
                    ]}
                  />
                )}
                <View style={styles.timelineTextBlock}>
                  <Text style={[styles.timelineStatus, { color: colors.text }]}>
                    {t(step.statusKey)}
                  </Text>
                  {step.timeKey !== "" && (
                    <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                      {t(step.timeKey)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* ETA */}
          <View style={styles.etaBlock}>
            <Text style={[styles.etaValue, { color: colors.text }]}>
              {t("tracking.etaValue")}
            </Text>
            <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>
              {t("tracking.etaLabel")}
            </Text>
          </View>

          {/* Driver Card */}
          <View
            style={[
              styles.driverCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <View style={styles.driverLeft}>
              <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.driverAvatarText}>{agencyLogo}</Text>
              </View>
              <View>
                <Text style={[styles.driverName, { color: colors.text }]}>
                  {agencyName}
                </Text>
                <Text style={[styles.driverStatusText, { color: colors.textSecondary }]}>
                  {t("tracking.driverStatus")}
                </Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              {/* In-app calling is not shipped in v1.0 (no telephony backend);
                  the call entry point is removed. Messaging is the live channel. */}
              <TouchableOpacity
                style={[
                  styles.actionBtnSecondary,
                  { backgroundColor: isDark ? "rgba(74,25,66,0.3)" : "rgba(74,25,66,0.12)" },
                ]}
                activeOpacity={0.7}
                onPress={() => router.push(`/messagerie/${id}` as any)}
              >
                <MessageCircle size={18} color={colors.primary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050404",
  },

  /* ─── Map ─── */
  mapSection: {
    height: MAP_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    position: "relative",
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d0d",
  },

  /* Pickup info pill */
  pickupPill: {
    position: "absolute",
    bottom: 36,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(46,28,43,0.92)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  pickupPillText: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#EAEAEA",
  },

  /* Nav buttons */
  mapBackRow: {
    position: "absolute",
    top: 0,
    left: 20,
    paddingTop: 8,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2E1C2B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  /* ─── Bottom Card ─── */
  bottomCard: {
    flex: 1,
    backgroundColor: "#050404",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    zIndex: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(234, 234, 234, 0.6)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  bottomContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Timeline */
  timeline: {
    gap: 16,
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineTextBlock: {
    flex: 1,
  },
  timelineStatus: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#EAEAEA",
  },
  timelineTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.6)",
  },

  /* ETA */
  etaBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  etaValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#EAEAEA",
  },
  etaLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.6)",
  },

  /* Driver Card */
  driverCard: {
    backgroundColor: "#2E1C2B",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  driverLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A1942",
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#EAEAEA",
  },
  driverName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#EAEAEA",
  },
  driverStatusText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.6)",
  },
  driverActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtnPrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A1942",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(234, 234, 234, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
