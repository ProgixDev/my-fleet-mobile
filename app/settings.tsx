import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Globe,
  Moon,
  CreditCard,
  FileText,
  HelpCircle,
  MessageSquare,
  Send,
  FileSignature,
  ShieldCheck,
  Info,
  ChevronRight,
  Check,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from "@/context/ThemeContext";
import { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from "@/i18n";

const APP_VERSION = "1.0.0";

interface Row {
  key: string;
  icon: LucideIcon;
  labelKey: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  valueKey?: string;
  value?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  const currentLocale = (i18n.language?.slice(0, 2) ?? "fr") as AppLocale;
  const currentLanguageLabel = t(
    currentLocale === "en" ? "profile.languageEn" : "profile.languageFr",
  );

  const handlePickLocale = async (locale: AppLocale) => {
    setLanguageSheetOpen(false);
    await setAppLocale(locale);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("settings.title")}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
      >
        {/* ─── Preferences ─── */}
        <SectionLabel label={t("settings.sectionPreferences")} />
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Notifications */}
          <SettingRow
            icon={Bell}
            label={t("settings.notifications")}
            colors={colors}
            trailing={
              <Toggle
                value={notifications}
                onChange={setNotifications}
                testID="settings-notifications-toggle"
                accessibilityLabel={t("settings.notifications")}
              />
            }
          />

          {/* Language */}
          <SettingRow
            icon={Globe}
            label={t("settings.language")}
            colors={colors}
            testID="settings-language-row"
            onPress={() => setLanguageSheetOpen(true)}
            trailing={
              <View style={styles.trailingRow}>
                <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                  {currentLanguageLabel}
                </Text>
                <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            }
          />

          {/* Dark mode */}
          <SettingRow
            icon={Moon}
            label={t("settings.darkMode")}
            colors={colors}
            isLast
            trailing={
              <Toggle
                value={isDark}
                onChange={toggleTheme}
                testID="settings-dark-mode-toggle"
                accessibilityLabel={t("settings.darkMode")}
              />
            }
          />
        </View>

        {/* ─── Account ─── */}
        <SectionLabel label={t("settings.sectionAccount")} />
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={CreditCard}
            label={t("settings.paymentMethods")}
            colors={colors}
            testID="settings-payment-methods-row"
            onPress={() => router.push("/payment-methods" as never)}
            trailing={
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            }
          />
          <SettingRow
            icon={FileText}
            label={t("settings.documents")}
            colors={colors}
            testID="settings-documents-row"
            onPress={() => router.push("/documents" as never)}
            isLast
            trailing={
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            }
          />
        </View>

        {/* ─── Support ─── */}
        <SectionLabel label={t("settings.sectionSupport")} />
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={HelpCircle}
            label={t("settings.help")}
            colors={colors}
            testID="settings-help-row"
            onPress={() => router.push("/help" as never)}
            trailing={
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            }
          />
          <SettingRow
            icon={MessageSquare}
            label={t("settings.contact")}
            colors={colors}
            testID="settings-contact-row"
            onPress={() => router.push("/contact" as never)}
            trailing={
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            }
          />
          <SettingRow
            icon={Send}
            label={t("settings.feedback")}
            colors={colors}
            testID="settings-feedback-row"
            onPress={() => router.push("/feedback" as never)}
            isLast
            trailing={
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            }
          />
        </View>

        {/* ─── Legal ─── */}
        <SectionLabel label={t("settings.sectionLegal")} />
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={FileSignature}
            label={t("settings.terms")}
            colors={colors}
            testID="settings-terms-row"
            onPress={() => router.push("/terms" as never)}
            trailing={
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            }
          />
          <SettingRow
            icon={ShieldCheck}
            label={t("settings.privacy")}
            colors={colors}
            testID="settings-privacy-row"
            onPress={() => router.push("/privacy" as never)}
            trailing={
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            }
          />
          <SettingRow
            icon={Info}
            label={t("settings.about")}
            colors={colors}
            testID="settings-about-row"
            onPress={() => router.push("/about" as never)}
            isLast
            trailing={
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                {t("settings.version", { version: APP_VERSION })}
              </Text>
            }
          />
        </View>
      </ScrollView>

      {/* Language picker sheet */}
      <Modal
        visible={languageSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageSheetOpen(false)}
      >
        <Pressable
          testID="settings-language-sheet-overlay"
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          style={styles.sheetOverlay}
          onPress={() => setLanguageSheetOpen(false)}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {t("profile.languageSheetTitle")}
            </Text>
            {SUPPORTED_LOCALES.map((loc) => (
              <Pressable
                key={loc}
                testID={`settings-language-option-${loc}`}
                accessibilityRole="button"
                style={styles.sheetRow}
                onPress={() => handlePickLocale(loc)}
              >
                <Text style={[styles.sheetRowText, { color: colors.text }]}>
                  {t(loc === "en" ? "profile.languageEn" : "profile.languageFr")}
                </Text>
                {currentLocale === loc && (
                  <Check size={18} color={colors.primary} strokeWidth={2} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNav />
    </View>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>;
}

function SettingRow({
  icon: Icon,
  label,
  onPress,
  trailing,
  isLast,
  colors,
  testID,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  isLast?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  testID?: string;
}) {
  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.rowLeft}>
        <Icon size={19} color={colors.textSecondary} strokeWidth={1.6} />
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      {trailing}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.04)" }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

function Toggle({
  value,
  onChange,
  testID,
  accessibilityLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[
        styles.toggle,
        {
          backgroundColor: value
            ? colors.primary
            : isDark
              ? "rgba(234, 234, 234, 0.15)"
              : "rgba(0, 0, 0, 0.12)",
        },
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          { left: value ? 24 : 4, backgroundColor: "#FFFFFF" },
        ]}
      />
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    letterSpacing: -0.4,
  },

  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: "rgba(234, 234, 234, 0.45)",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  trailingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },

  toggle: {
    width: 48,
    height: 26,
    borderRadius: 999,
    justifyContent: "center",
    position: "relative",
  },
  toggleThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#EAEAEA",
  },

  // Language sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(234, 234, 234, 0.3)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetRowText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
  },
});
