import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, MapPin, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from "@/context/ThemeContext";
import { useMyBookings } from "@/hooks/useBookings";
import { centsToUnits } from "@/utils/money";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
  "https://images.unsplash.com/photo-1469285994282-454ceb49e63c?w=800",
];

type TabKey = "active" | "upcoming" | "history";

interface Tab {
  key: TabKey;
  labelKey: string;
}

const tabs: Tab[] = [
  { key: "active", labelKey: "bookings.tabs.active" },
  { key: "upcoming", labelKey: "bookings.tabs.upcoming" },
  { key: "history", labelKey: "bookings.tabs.history" },
];

export default function BookingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const { data: rawBookings = [], isLoading, isError, refetch } = useMyBookings();

  const bookings = useMemo(() => {
    return rawBookings.filter((b) => {
      if (activeTab === "active") return b.status === "active";
      if (activeTab === "upcoming") return b.status === "confirmed";
      return b.status === "completed";
    });
  }, [rawBookings, activeTab]);

  const statusConfig: Record<
    string,
    { bg: string; color: string; borderColor: string; labelKey: string }
  > = {
    active: {
      bg: isDark ? "rgba(74, 25, 66, 0.3)" : "rgba(74, 25, 66, 0.12)",
      color: colors.primary,
      borderColor: "rgba(74, 25, 66, 0.5)",
      labelKey: "bookings.status.active",
    },
    confirmed: {
      bg: "rgba(46, 204, 113, 0.2)",
      color: "#2ECC71",
      borderColor: "rgba(46, 204, 113, 0.4)",
      labelKey: "bookings.status.confirmed",
    },
    completed: {
      bg: isDark ? "rgba(234, 234, 234, 0.15)" : "rgba(0, 0, 0, 0.06)",
      color: colors.textSecondary,
      borderColor: colors.border,
      labelKey: "bookings.status.completed",
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          {t("bookings.title")}
        </Text>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {/* Tabs */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                testID={`bookings-tab-${tab.key}`}
                accessibilityRole="button"
                accessibilityLabel={t(tab.labelKey)}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: colors.primary },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? "#FFFFFF" : colors.textSecondary },
                  ]}
                >
                  {t(tab.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Booking Cards */}
        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: 60, alignItems: "center", gap: 12 }}>
            <Text style={{ color: colors.textSecondary }}>
              {t("bookings.loadError", { defaultValue: "Impossible de charger vos réservations." })}
            </Text>
            <TouchableOpacity
              testID="bookings-retry-button"
              accessibilityRole="button"
              onPress={() => refetch()}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {t("common.retry", { defaultValue: "Réessayer" })}
              </Text>
            </TouchableOpacity>
          </View>
        ) : bookings.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center", gap: 8 }}>
            <Calendar size={32} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {t("bookings.empty", {
                defaultValue: "Aucune réservation dans cette catégorie.",
              })}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {bookings.map((booking, index) => {
              const status =
                statusConfig[booking.status] ?? statusConfig.completed;
              const cover = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

              return (
                <TouchableOpacity
                  key={booking.id}
                  testID={`bookings-card-${booking.id}`}
                  accessibilityRole="button"
                  activeOpacity={0.95}
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() =>
                    router.push(
                      booking.status === "completed"
                        ? (`/booking-summary/${booking.id}` as any)
                        : (`/tracking/${booking.id}` as any),
                    )
                  }
                >
                  <View style={styles.cardImageWrapper}>
                    <Image source={{ uri: cover }} style={styles.cardImage} />
                    <LinearGradient
                      colors={["transparent", "rgba(5, 4, 4, 0.7)"]}
                      locations={[0, 1]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: status.bg,
                          borderColor: status.borderColor,
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {t(status.labelKey)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTopLeft}>
                        <Text style={[styles.vehicleName, { color: colors.text }]}>
                          {booking.vehicleName || t("bookings.unknownVehicle", { defaultValue: "Véhicule" })}
                        </Text>
                        <View style={styles.agencyRow}>
                          <MapPin
                            size={12}
                            color={colors.textSecondary}
                            strokeWidth={1.5}
                          />
                          <Text
                            style={[styles.agencyName, { color: colors.textSecondary }]}
                          >
                            {booking.reference}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight
                        size={20}
                        color={colors.textSecondary}
                        strokeWidth={1.5}
                      />
                    </View>

                    <View
                      style={[
                        styles.dateRow,
                        {
                          backgroundColor: isDark
                            ? "rgba(74, 25, 66, 0.25)"
                            : "rgba(74, 25, 66, 0.08)",
                        },
                      ]}
                    >
                      <Calendar
                        size={16}
                        color={colors.primary}
                        strokeWidth={1.8}
                      />
                      <Text style={[styles.dateText, { color: colors.text }]}>
                        {booking.startDate} — {booking.endDate}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.cardFooter,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <View>
                        <Text
                          style={[styles.totalLabel, { color: colors.textSecondary }]}
                        >
                          {t("bookings.totalLabel")}
                        </Text>
                        <Text style={[styles.totalValue, { color: colors.text }]}>
                          {t("common.priceEuro", {
                            price: centsToUnits(booking.total),
                          })}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.detailsButton,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.detailsButtonText}>
                          {t("bookings.seeDetails")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  pageTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    letterSpacing: -0.4,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },

  tabContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  cardsList: { gap: 12 },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardImageWrapper: {
    width: "100%",
    height: 180,
    position: "relative",
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 180 },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  cardContent: { padding: 20 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTopLeft: { flex: 1 },
  vehicleName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    marginBottom: 4,
  },
  agencyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  agencyName: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  dateText: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, marginBottom: 2 },
  totalValue: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  detailsButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  detailsButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
