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
import { ArrowLeft, Star } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BottomNav } from "@/components/BottomNav";
import { useAgencies } from "@/hooks/useAgencies";
import { useTheme } from "@/context/ThemeContext";

// Stable Unsplash fallbacks if agency.logo isn't a URL.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
  "https://images.unsplash.com/photo-1469285994282-454ceb49e63c?w=800",
];

const cityFilters = ["Toutes", "Nice", "Cannes", "Monaco", "Antibes"];

export default function AgencyListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selectedCity, setSelectedCity] = useState("Toutes");

  const cityParam = selectedCity === "Toutes" ? undefined : selectedCity;
  const { data: agencies = [], isLoading, isError, refetch } = useAgencies(
    cityParam ? { city: cityParam } : {},
  );

  const cityFilters = useMemo(() => {
    const cities = new Set<string>(["Toutes"]);
    for (const a of agencies) if (a.city) cities.add(a.city);
    return Array.from(cities);
  }, [agencies]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color="#EAEAEA" strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.title}>{t("agencies.title")}</Text>
          </View>

          {/* City Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {cityFilters.map((city) => {
              const isActive = selectedCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  onPress={() => setSelectedCity(city)}
                  activeOpacity={0.85}
                  style={[
                    styles.filterPill,
                    isActive ? styles.filterPillActive : styles.filterPillInactive,
                  ]}
                >
                  <Text style={styles.filterPillText}>{city === "Toutes" ? t("agencies.cityAll") : city}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Agency Cards */}
          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : isError ? (
            <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
              <Text style={{ color: colors.textSecondary }}>
                {t("agencies.loadError", { defaultValue: "Couldn't load agencies." })}
              </Text>
              <TouchableOpacity onPress={() => refetch()} style={{ padding: 12 }}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {t("common.retry", { defaultValue: "Retry" })}
                </Text>
              </TouchableOpacity>
            </View>
          ) : agencies.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary }}>
                {t("agencies.empty", { defaultValue: "No agencies available yet." })}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {agencies.map((agency, index) => {
                const cover =
                  agency.logo && agency.logo.startsWith("http")
                    ? agency.logo
                    : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
                const initial = (agency.name?.[0] ?? agency.logo ?? "?").toUpperCase();
                return (
                  <TouchableOpacity
                    key={agency.id}
                    activeOpacity={0.9}
                    style={styles.card}
                    onPress={() => router.push(`/agency/${agency.id}` as any)}
                  >
                    <Image source={{ uri: cover }} style={styles.cardImage} />

                    <View style={styles.cardInfo}>
                      <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>{initial}</Text>
                      </View>

                      <View style={styles.cardDetails}>
                        <View style={styles.cardTopRow}>
                          <View style={styles.cardTopLeft}>
                            <Text style={styles.agencyName}>{agency.name}</Text>
                            <Text style={styles.agencySub}>
                              {t("agencies.vehiclesCount", {
                                city: agency.city ?? agency.country ?? "",
                                count: agency.vehicleCount ?? 0,
                              })}
                            </Text>
                          </View>
                          <View style={styles.ratingRow}>
                            <Star
                              size={14}
                              fill="#F1C40F"
                              color="#F1C40F"
                              strokeWidth={1.5}
                            />
                            <Text style={styles.ratingText}>
                              {agency.rating != null
                                ? agency.rating.toFixed(1)
                                : "—"}
                            </Text>
                            <Text style={styles.reviewCount}>
                              {t("agencies.reviewsCount", {
                                count: agency.reviewCount ?? 0,
                              })}
                            </Text>
                          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050404",
  },
  container: {
    flex: 1,
    backgroundColor: "#050404",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#2E1C2B",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#EAEAEA",
  },

  /* Filters */
  filtersScroll: {
    gap: 6,
    marginBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: "#4A1942",
  },
  filterPillInactive: {
    backgroundColor: "#2E1C2B",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
  },
  filterPillText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#EAEAEA",
  },

  /* Cards */
  cardsList: {
    gap: 10,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.06)",
  },
  cardImage: {
    width: "100%",
    height: 92,
  },
  cardInfo: {
    backgroundColor: "#2E1C2B",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    position: "relative",
  },

  /* Logo */
  logoCircle: {
    position: "absolute",
    top: -22,
    left: 14,
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#4A1942",
    borderWidth: 3,
    borderColor: "#2E1C2B",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#EAEAEA",
  },

  /* Details */
  cardDetails: {
    marginTop: 22,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTopLeft: {
    flex: 1,
    marginRight: 8,
  },
  agencyName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#EAEAEA",
    marginBottom: 2,
  },
  agencySub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.55)",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(241, 196, 15, 0.1)",
  },
  ratingText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#EAEAEA",
  },
  reviewCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(234, 234, 234, 0.5)",
  },
});
