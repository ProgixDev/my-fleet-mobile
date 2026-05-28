import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Car,
  Fuel,
  Gauge,
  Heart,
  Palette,
  Settings2,
  Share2,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { useVehicleDetail } from "@/hooks/useAgencyFleet";
import { useAgencyStore } from "@/stores/useAgencyStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 8;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 40 - GRID_GAP) / 2;

interface Spec {
  icon: LucideIcon;
  label: string;
  value: string;
}

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const paired = useAgencyStore((s) => s.paired);
  const agencyId = paired?.id ?? null;

  const {
    data: vehicle,
    isLoading,
    isError,
  } = useVehicleDetail(id ?? null, agencyId);

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const galleryRef = useRef<ScrollView>(null);

  const galleryUrls = useMemo(() => {
    if (!vehicle) return [] as string[];
    const fromAngles = vehicle.images.map((img) => img.url);
    if (fromAngles.length > 0) return fromAngles;
    return vehicle.thumbnailUrl ? [vehicle.thumbnailUrl] : [];
  }, [vehicle]);

  if (isLoading || !id) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !vehicle) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {t("vehicle.errorLoading")}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backCta, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.backCtaText}>{t("vehicle.goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const specs: Spec[] = [
    {
      icon: Settings2,
      label: t("vehicle.specs.transmission"),
      value: vehicle.transmission,
    },
    {
      icon: Fuel,
      label: t("vehicle.specs.fuel"),
      value: vehicle.fuelType,
    },
    {
      icon: Users,
      label: t("vehicle.specs.seats"),
      value: t("vehicle.specs.seatsValue", { count: vehicle.seats }),
    },
    {
      icon: Gauge,
      label: t("vehicle.specs.mileage"),
      value: t("vehicle.specs.mileageValue", {
        km: vehicle.mileage.toLocaleString(),
      }),
    },
    {
      icon: Car,
      label: t("vehicle.specs.brand"),
      value: vehicle.brand,
    },
    ...(vehicle.color
      ? [
          {
            icon: Palette,
            label: t("vehicle.specs.color"),
            value: vehicle.color,
          },
        ]
      : []),
  ];

  const totalImages = galleryUrls.length;

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_WIDTH);
    if (idx !== galleryIndex) setGalleryIndex(idx);
  };

  const agencyAvatarLetter = (paired?.name ?? "?").charAt(0).toUpperCase();
  const hasLogoUrl = !!paired?.logo && /^https?:\/\//i.test(paired.logo);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Hero gallery */}
        <View style={styles.hero}>
          {totalImages > 0 ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onGalleryScroll}
              scrollEventThrottle={16}
            >
              {galleryUrls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.heroImage} />
              ))}
            </ScrollView>
          ) : (
            <View
              style={[styles.heroImage, { backgroundColor: colors.surface }]}
            />
          )}

          <SafeAreaView style={styles.heroNavRow} edges={["top"]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.heroBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={1.8} />
            </TouchableOpacity>

            <View style={styles.heroRightBtns}>
              <TouchableOpacity
                style={styles.heroBtn}
                activeOpacity={0.7}
                onPress={() => {
                  Share.share({
                    message: "Check this vehicle on MyFleet.",
                  }).catch(() => {});
                }}
              >
                <Share2 size={20} color="#FFFFFF" strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroBtn}
                activeOpacity={0.7}
                onPress={() => setIsFavorite((v) => !v)}
              >
                <Heart
                  size={20}
                  color={isFavorite ? "#EF4444" : "#FFFFFF"}
                  fill={isFavorite ? "#EF4444" : "transparent"}
                  strokeWidth={1.8}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {totalImages > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {t("vehicle.imageCounter", {
                  current: galleryIndex + 1,
                  total: totalImages,
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={[styles.vehicleName, { color: colors.text }]}>
              {vehicle.name}
            </Text>
            <Text style={[styles.vehicleYear, { color: colors.textSecondary }]}>
              {vehicle.year}
            </Text>

            <View
              style={[styles.pricePill, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.priceValue}>
                {t("common.priceEuro", { price: vehicle.dailyRate })}
              </Text>
              <Text style={styles.priceUnit}> {t("common.perDay")}</Text>
            </View>

            {!!paired && (
              <View style={styles.agencyLink}>
                <View
                  style={[
                    styles.agencyDot,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  {hasLogoUrl ? (
                    <Image
                      source={{ uri: paired.logo }}
                      style={styles.agencyDotImage}
                    />
                  ) : (
                    <Text style={styles.agencyDotText}>
                      {agencyAvatarLetter}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.agencyLinkName,
                    { color: colors.textSecondary },
                  ]}
                >
                  {paired.name}
                </Text>
              </View>
            )}
          </View>

          {/* Specs */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("vehicle.specsTitle")}
            </Text>
            <View style={styles.specsGrid}>
              {specs.map((spec, index) => {
                const Icon = spec.icon;
                return (
                  <View
                    key={index}
                    style={[
                      styles.specCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Icon
                      size={24}
                      color={colors.textSecondary}
                      strokeWidth={1.5}
                    />
                    <Text
                      style={[styles.specLabel, { color: colors.textMuted }]}
                    >
                      {spec.label}
                    </Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>
                      {spec.value}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Features */}
          {vehicle.features.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("vehicle.featuresTitle")}
              </Text>
              <View style={styles.featuresWrap}>
                {vehicle.features.map((feature, index) => (
                  <View
                    key={index}
                    style={[
                      styles.featurePill,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.featurePillText, { color: colors.text }]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mileage policy */}
          {(vehicle.includedKm != null || vehicle.extraKmRate != null) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("vehicle.mileagePolicyTitle")}
              </Text>
              <View
                style={[
                  styles.mileageCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {vehicle.includedKm != null && (
                  <View style={styles.mileageRow}>
                    <Text
                      style={[
                        styles.mileageLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("vehicle.includedKm")}
                    </Text>
                    <Text style={[styles.mileageValue, { color: colors.text }]}>
                      {vehicle.includedKm.toLocaleString()} km
                    </Text>
                  </View>
                )}
                {vehicle.extraKmRate != null && (
                  <View style={styles.mileageRow}>
                    <Text
                      style={[
                        styles.mileageLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("vehicle.extraKmRate")}
                    </Text>
                    <Text style={[styles.mileageValue, { color: colors.text }]}>
                      {t("common.priceEuro", { price: vehicle.extraKmRate })}
                      /km
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.bottomPriceRow}>
          <Text style={[styles.bottomPrice, { color: colors.text }]}>
            {t("common.priceEuro", { price: vehicle.dailyRate })}
          </Text>
          <Text style={[styles.bottomUnit, { color: colors.textSecondary }]}>
            {" "}
            {t("common.perDay")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/booking/${vehicle.id}` as any)}
          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.9}
        >
          <Text style={styles.bookBtnText}>{t("vehicle.bookButton")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  backCta: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  backCtaText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },

  /* Hero */
  hero: { height: 320, position: "relative" },
  heroImage: { width: SCREEN_WIDTH, height: 320 },
  heroNavRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(5, 4, 4, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroRightBtns: { flexDirection: "row", gap: 8 },
  imageCounter: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(5, 4, 4, 0.7)",
  },
  imageCounterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },

  /* Body */
  body: { paddingHorizontal: 20, paddingTop: 24 },
  headerBlock: { marginBottom: 24 },
  vehicleName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  vehicleYear: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    marginBottom: 12,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  priceValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#FFFFFF",
  },
  priceUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
  },
  agencyLink: { flexDirection: "row", alignItems: "center", gap: 8 },
  agencyDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  agencyDotImage: { width: "100%", height: "100%", borderRadius: 999 },
  agencyDotText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  agencyLinkName: { fontFamily: "Poppins_500Medium", fontSize: 14 },

  /* Sections */
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    marginBottom: 12,
  },

  /* Specs */
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  specCard: {
    width: GRID_ITEM_WIDTH,
    borderRadius: 22,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  specLabel: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  specValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  /* Features */
  featuresWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featurePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  featurePillText: { fontFamily: "Poppins_500Medium", fontSize: 12 },

  /* Mileage */
  mileageCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  mileageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mileageLabel: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  mileageValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  /* Bottom bar */
  bottomBar: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  bottomPriceRow: { flexDirection: "row", alignItems: "baseline" },
  bottomPrice: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  bottomUnit: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  bookBtn: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
