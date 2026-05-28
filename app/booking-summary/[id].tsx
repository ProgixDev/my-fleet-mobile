import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  Gauge,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { useBookingDetail } from "@/hooks/useBookings";

type VehicleFinalState = "ok" | "minor-damage" | "major-damage";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200";

// ── Helpers ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GALLERY_GUTTER = 16;
const GALLERY_WIDTH = SCREEN_WIDTH - GALLERY_GUTTER * 2;
const GALLERY_HEIGHT = 220;

interface FinalStateInfo {
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  tone: "success" | "warning" | "danger";
}

function getFinalStateInfo(state?: VehicleFinalState): FinalStateInfo {
  switch (state) {
    case "minor-damage":
      return {
        labelKey: "bookingSummary.state.minorLabel",
        descriptionKey: "bookingSummary.state.minorDescription",
        icon: AlertTriangle,
        tone: "warning",
      };
    case "major-damage":
      return {
        labelKey: "bookingSummary.state.majorLabel",
        descriptionKey: "bookingSummary.state.majorDescription",
        icon: ShieldAlert,
        tone: "danger",
      };
    case "ok":
    default:
      return {
        labelKey: "bookingSummary.state.okLabel",
        descriptionKey: "bookingSummary.state.okDescription",
        icon: CheckCircle2,
        tone: "success",
      };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function BookingSummaryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();

  const { data: booking } = useBookingDetail(id);
  const heroImage = FALLBACK_HERO;

  if (!booking) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t("bookingSummary.notFound")}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backPill, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.backPillText, { color: "#EAEAEA" }]}>
              {t("bookingSummary.back")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Final-state classification: backend doesn't ship a final-state field yet,
  // so we infer from km overage as a best-effort.
  const overage = booking.kmOverage ?? 0;
  const overageCost = booking.overageCost ?? 0;
  const hasOverage = overage > 0;
  const vehicleFinalState: VehicleFinalState =
    overage === 0 ? "ok" : overage > 100 ? "major-damage" : "minor-damage";
  const finalState = getFinalStateInfo(vehicleFinalState);
  const FinalStateIcon = finalState.icon;
  const photos: string[] = [];

  // Tone → color mapping for the État badge
  const stateToneColor =
    finalState.tone === "success"
      ? "#2ECC71"
      : finalState.tone === "warning"
        ? "#F59E0B"
        : colors.error;
  const stateToneBg =
    finalState.tone === "success"
      ? "rgba(46, 204, 113, 0.15)"
      : finalState.tone === "warning"
        ? "rgba(245, 158, 11, 0.15)"
        : colors.errorSoft;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Header with back button ─── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.headerRow}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark
                  ? "rgba(234, 234, 234, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            {t("bookingSummary.title")}
          </Text>
          <View style={styles.iconButtonPlaceholder} />
        </Animated.View>

        {/* ─── Hero with image + model + dates ─── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={[
            styles.heroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.heroImageWrap}>
            <Image source={{ uri: heroImage }} style={styles.heroImage} />
            <LinearGradient
              colors={["transparent", "rgba(5, 4, 4, 0.75)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroReference}>
                {t("bookingSummary.reference", { ref: booking.reference })}
              </Text>
              <Text style={styles.heroVehicleName}>{booking.vehicleName}</Text>
              <Text style={styles.heroAgency}>
                {booking.agencyName}
              </Text>
            </View>
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.heroMetaRow}>
              <Calendar size={16} color={colors.primary} strokeWidth={1.7} />
              <Text style={[styles.heroMetaText, { color: colors.text }]}>
                {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Kilométrage card ─── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(160)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.cardIconBox,
                { backgroundColor: "rgba(74, 25, 66, 0.25)" },
              ]}
            >
              <Gauge size={18} color={colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t("bookingSummary.mileageTitle")}
            </Text>
          </View>

          <View style={styles.kmRows}>
            <KmRow
              label={t("bookingSummary.mileage.start")}
              value={t("bookingSummary.mileage.kmUnit", { value: (booking.startMileage ?? 0).toLocaleString("fr-FR") })}
              colors={colors}
            />
            <KmRow
              label={t("bookingSummary.mileage.return")}
              value={t("bookingSummary.mileage.kmUnit", { value: (booking.returnMileage ?? 0).toLocaleString("fr-FR") })}
              colors={colors}
            />
            <KmRow
              label={t("bookingSummary.mileage.driven")}
              value={t("bookingSummary.mileage.kmUnit", { value: (booking.kmDriven ?? 0).toLocaleString("fr-FR") })}
              colors={colors}
              accent
            />
            <KmRow
              label={t("bookingSummary.mileage.included")}
              value={t("bookingSummary.mileage.kmUnit", { value: (booking.includedKm ?? 0).toLocaleString("fr-FR") })}
              colors={colors}
            />
            <KmRow
              label={t("bookingSummary.mileage.overage")}
              value={
                hasOverage
                  ? t("bookingSummary.mileage.overageUnit", { value: overage.toLocaleString("fr-FR") })
                  : t("bookingSummary.mileage.overageZero")
              }
              colors={colors}
              highlight={hasOverage}
            />
            <KmRow
              label={t("bookingSummary.mileage.overageCost")}
              value={
                hasOverage
                  ? t("bookingSummary.mileage.overageCostUnit", { value: overageCost.toFixed(2).replace(".", ",") })
                  : t("bookingSummary.mileage.overageCostZero")
              }
              colors={colors}
              highlight={hasOverage}
              isLast
            />
          </View>

          {hasOverage && booking.extraKmRate != null && (
            <View
              style={[
                styles.overageNote,
                {
                  backgroundColor: colors.errorSoft,
                  borderColor: colors.error,
                },
              ]}
            >
              <AlertTriangle size={14} color={colors.error} strokeWidth={1.8} />
              <Text style={[styles.overageNoteText, { color: colors.error }]}>
                {t("bookingSummary.mileage.rateNote", { rate: booking.extraKmRate.toFixed(2).replace(".", ",") })}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ─── État du véhicule card ─── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View
              style={[styles.cardIconBox, { backgroundColor: stateToneBg }]}
            >
              <FinalStateIcon
                size={18}
                color={stateToneColor}
                strokeWidth={1.8}
              />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t("bookingSummary.stateTitle")}
            </Text>
          </View>
          <View
            style={[
              styles.stateBadge,
              {
                backgroundColor: stateToneBg,
                borderColor: stateToneColor,
              },
            ]}
          >
            <Text style={[styles.stateBadgeLabel, { color: stateToneColor }]}>
              {t(finalState.labelKey)}
            </Text>
          </View>
          <Text
            style={[styles.stateDescription, { color: colors.textSecondary }]}
          >
            {t(finalState.descriptionKey)}
          </Text>
        </Animated.View>

        {/* ─── Galerie photos après location ─── */}
        {photos.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(320)}
            style={styles.gallerySection}
          >
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              {t("bookingSummary.gallery.title")}
            </Text>
            <Text
              style={[styles.sectionHint, { color: colors.textSecondary }]}
            >
              {t("bookingSummary.gallery.hint")}
            </Text>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={GALLERY_WIDTH + 12}
              decelerationRate="fast"
              style={styles.galleryScroll}
            >
              {photos.map((uri, idx) => (
                <View
                  key={`${uri}-${idx}`}
                  style={[
                    styles.galleryItem,
                    {
                      width: GALLERY_WIDTH,
                      marginRight: idx === photos.length - 1 ? 0 : 12,
                    },
                  ]}
                >
                  <Image source={{ uri }} style={styles.galleryImage} />
                  <View style={styles.galleryCountPill}>
                    <Text style={styles.galleryCountText}>
                      {t("bookingSummary.gallery.counter", { current: idx + 1, total: photos.length })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ─── Facture CTA ─── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.invoiceSection}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push(`/confirmation/${booking.id}` as never)}
            style={[
              styles.invoiceButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <View style={styles.invoiceButtonInner}>
              <View style={styles.invoiceIconBox}>
                <FileText size={18} color="#EAEAEA" strokeWidth={1.8} />
              </View>
              <View style={styles.invoiceButtonText}>
                <Text style={styles.invoiceButtonTitle}>{t("bookingSummary.invoice.title")}</Text>
                <Text style={styles.invoiceButtonSubtitle}>
                  {hasOverage
                    ? t("bookingSummary.invoice.subtitleWithOverage", {
                        total: booking.total,
                        overage: overageCost.toFixed(2).replace(".", ","),
                      })
                    : t("bookingSummary.invoice.subtitle", { total: booking.total })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Kilométrage Row ───────────────────────────────────────────────────────

interface KmRowProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
  highlight?: boolean;
  accent?: boolean;
  isLast?: boolean;
}

function KmRow({ label, value, colors, highlight, accent, isLast }: KmRowProps) {
  const valueColor = highlight
    ? colors.error
    : accent
      ? colors.primary
      : colors.text;
  return (
    <View
      style={[
        styles.kmRow,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : 1,
          backgroundColor: highlight ? colors.errorSoft : "transparent",
        },
      ]}
    >
      <Text style={[styles.kmLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.kmValue,
          {
            color: valueColor,
            fontFamily: highlight || accent
              ? "Poppins_700Bold"
              : "Poppins_600SemiBold",
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GALLERY_GUTTER,
    paddingTop: 12,
    paddingBottom: 40,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  emptyText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  backPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backPillText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconButtonPlaceholder: { width: 40, height: 40 },
  screenTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    flex: 1,
    textAlign: "center",
  },

  // Hero card
  heroCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 14,
  },
  heroImageWrap: { height: 180, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    position: "absolute",
    bottom: 14,
    left: 16,
    right: 16,
    gap: 2,
  },
  heroReference: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(234, 234, 234, 0.75)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroVehicleName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#EAEAEA",
  },
  heroAgency: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.7)",
  },
  heroMeta: { padding: 14 },
  heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroMetaText: { fontFamily: "Poppins_500Medium", fontSize: 13 },

  // Generic card
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },

  // Km rows
  kmRows: {
    borderRadius: 14,
    overflow: "hidden",
  },
  kmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  kmLabel: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  kmValue: { fontSize: 14 },

  overageNote: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  overageNoteText: { fontFamily: "Poppins_500Medium", fontSize: 12 },

  // État
  stateBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
  },
  stateBadgeLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  stateDescription: { fontFamily: "Poppins_400Regular", fontSize: 13 },

  // Gallery
  gallerySection: {
    marginBottom: 14,
  },
  sectionLabel: { fontFamily: "Poppins_700Bold", fontSize: 15, marginBottom: 2 },
  sectionHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginBottom: 10,
  },
  galleryScroll: { marginHorizontal: -GALLERY_GUTTER },
  galleryItem: {
    height: GALLERY_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: GALLERY_GUTTER,
  },
  galleryImage: { width: "100%", height: "100%" },
  galleryCountPill: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(5, 4, 4, 0.55)",
  },
  galleryCountText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#EAEAEA",
  },

  // Invoice
  invoiceSection: { marginTop: 6 },
  invoiceButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  invoiceButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  invoiceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  invoiceButtonText: { flex: 1 },
  invoiceButtonTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#EAEAEA",
  },
  invoiceButtonSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.75)",
  },
});
