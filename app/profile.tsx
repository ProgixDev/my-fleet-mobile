import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import {
  User,
  ChevronRight,
  CreditCard,
  FileText,
  LogOut,
  Gift,
  TrendingUp,
  TrendingDown,
  Check,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from "@/context/ThemeContext";
import { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from "@/i18n";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLoyaltyStatus } from "@/hooks/useLoyalty";

function getInitials(name: string | undefined, email: string | undefined) {
  const source = (name ?? email ?? "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}


interface AccountItem {
  icon: LucideIcon;
  labelKey: string;
  route?: string;
}

interface AccountItemWithTestID extends AccountItem {
  testID: string;
}

const accountItems: AccountItemWithTestID[] = [
  { icon: User, labelKey: "profile.accountInfo", testID: "profile-account-info-row" },
  {
    icon: CreditCard,
    labelKey: "profile.accountCards",
    route: "/payment-methods",
    testID: "profile-account-cards-row",
  },
  {
    icon: FileText,
    labelKey: "profile.accountDocuments",
    route: "/documents",
    testID: "profile-account-documents-row",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: loyalty } = useLoyaltyStatus();

  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name?.trim() || user?.email || "—";

  const currentPoints = loyalty?.points ?? 0;
  const currentTierName = loyalty?.tier?.name ?? "—";
  const nextTierName = loyalty?.nextTier?.name ?? null;
  const pointsToNextTier = loyalty?.pointsToNext ?? 0;
  const tierBenefits: string[] = loyalty?.tier?.benefits ?? [];
  const history = loyalty?.history ?? [];

  const handleLogout = () => {
    Alert.alert(t("profile.logout"), "", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header Card */}
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: colors.surface }}
        >
          <View
            style={[styles.headerCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {displayName}
            </Text>
            {user?.email ? (
              <Text
                style={[styles.memberSince, { color: colors.textSecondary }]}
              >
                {user.email}
              </Text>
            ) : null}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>{t("profile.verified")}</Text>
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          {/* Loyalty */}
          <LinearGradient
            colors={[colors.primary, "#8B3D7E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loyaltyCard}
          >
            <View style={styles.loyaltyHeader}>
              <Gift size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text style={styles.loyaltyTitle}>
                {t("profile.programTitle")}
              </Text>
            </View>
            <Text style={styles.loyaltyPoints}>
              {t("profile.pointsLabel", {
                value: currentPoints.toLocaleString(),
              })}
            </Text>
            {nextTierName ? (
              <Text style={styles.loyaltyNext}>
                {t("profile.nextTier", {
                  name: nextTierName,
                  value: pointsToNextTier.toLocaleString(),
                })}
              </Text>
            ) : null}

            <View style={styles.benefitsBox}>
              <Text style={styles.benefitsTitle}>
                {t("profile.benefitsTitle", { tier: currentTierName })}
              </Text>
              {tierBenefits.length === 0 ? (
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: 13,
                  }}
                >
                  {t("profile.noBenefitsYet", {
                    defaultValue:
                      "Réservez pour accumuler des points et débloquer des avantages.",
                  })}
                </Text>
              ) : (
                tierBenefits.map((benefit, i) => (
                  <View key={i} style={styles.benefitRow}>
                    <View style={styles.benefitDot} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))
              )}
            </View>
          </LinearGradient>

          {/* Loyalty History */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("profile.loyaltyHistory")}
            </Text>
            <View style={styles.historyList}>
              {history.slice(0, 3).map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.historyLeft}>
                    {item.amount >= 0 ? (
                      <TrendingUp size={20} color="#2ECC71" strokeWidth={1.5} />
                    ) : (
                      <TrendingDown
                        size={20}
                        color={colors.error}
                        strokeWidth={1.5}
                      />
                    )}
                    <View>
                      <Text
                        style={[
                          styles.historyDescription,
                          { color: colors.text },
                        ]}
                      >
                        {item.description}
                      </Text>
                      <Text
                        style={[
                          styles.historyDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.date}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.historyAmount,
                      {
                        color: item.amount >= 0 ? "#2ECC71" : colors.error,
                      },
                    ]}
                  >
                    {item.amount >= 0 ? "+" : ""}
                    {item.amount}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Account */}
          <View
            style={[
              styles.menuGroup,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {accountItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === accountItems.length - 1;
              return (
                <TouchableOpacity
                  key={index}
                  testID={item.testID}
                  accessibilityRole="button"
                  onPress={() => item.route && router.push(item.route as never)}
                  style={[
                    styles.menuRow,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <Icon
                      size={20}
                      color={colors.textSecondary}
                      strokeWidth={1.5}
                    />
                    <Text style={[styles.menuLabel, { color: colors.text }]}>
                      {t(item.labelKey)}
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color={colors.textSecondary}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout */}
          <TouchableOpacity
            testID="profile-logout-button"
            accessibilityRole="button"
            style={styles.logoutButton}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} strokeWidth={1.5} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              {t("profile.logout")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language sheet (kept here since profile used to open it) */}
      <Modal
        visible={languageSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageSheetOpen(false)}
      >
        <Pressable
          testID="profile-language-sheet-overlay"
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          style={styles.langOverlay}
          onPress={() => setLanguageSheetOpen(false)}
        >
          <Pressable
            style={[styles.langSheet, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <View style={styles.langDragHandle} />
            <Text style={[styles.langTitle, { color: colors.text }]}>
              {t("profile.languageSheetTitle")}
            </Text>
            {SUPPORTED_LOCALES.map((locale) => {
              const label = t(
                locale === "en" ? "profile.languageEn" : "profile.languageFr",
              );
              return (
                <TouchableOpacity
                  key={locale}
                  testID={`profile-language-option-${locale}`}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  onPress={async () => {
                    setLanguageSheetOpen(false);
                    await setAppLocale(locale as AppLocale);
                  }}
                  style={[styles.langRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.langLabel, { color: colors.text }]}>
                    {label}
                  </Text>
                  <Check size={18} color={colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  headerCard: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  userName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    marginBottom: 4,
  },
  memberSince: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginBottom: 12,
  },
  verifiedBadge: {
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

  /* Body */
  body: { paddingHorizontal: 20, paddingTop: 24, gap: 24 },

  /* Loyalty */
  loyaltyCard: { padding: 22, borderRadius: 28 },
  loyaltyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  loyaltyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  loyaltyPoints: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  loyaltyNext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  benefitsBox: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 22,
    padding: 16,
  },
  benefitsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  benefitText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },

  /* History */
  sectionBlock: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  historyList: { gap: 8 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  historyDescription: { fontFamily: "Poppins_500Medium", fontSize: 14 },
  historyDate: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  historyAmount: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },

  /* Menu */
  menuGroup: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuLabel: { fontFamily: "Poppins_400Regular", fontSize: 15 },

  /* Logout */
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: { fontFamily: "Poppins_500Medium", fontSize: 15 },

  /* Language sheet */
  langOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  langSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  langDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(234, 234, 234, 0.3)",
    alignSelf: "center",
    marginBottom: 16,
  },
  langTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  langLabel: { fontFamily: "Poppins_500Medium", fontSize: 15 },
});
