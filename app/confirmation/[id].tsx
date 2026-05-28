import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Receipt,
  CheckCircle,
  Car,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { useBookingDetail } from "@/hooks/useBookings";
import { centsToUnits } from "@/utils/money";

export default function ConfirmationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const { data: booking } = useBookingDetail(id);

  const vehicleName =
    booking?.vehicleName ?? t("confirmation.vehicleFallback");
  const agencyName =
    booking?.agencyName ?? t("confirmation.agencyFallback");
  const reference = booking?.reference ?? "—";
  const total = booking ? centsToUnits(booking.total) : 0;
  const startDate = booking?.startDate ?? "";
  const endDate = booking?.endDate ?? "";
  const startTime = booking?.startTime ?? "";
  const endTime = booking?.endTime ?? "";
  const deliveryAddress = "";
  const withChauffeur = booking?.withChauffeur ?? false;

  return (
    <View style={styles.container}>
      <StatusBar style={colors.statusBarStyle} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <Text style={styles.stepLabel}>
          {t("confirmation.stepLabel", { current: 3, total: 3 })}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success icon */}
        <View style={styles.successCircle}>
          <CheckCircle size={44} color="#2ECC71" strokeWidth={1.8} />
        </View>

        <Text style={styles.title}>{t("confirmation.title")}</Text>
        <Text style={styles.subtitle}>{t("confirmation.subtitle")}</Text>

        <View style={styles.refBadge}>
          <Text style={styles.refText}>
            {t("confirmation.reference", { ref: reference })}
          </Text>
        </View>

        {/* ─── Summary card ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleThumb}>
              <Car size={26} color="#FFFFFF" strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {vehicleName}
              </Text>
              <Text style={styles.agencyName} numberOfLines={1}>
                {agencyName}
              </Text>
            </View>
          </View>

          <View style={styles.detailsList}>
            <DetailRow
              icon={<Calendar size={18} color={colors.textSecondary} strokeWidth={1.8} />}
              text={`${formatDate(startDate, t)} – ${formatDate(endDate, t)}`}
              styles={styles}
            />
            <DetailRow
              icon={<Clock size={18} color={colors.textSecondary} strokeWidth={1.8} />}
              text={`${startTime} – ${endTime}`}
              styles={styles}
            />
            <DetailRow
              icon={<MapPin size={18} color={colors.textSecondary} strokeWidth={1.8} />}
              text={t("confirmation.deliveryLine", { address: deliveryAddress })}
              styles={styles}
            />
            {withChauffeur && (
              <DetailRow
                icon={<User size={18} color={colors.textSecondary} strokeWidth={1.8} />}
                text={t("confirmation.withChauffeur")}
                styles={styles}
              />
            )}

            <View style={styles.totalRow}>
              <Receipt size={18} color={colors.primary} strokeWidth={1.8} />
              <Text style={styles.totalText}>
                {t("confirmation.totalLine", { total: total.toLocaleString() })}
              </Text>
            </View>
          </View>
        </View>

        {/* CTAs */}
        <TouchableOpacity
          onPress={() => router.push(`/tracking/${id}` as any)}
          style={styles.primaryCta}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryCtaText}>
            {t("confirmation.trackBooking")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.7}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.homeButtonText}>{t("confirmation.backHome")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  text,
  styles,
}: {
  icon: React.ReactNode;
  text: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.detailRow}>
      {icon}
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function formatDate(dateStr: string, t: (key: string) => string): string {
  const monthKeys = [
    "confirmation.months.jan",
    "confirmation.months.feb",
    "confirmation.months.mar",
    "confirmation.months.apr",
    "confirmation.months.may",
    "confirmation.months.jun",
    "confirmation.months.jul",
    "confirmation.months.aug",
    "confirmation.months.sep",
    "confirmation.months.oct",
    "confirmation.months.nov",
    "confirmation.months.dec",
  ];
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const day = parseInt(parts[2]!, 10);
  const month = t(monthKeys[parseInt(parts[1]!, 10) - 1]!);
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

function makeStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  isDark: boolean,
) {
  const accentSoft = isDark ? "rgba(74, 25, 66, 0.25)" : "rgba(74, 25, 66, 0.1)";
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    stepLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      paddingTop: 8,
      marginBottom: 14,
      letterSpacing: 0.3,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginHorizontal: 120,
      overflow: "hidden",
      marginBottom: 10,
    },
    progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 40,
      alignItems: "center",
    },

    successCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "rgba(46, 204, 113, 0.15)",
      borderWidth: 2,
      borderColor: "rgba(46, 204, 113, 0.3)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
    },

    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 26,
      color: colors.text,
      marginBottom: 10,
      textAlign: "center",
      letterSpacing: -0.4,
    },
    subtitle: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 320,
      marginBottom: 22,
      lineHeight: 21,
    },

    refBadge: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: accentSoft,
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: 26,
    },
    refText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: colors.primary,
      letterSpacing: 0.3,
    },

    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      width: "100%",
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehicleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingBottom: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    vehicleThumb: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    vehicleName: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
      letterSpacing: -0.2,
    },
    agencyName: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: colors.textSecondary,
    },

    detailsList: { gap: 12 },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    detailText: {
      flex: 1,
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: colors.text,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 14,
      marginTop: 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalText: {
      flex: 1,
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: colors.text,
    },

    primaryCta: {
      height: 54,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    primaryCtaText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: "#FFFFFF",
      letterSpacing: 0.3,
    },
    homeButton: {
      paddingVertical: 16,
      width: "100%",
      alignItems: "center",
    },
    homeButtonText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
}
