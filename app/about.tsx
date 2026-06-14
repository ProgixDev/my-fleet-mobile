import { View, Text, Image, Pressable, Linking, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Globe, Send, Briefcase, ChevronRight } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTheme } from "@/context/ThemeContext";

const APP_VERSION = "1.0.0";
const APP_BUILD = "100";

interface Link {
  icon: LucideIcon;
  testId: string;
  labelKey: string;
  url: string;
}

const links: Link[] = [
  { icon: Globe, testId: "about-link-website", labelKey: "about.website", url: "https://myfleet.app" },
  { icon: Send, testId: "about-link-twitter", labelKey: "about.twitter", url: "https://twitter.com/myfleet" },
  { icon: Briefcase, testId: "about-link-linkedin", labelKey: "about.linkedin", url: "https://linkedin.com/company/myfleet" },
];

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <ScreenContainer title={t("about.title")}>
      {/* Brand header */}
      <View style={styles.brandHeader}>
        <View
          style={[
            styles.logoTile,
            { backgroundColor: isDark ? colors.surface : "#F5F5F7", borderColor: colors.border },
          ]}
        >
          <Image
            source={require("../assets/logo.png")}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.brandName, { color: colors.text }]}>
          {t("about.subtitle")}
        </Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          {t("about.tagline")}
        </Text>
        <View style={styles.versionRow}>
          <View
            style={[
              styles.versionChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              {t("about.version", { version: APP_VERSION })}
            </Text>
          </View>
          <View
            style={[
              styles.versionChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              {t("about.build", { build: APP_BUILD })}
            </Text>
          </View>
        </View>
      </View>

      {/* Social links */}
      <View style={{ gap: 10, marginTop: 26 }}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Pressable
              key={link.labelKey}
              testID={link.testId}
              accessibilityRole="button"
              accessibilityLabel={t(link.labelKey)}
              onPress={() => Linking.openURL(link.url)}
              style={[
                styles.row,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon size={18} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t(link.labelKey)}
              </Text>
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.copyright, { color: colors.textMuted }]}>
        {t("about.copyright")}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    alignItems: "center",
    marginTop: 8,
  },
  logoTile: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  brandName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    letterSpacing: -0.3,
    marginTop: 14,
  },
  tagline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  versionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  versionChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  versionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  copyright: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: 30,
  },
});
