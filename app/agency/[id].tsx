import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Star,
  CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import {
  useAgency,
  useAgencyVehicles,
} from "@/hooks/useAgencies";
import { useSafeBack } from "@/hooks/useSafeBack";
import {
  useAgencyReviews,
  useAgencyRating,
} from "@/hooks/useReviews";
import { centsToUnits } from "@/utils/money";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Tab = "vehicles" | "reviews";

export default function AgencyDetailScreen() {
  const router = useRouter();
  const goBack = useSafeBack("/home");
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("vehicles");

  const { data: agency, isLoading: agencyLoading } = useAgency(id);
  const { data: agencyVehicles = [] } = useAgencyVehicles(id);
  const { data: agencyReviews = [] } = useAgencyReviews(id);
  const { data: ratingData } = useAgencyRating(id);

  if (agencyLoading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color="#EAEAEA" />
      </View>
    );
  }
  if (!agency) return null;

  const heroLogoText = (agency.logo?.[0] ?? agency.name?.[0] ?? "?").toUpperCase();
  const ratingDisplay =
    ratingData?.average != null ? ratingData.average.toFixed(1) : "—";
  const reviewsCount = ratingData?.count ?? agencyReviews.length;
  const heroImage =
    agency.logo && agency.logo.startsWith("http") ? agency.logo : FALLBACK_HERO;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── Hero ─── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(5, 4, 4, 0.9)"]}
            locations={[0.3, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Back */}
          <SafeAreaView style={styles.heroNav} edges={["top"]}>
            <TouchableOpacity
              testID="agency-back-button"
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              style={styles.heroButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#EAEAEA" strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="agency-share-button"
              accessibilityRole="button"
              accessibilityLabel="Share"
              style={styles.heroButton}
              activeOpacity={0.7}
              onPress={() => {
                Share.share({
                  message: "Discover this agency on MyFleet.",
                }).catch(() => {});
              }}
            >
              <Share2 size={20} color="#EAEAEA" strokeWidth={1.5} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Overlapping Logo */}
          <View style={styles.heroLogo}>
            <Text style={styles.heroLogoText}>{heroLogoText}</Text>
          </View>
        </View>

        {/* ─── Info ─── */}
        <View style={styles.infoSection}>
          <Text style={styles.agencyName}>{agency.name}</Text>

          <View style={styles.addressRow}>
            <MapPin
              size={16}
              color="rgba(234, 234, 234, 0.6)"
              strokeWidth={1.5}
            />
            <Text style={styles.addressText}>{agency.address}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <Star size={16} fill="#F1C40F" color="#F1C40F" strokeWidth={1.5} />
              <Text style={styles.ratingValue}>{ratingDisplay}</Text>
              <Text style={styles.ratingCount}>
                {t("agency.reviewsCount", { count: reviewsCount })}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <CheckCircle size={12} color="#2ECC71" strokeWidth={1.5} />
              <Text style={styles.verifiedText}>{t("agency.verified")}</Text>
            </View>
          </View>

          {agency.address ? (
            <Text style={styles.description}>{agency.address}</Text>
          ) : null}

          {/* ─── Tabs ─── */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              testID="agency-tab-vehicles"
              accessibilityRole="button"
              onPress={() => setActiveTab("vehicles")}
              style={[styles.tab, activeTab === "vehicles" && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "vehicles"
                        ? "#EAEAEA"
                        : "rgba(234, 234, 234, 0.5)",
                  },
                ]}
              >
                {t("agency.tabVehicles")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="agency-tab-reviews"
              accessibilityRole="button"
              onPress={() => setActiveTab("reviews")}
              style={[styles.tab, activeTab === "reviews" && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "reviews"
                        ? "#EAEAEA"
                        : "rgba(234, 234, 234, 0.5)",
                  },
                ]}
              >
                {t("agency.tabReviews")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── Vehicles Tab ─── */}
          {activeTab === "vehicles" && (
            <View>
              <Text style={styles.vehicleCount}>
                {agencyVehicles.length === 1
                  ? t("agency.vehicleAvailable", { count: 1 })
                  : t("agency.vehiclesAvailable", { count: agencyVehicles.length })}
              </Text>
              <View style={styles.vehiclesGrid}>
                {agencyVehicles.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    testID={`agency-vehicle-card-${vehicle.id}`}
                    accessibilityRole="button"
                    activeOpacity={0.9}
                    style={styles.vehicleMiniCard}
                    onPress={() =>
                      router.push(`/vehicle/${vehicle.id}` as any)
                    }
                  >
                    <Image
                      source={{
                        uri:
                          vehicle.thumbnailUrl ?? FALLBACK_HERO,
                      }}
                      style={styles.vehicleMiniImage}
                    />
                    <View style={styles.vehicleMiniInfo}>
                      <Text style={styles.vehicleMiniName} numberOfLines={1}>
                        {vehicle.name}
                      </Text>
                      <View style={styles.vehicleMiniPriceRow}>
                        <Text style={styles.vehicleMiniPrice}>
                          {t("common.priceEuro", {
                            price: centsToUnits(vehicle.dailyRate),
                          })}
                        </Text>
                        <Text style={styles.vehicleMiniUnit}>
                          {" "}
                          {t("common.perDay")}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ─── Reviews Tab ─── */}
          {activeTab === "reviews" && (
            <View>
              {/* Rating Summary */}
              <View style={styles.ratingSummary}>
                <View style={styles.ratingSummaryTop}>
                  <Text style={styles.ratingSummaryBig}>{ratingDisplay}</Text>
                  <Text style={styles.ratingSummaryMax}>/5</Text>
                </View>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill="#F1C40F"
                      color="#F1C40F"
                      strokeWidth={1.5}
                    />
                  ))}
                </View>
                <Text style={styles.ratingSummaryCount}>
                  {t("agency.reviewsBasedOn", { count: reviewsCount })}
                </Text>
              </View>

              {/* Review Cards */}
              <View style={styles.reviewsList}>
                {agencyReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUser}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {(review.userName ?? "?")[0]}
                          </Text>
                        </View>
                        <Text style={styles.reviewUserName}>
                          {review.userName ?? "Client"}
                        </Text>
                      </View>
                      <View style={styles.reviewStars}>
                        {[...Array(Math.max(0, Math.floor(review.rating)))].map(
                          (_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill="#F1C40F"
                              color="#F1C40F"
                              strokeWidth={1.5}
                            />
                          ),
                        )}
                      </View>
                    </View>

                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const GRID_GAP = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 40 - GRID_GAP) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050404",
  },

  /* ─── Hero ─── */
  hero: {
    height: 240,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 240,
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(46, 28, 43, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogo: {
    position: "absolute",
    bottom: -24,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#4A1942",
    borderWidth: 3,
    borderColor: "#050404",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogoText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#EAEAEA",
  },

  /* ─── Info ─── */
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 20,
  },
  agencyName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#EAEAEA",
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  addressText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.6)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(241, 196, 15, 0.1)",
  },
  ratingValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#EAEAEA",
  },
  ratingCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(234, 234, 234, 0.5)",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(46, 204, 113, 0.15)",
  },
  verifiedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#2ECC71",
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.7)",
    lineHeight: 19,
    marginBottom: 16,
  },

  /* ─── Tabs pill ─── */
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#2E1C2B",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabActive: {
    backgroundColor: "#4A1942",
  },
  tabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  tabIndicator: {
    display: "none",
    height: 0,
    width: 0,
  },

  /* ─── Vehicles Tab ─── */
  vehicleCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.55)",
    marginBottom: 12,
  },
  vehiclesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  vehicleMiniCard: {
    width: GRID_ITEM_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.06)",
  },
  vehicleMiniImage: {
    width: GRID_ITEM_WIDTH,
    height: 96,
  },
  vehicleMiniInfo: {
    backgroundColor: "#2E1C2B",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  vehicleMiniName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#EAEAEA",
    marginBottom: 4,
  },
  vehicleMiniPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  vehicleMiniPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#EAEAEA",
  },
  vehicleMiniUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(234, 234, 234, 0.5)",
  },

  /* ─── Reviews Tab ─── */
  ratingSummary: {
    backgroundColor: "#2E1C2B",
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.06)",
  },
  ratingSummaryTop: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 8,
  },
  ratingSummaryBig: {
    fontFamily: "Poppins_700Bold",
    fontSize: 40,
    color: "#EAEAEA",
  },
  ratingSummaryMax: {
    fontFamily: "Poppins_400Regular",
    fontSize: 20,
    color: "rgba(234, 234, 234, 0.5)",
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  ratingSummaryCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.6)",
  },

  /* Review Cards */
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: "#2E1C2B",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.06)",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#4A1942",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#EAEAEA",
  },
  reviewUserName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#EAEAEA",
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(234, 234, 234, 0.7)",
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(234, 234, 234, 0.4)",
  },
  responseBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(74, 25, 66, 0.25)",
  },
  responseLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.8)",
    marginBottom: 4,
  },
  responseText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.7)",
    lineHeight: 19,
  },
});
