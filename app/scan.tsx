import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  CameraOff,
  CheckCircle2,
  Lock,
  ScanLine,
  Sparkles,
  XCircle,
  Zap,
  ZapOff,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/EmptyState";
import { ApiClientError } from "@/services/api";
import { ProfileIncompleteError, usePairWithAgency } from "@/hooks/usePairing";

const FRAME_SIZE = 272;
const CORNER_SIZE = 40;
const ACCENT_SOFT = "#8B3D7E";

type Phase =
  | { kind: "idle" }
  | { kind: "validating"; payload: string }
  | { kind: "success"; name: string }
  | { kind: "error"; message: string };

function parseQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Accept deep-link forms like myfleet://pair/<idOrSlug> or
  // https://myfleet.app/pair/<idOrSlug>, otherwise treat as raw id/slug.
  const deepLink = trimmed.match(
    /(?:myfleet:\/\/|https?:\/\/[^/]+\/)pair\/([^/?#]+)/i,
  );
  if (deepLink && deepLink[1]) {
    return decodeURIComponent(deepLink[1]);
  }
  // Reject obviously-non-id payloads (URLs to other domains, long text)
  if (trimmed.length > 128) return null;
  if (/\s/.test(trimmed)) return null;
  return trimmed;
}

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const lastScannedRef = useRef<string | null>(null);
  const pair = usePairWithAgency();

  const scanAnim = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(0)).current;

  // Scan line sweep
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [ringSpin]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [livePulse]);

  const handleBarcode = useCallback(
    async ({ data }: { data: string }) => {
      if (phase.kind !== "idle") return;
      if (!data || data === lastScannedRef.current) return;
      lastScannedRef.current = data;

      const idOrSlug = parseQrPayload(data);
      if (!idOrSlug) {
        setPhase({ kind: "error", message: t("scan.invalidQr") });
        setTimeout(() => {
          lastScannedRef.current = null;
          setPhase({ kind: "idle" });
        }, 1800);
        return;
      }

      setPhase({ kind: "validating", payload: idOrSlug });
      try {
        const agency = await pair.mutateAsync(idOrSlug);
        setPhase({ kind: "success", name: agency.name });
        setTimeout(() => {
          lastScannedRef.current = null;
          router.replace("/home");
        }, 700);
      } catch (err) {
        if (err instanceof ProfileIncompleteError) {
          // Profile gating: customer must complete their identity fields
          // before they can pair with an agency. Deep-link to the profile
          // completion screen and let them retry the scan once done.
          lastScannedRef.current = null;
          setPhase({ kind: "idle" });
          router.push({
            pathname: "/profile-complete",
            params: { missing: err.missingFields.join(",") },
          });
          return;
        }
        const message =
          err instanceof ApiClientError && err.status === 404
            ? t("scan.unknownAgency")
            : t("scan.pairingFailed");
        setPhase({ kind: "error", message });
        setTimeout(() => {
          lastScannedRef.current = null;
          setPhase({ kind: "idle" });
        }, 2000);
      }
    },
    [phase.kind, pair, router, t],
  );

  const scanLineTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, FRAME_SIZE - 24],
  });
  const ringRotate = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const liveOpacity = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // ── Permission gating ─────────────────────────────────────────────────────
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#050404" }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#050404" }}>
        <SafeAreaView style={{ flex: 1 }}>
          <EmptyState
            icon={CameraOff}
            title={t("scan.permissionTitle")}
            subtitle={t("scan.permissionSubtitle")}
            actionLabel={
              permission.canAskAgain
                ? t("scan.permissionGrant")
                : t("scan.permissionGoBack")
            }
            onAction={
              permission.canAskAgain
                ? () => requestPermission()
                : () => router.back()
            }
          />
        </SafeAreaView>
      </View>
    );
  }

  const isValidating = phase.kind === "validating";
  const isSuccess = phase.kind === "success";
  const isError = phase.kind === "error";

  return (
    <View style={{ flex: 1, backgroundColor: "#050404" }}>
      {/* Real camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={phase.kind === "idle" ? handleBarcode : undefined}
      />

      {/* Soft accent wash above camera */}
      <LinearGradient
        colors={[
          "rgba(74, 25, 66, 0.22)",
          "rgba(11, 10, 11, 0)",
          "rgba(11, 10, 11, 0.6)",
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Dim mask with viewfinder hole */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
        <View style={{ flexDirection: "row", height: FRAME_SIZE }}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
          <View style={{ width: FRAME_SIZE, height: FRAME_SIZE }} />
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
        </View>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
      </View>

      {/* Viewfinder */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          marginTop: -FRAME_SIZE / 2,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: FRAME_SIZE + 44,
            height: FRAME_SIZE + 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={[styles.ring, { transform: [{ rotate: ringRotate }] }]}
          />
          <View style={styles.glowHalo} />

          <View
            style={{
              width: FRAME_SIZE,
              height: FRAME_SIZE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {phase.kind === "idle" && (
              <Animated.View
                style={[
                  styles.scanLineWrap,
                  { transform: [{ translateY: scanLineTranslate }] },
                ]}
              >
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(139, 61, 126, 0.35)",
                    ACCENT_SOFT,
                    "rgba(139, 61, 126, 0.35)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scanLine}
                />
              </Animated.View>
            )}

            {(isValidating || isSuccess) && (
              <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
                <View
                  style={
                    isSuccess
                      ? styles.detectedRingOuterSuccess
                      : styles.detectedRingOuter
                  }
                >
                  <View
                    style={
                      isSuccess
                        ? styles.detectedRingInnerSuccess
                        : styles.detectedRingInner
                    }
                  >
                    {isSuccess ? (
                      <CheckCircle2
                        size={44}
                        color="#2ECC71"
                        strokeWidth={1.8}
                      />
                    ) : (
                      <ScanLine
                        size={44}
                        color={ACCENT_SOFT}
                        strokeWidth={1.8}
                      />
                    )}
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 15,
                    color: "#EAEAEA",
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  {isSuccess ? phase.name : t("scan.validating")}
                </Text>
                {isSuccess && (
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 12,
                      color: "rgba(234,234,234,0.6)",
                      textAlign: "center",
                      marginTop: 4,
                    }}
                  >
                    {t("scan.connecting", { name: phase.name })}
                  </Text>
                )}
              </View>
            )}

            {isError && (
              <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
                <View style={styles.errorRing}>
                  <XCircle size={44} color="#F87171" strokeWidth={1.8} />
                </View>
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 14,
                    color: "#EAEAEA",
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  {phase.message}
                </Text>
              </View>
            )}
          </View>
        </View>

        {phase.kind === "idle" && (
          <View style={styles.holdChip}>
            <View style={styles.holdDot} />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 11,
                letterSpacing: 0.4,
                color: "rgba(234,234,234,0.7)",
              }}
            >
              {t("scan.holdSteady")}
            </Text>
          </View>
        )}
      </View>

      {/* Top bar */}
      <SafeAreaView
        edges={["top"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 8,
          }}
        >
          <View style={{ overflow: "hidden", borderRadius: 999 }}>
            <BlurView intensity={40} tint="dark" style={styles.liveChip}>
              <Animated.View
                style={[styles.liveDot, { opacity: liveOpacity }]}
              />
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 0.6,
                  color: "#EAEAEA",
                }}
              >
                {t("scan.live").toUpperCase()}
              </Text>
            </BlurView>
          </View>

          <View style={{ overflow: "hidden", borderRadius: 999 }}>
            <BlurView intensity={40} tint="dark" style={styles.titleBadge}>
              <ScanLine size={14} color="#EAEAEA" strokeWidth={1.8} />
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 13,
                  color: "#EAEAEA",
                }}
              >
                {t("scan.title")}
              </Text>
            </BlurView>
          </View>

          <Pressable
            onPress={() => setFlashOn((v) => !v)}
            style={{ overflow: "hidden", borderRadius: 999 }}
            testID="scan-flash-toggle"
            accessibilityRole="button"
            accessibilityState={{ selected: flashOn }}
            accessibilityLabel={t("scan.flashToggle", {
              defaultValue: "Toggle flashlight",
            })}
          >
            <BlurView
              intensity={40}
              tint="dark"
              style={[styles.flashPill, flashOn && styles.flashPillActive]}
            >
              {flashOn ? (
                <Zap
                  size={18}
                  color="#F1C40F"
                  strokeWidth={1.8}
                  fill="#F1C40F"
                />
              ) : (
                <ZapOff size={18} color="#EAEAEA" strokeWidth={1.8} />
              )}
            </BlurView>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom info card */}
      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            overflow: "hidden",
            borderRadius: 28,
          }}
        >
          <BlurView intensity={50} tint="dark" style={styles.bottomCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                marginBottom: 14,
              }}
            >
              <FeatureChip
                icon={<Lock size={11} color={ACCENT_SOFT} strokeWidth={2} />}
                label={t("scan.chip3")}
              />
              <FeatureChip
                icon={
                  <Sparkles size={11} color={ACCENT_SOFT} strokeWidth={2} />
                }
                label={t("scan.chip2")}
              />
              <FeatureChip
                icon={
                  <ScanLine size={11} color={ACCENT_SOFT} strokeWidth={2} />
                }
                label={t("scan.chip1")}
              />
            </View>

            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 18,
                letterSpacing: -0.2,
                color: "#EAEAEA",
                textAlign: "center",
              }}
            >
              {t("scan.headline")}
            </Text>

            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 13,
                lineHeight: 19,
                color: "rgba(234,234,234,0.6)",
                textAlign: "center",
                marginTop: 6,
                paddingHorizontal: 8,
              }}
            >
              {t("scan.subline")}
            </Text>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.featureChip}>
      {icon}
      <Text
        style={{
          fontFamily: "Poppins_500Medium",
          fontSize: 10.5,
          letterSpacing: 0.2,
          color: "#EAEAEA",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    width: FRAME_SIZE + 44,
    height: FRAME_SIZE + 44,
    borderRadius: (FRAME_SIZE + 44) / 2,
    borderWidth: 1,
    borderColor: "rgba(139, 61, 126, 0.35)",
    borderStyle: "dashed",
  },
  glowHalo: {
    position: "absolute",
    width: FRAME_SIZE + 20,
    height: FRAME_SIZE + 20,
    borderRadius: 36,
    backgroundColor: "rgba(74, 25, 66, 0.18)",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#EAEAEA",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 22,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 22,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 22,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 22,
  },
  scanLineWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 22,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scanLine: { width: "100%", height: 2, borderRadius: 999 },
  detectedRingOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(139, 61, 126, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(139, 61, 126, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  detectedRingInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(139, 61, 126, 0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(139, 61, 126, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  detectedRingOuterSuccess: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(46, 204, 113, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(46, 204, 113, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  detectedRingInnerSuccess: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(46, 204, 113, 0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(46, 204, 113, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(248, 113, 113, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  holdChip: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(46, 28, 43, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
  },
  holdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT_SOFT,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
  },
  flashPill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
  },
  flashPillActive: { borderColor: "rgba(241, 196, 15, 0.55)" },
  bottomCard: {
    padding: 20,
    backgroundColor: "rgba(5, 4, 4, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    borderRadius: 28,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(74, 25, 66, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(74, 25, 66, 0.4)",
  },
});
