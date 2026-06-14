import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Camera,
  X,
  Upload,
  AlertCircle,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { useAgencyStore } from "@/stores/useAgencyStore";
import {
  uploadKycDocument,
  KYC_FIELDS,
  type KycField,
} from "@/services/kycService";

// `expo-image-picker` is resolved lazily (require, not a top-level import) so
// that a native build *without* the ExponentImagePicker module doesn't crash
// the entire app at boot — Expo Router eagerly evaluates every route module, so
// a throwing top-level import here would redbox unrelated flows (booking→pay).
// KYC itself still requires a native build that bundles the module to function.
type ImagePickerModule = typeof import("expo-image-picker");
let imagePickerCache: ImagePickerModule | null = null;
function getImagePicker(): ImagePickerModule {
  if (!imagePickerCache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    imagePickerCache = require("expo-image-picker") as ImagePickerModule;
  }
  return imagePickerCache;
}

type FieldState =
  | { status: "empty" }
  | { status: "uploading"; uri: string }
  | { status: "uploaded"; uri: string }
  | { status: "error"; uri: string; message: string };

type Uploads = Record<KycField, FieldState>;

const EMPTY: FieldState = { status: "empty" };

export default function KYCScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const agencyId = useAgencyStore((s) => s.paired?.id ?? null);
  const [step, setStep] = useState(1);
  const [uploads, setUploads] = useState<Uploads>({
    idFront: EMPTY,
    idBack: EMPTY,
    licenseFront: EMPTY,
    licenseBack: EMPTY,
  });

  const progress = (step / 3) * 100;

  const handleBack = useCallback(() => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }, [step, router]);

  const handleSkip = useCallback(() => {
    router.replace("/home");
  }, [router]);

  const handleContinue = useCallback(() => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      router.replace("/home");
    }
  }, [step, router]);

  const runUpload = useCallback(
    async (key: KycField, uri: string) => {
      if (!agencyId) {
        setUploads((prev) => ({
          ...prev,
          [key]: {
            status: "error",
            uri,
            message: t("kyc.errors.noAgency", {
              defaultValue: "No agency paired.",
            }),
          },
        }));
        return;
      }
      setUploads((prev) => ({ ...prev, [key]: { status: "uploading", uri } }));
      try {
        await uploadKycDocument(agencyId, key, uri);
        setUploads((prev) => ({ ...prev, [key]: { status: "uploaded", uri } }));
        queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
      } catch (e) {
        setUploads((prev) => ({
          ...prev,
          [key]: {
            status: "error",
            uri,
            message:
              e instanceof Error
                ? e.message
                : t("kyc.errors.uploadFailed", {
                    defaultValue: "Upload failed. Try again.",
                  }),
          },
        }));
      }
    },
    [agencyId, queryClient, t],
  );

  const pickFromLibrary = useCallback(
    async (key: KycField) => {
      const perm = await getImagePicker().requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t("kyc.permission.title", { defaultValue: "Permission required" }),
          t("kyc.permission.library", {
            defaultValue: "Allow photo library access to upload your documents.",
          }),
        );
        return;
      }
      const result = await getImagePicker().launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        await runUpload(key, result.assets[0].uri);
      }
    },
    [runUpload, t],
  );

  const pickFromCamera = useCallback(
    async (key: KycField) => {
      const perm = await getImagePicker().requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t("kyc.permission.title", { defaultValue: "Permission required" }),
          t("kyc.permission.camera", {
            defaultValue: "Allow camera access to photograph your documents.",
          }),
        );
        return;
      }
      const result = await getImagePicker().launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        await runUpload(key, result.assets[0].uri);
      }
    },
    [runUpload, t],
  );

  const handlePick = useCallback(
    (key: KycField) => {
      Alert.alert(
        t("kyc.step2.pickTitle", { defaultValue: "Add document" }),
        undefined,
        [
          {
            text: t("kyc.step2.takePhoto", { defaultValue: "Take a photo" }),
            onPress: () => {
              void pickFromCamera(key);
            },
          },
          {
            text: t("kyc.step2.chooseLibrary", {
              defaultValue: "Choose from library",
            }),
            onPress: () => {
              void pickFromLibrary(key);
            },
          },
          { text: t("common.cancel"), style: "cancel" },
        ],
      );
    },
    [pickFromCamera, pickFromLibrary, t],
  );

  const handleRemove = useCallback((key: KycField) => {
    setUploads((prev) => ({ ...prev, [key]: EMPTY }));
  }, []);

  const allUploaded = KYC_FIELDS.every(
    (f) => uploads[f].status === "uploaded",
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            testID="kyc-back-button"
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#EAEAEA" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>{t("kyc.stepLabel", { current: step, total: 3 })}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Step 1: Introduction */}
        {step === 1 && <Step1 onContinue={handleContinue} onSkip={handleSkip} />}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <Step2
            uploads={uploads}
            onPick={handlePick}
            onRemove={handleRemove}
            onContinue={handleContinue}
            allUploaded={allUploaded}
          />
        )}

        {/* Step 3: Verification Pending */}
        {step === 3 && <Step3 onContinue={handleContinue} />}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Step 1: Introduction ─── */

function Step1({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const benefits = [
    t("kyc.step1.benefit1"),
    t("kyc.step1.benefit2"),
    t("kyc.step1.benefit3"),
  ];

  return (
    <>
      <Text style={styles.title}>{t("kyc.step1.title")}</Text>
      <Text style={styles.description}>
        {t("kyc.step1.description")}
      </Text>

      {/* Icon Card */}
      <View style={styles.iconCard}>
        <View style={styles.iconCircle}>
          <CheckCircle size={48} color="#4A1942" strokeWidth={1.5} />
        </View>
      </View>

      {/* Benefits */}
      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitRow}>
            <CheckCircle size={20} color="#4A1942" strokeWidth={1.5} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      <Button fullWidth onPress={onContinue} testID="kyc-start-button">
        {t("kyc.step1.startButton")}
      </Button>

      <TouchableOpacity
        testID="kyc-later-button"
        onPress={onSkip}
        style={styles.skipButton}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>{t("kyc.step1.laterButton")}</Text>
      </TouchableOpacity>
    </>
  );
}

/* ─── Step 2: Document Upload ─── */

function UploadBox({
  state,
  label,
  icon,
  testID,
  onPick,
  onRemove,
}: {
  state: FieldState;
  label: string;
  icon: "camera" | "upload";
  testID: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const IconComponent = icon === "camera" ? Camera : Upload;
  const hasImage = state.status !== "empty";

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPick}
      disabled={state.status === "uploading"}
      activeOpacity={0.85}
      style={[
        styles.uploadBox,
        {
          backgroundColor: hasImage ? "#2E1C2B" : "transparent",
          borderColor:
            state.status === "error"
              ? "#E74C3C"
              : state.status === "uploaded"
                ? "#4A1942"
                : "rgba(234, 234, 234, 0.15)",
        },
      ]}
    >
      {hasImage ? (
        <>
          <Image
            source={{ uri: state.uri }}
            style={styles.thumbnail}
            contentFit="cover"
          />
          {state.status === "uploading" && (
            <View style={styles.overlay}>
              <ActivityIndicator color="#EAEAEA" />
            </View>
          )}
          {state.status === "uploaded" && (
            <View style={styles.badge}>
              <CheckCircle size={18} color="#2ECC71" strokeWidth={2} />
            </View>
          )}
          {state.status === "error" && (
            <View style={[styles.overlay, styles.errorOverlay]}>
              <AlertCircle size={20} color="#E74C3C" strokeWidth={2} />
              <Text style={styles.errorText} numberOfLines={2}>
                {state.message}
              </Text>
            </View>
          )}
          {state.status !== "uploading" && (
            <TouchableOpacity
              testID={`${testID}-remove`}
              onPress={onRemove}
              style={styles.removeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <X size={14} color="#EAEAEA" strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <IconComponent
            size={24}
            color="rgba(234, 234, 234, 0.4)"
            strokeWidth={1.5}
          />
          <Text style={styles.uploadLabel}>{label}</Text>
          <Text style={styles.uploadHint}>{t("kyc.step2.tapToAdd")}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function Step2({
  uploads,
  onPick,
  onRemove,
  onContinue,
  allUploaded,
}: {
  uploads: Uploads;
  onPick: (key: KycField) => void;
  onRemove: (key: KycField) => void;
  onContinue: () => void;
  allUploaded: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.title}>{t("kyc.step2.title")}</Text>
      <Text style={styles.description}>
        {t("kyc.step2.description")}
      </Text>

      {/* ID Card */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadSectionLabel}>{t("kyc.step2.idCardLabel")}</Text>
        <View style={styles.uploadGrid}>
          <UploadBox
            testID="kyc-upload-id-front"
            state={uploads.idFront}
            label={t("kyc.step2.front")}
            icon="camera"
            onPick={() => onPick("idFront")}
            onRemove={() => onRemove("idFront")}
          />
          <UploadBox
            testID="kyc-upload-id-back"
            state={uploads.idBack}
            label={t("kyc.step2.back")}
            icon="camera"
            onPick={() => onPick("idBack")}
            onRemove={() => onRemove("idBack")}
          />
        </View>
      </View>

      {/* Driver's License */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadSectionLabel}>{t("kyc.step2.licenseLabel")}</Text>
        <View style={styles.uploadGrid}>
          <UploadBox
            testID="kyc-upload-license-front"
            state={uploads.licenseFront}
            label={t("kyc.step2.front")}
            icon="upload"
            onPick={() => onPick("licenseFront")}
            onRemove={() => onRemove("licenseFront")}
          />
          <UploadBox
            testID="kyc-upload-license-back"
            state={uploads.licenseBack}
            label={t("kyc.step2.back")}
            icon="upload"
            onPick={() => onPick("licenseBack")}
            onRemove={() => onRemove("licenseBack")}
          />
        </View>
      </View>

      {/* Tip */}
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          {t("kyc.step2.tip")}
        </Text>
      </View>

      <Button
        fullWidth
        onPress={onContinue}
        disabled={!allUploaded}
        testID="kyc-step2-continue"
      >
        {t("common.continue")}
      </Button>
    </>
  );
}

/* ─── Step 3: Verification Pending ─── */

function PulsingCircle() {
  const opacity = useSharedValue(1);

  // Start pulse animation
  opacity.value = withRepeat(
    withSequence(
      withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    false
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulsingCircle, animatedStyle]}>
      <CheckCircle size={64} color="#4A1942" strokeWidth={1.5} />
    </Animated.View>
  );
}

function Step3({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={[styles.title, styles.textCenter]}>
        {t("kyc.step3.title")}
      </Text>
      <Text style={[styles.description, styles.textCenter]}>
        {t("kyc.step3.description")}
      </Text>

      {/* Pulsing Icon Card */}
      <View style={styles.pendingCard}>
        <PulsingCircle />
      </View>

      {/* Status Badge */}
      <View style={styles.badgeContainer}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{t("kyc.step3.statusBadge")}</Text>
        </View>
      </View>

      <Button fullWidth onPress={onContinue} testID="kyc-step3-home-button">
        {t("kyc.step3.homeButton")}
      </Button>
    </>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050404",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stepLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.6)",
  },

  // Progress
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(234, 234, 234, 0.1)",
    marginBottom: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4A1942",
  },

  // Shared
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#EAEAEA",
    marginBottom: 8,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "rgba(234, 234, 234, 0.7)",
    lineHeight: 22,
    marginBottom: 24,
  },
  textCenter: {
    textAlign: "center",
  },

  // Step 1
  iconCard: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#2E1C2B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(74, 25, 66, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitsList: {
    gap: 12,
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#EAEAEA",
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  skipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "rgba(234, 234, 234, 0.5)",
  },

  // Step 2
  uploadSection: {
    marginBottom: 16,
  },
  uploadSectionLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.8)",
    marginBottom: 8,
  },
  uploadGrid: {
    flexDirection: "row",
    gap: 12,
  },
  uploadBox: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    position: "relative",
    overflow: "hidden",
  },
  uploadLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(234, 234, 234, 0.5)",
    textAlign: "center",
  },
  uploadHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(234, 234, 234, 0.35)",
    textAlign: "center",
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 4, 4, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  errorOverlay: {
    backgroundColor: "rgba(5, 4, 4, 0.78)",
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "#E74C3C",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(5, 4, 4, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(5, 4, 4, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipBox: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(74, 25, 66, 0.1)",
    marginBottom: 24,
  },
  tipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.5)",
    lineHeight: 18,
  },

  // Step 3
  pendingCard: {
    borderRadius: 16,
    padding: 32,
    backgroundColor: "#2E1C2B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulsingCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(74, 25, 66, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(243, 156, 18, 0.15)",
  },
  statusBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#F39C12",
  },
});
