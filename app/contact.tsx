import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Mail, Phone, ChevronRight } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTheme } from "@/context/ThemeContext";

interface Channel {
  icon: LucideIcon;
  testId: string;
  titleKey: string;
  valueKey: string;
  hintKey?: string;
  onPress: () => void;
  accent: string;
}

export default function ContactScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  // NOTE: a "live chat" channel was removed — there is no in-app support chat
  // backend, so its button was a no-op. Email and phone are the real channels.
  const channels: Channel[] = [
    {
      icon: Mail,
      testId: "contact-channel-email",
      titleKey: "contact.emailTitle",
      valueKey: "contact.emailAddress",
      onPress: () => Linking.openURL(`mailto:${t("contact.emailAddress")}`),
      accent: "#3B82F6",
    },
    {
      icon: Phone,
      testId: "contact-channel-phone",
      titleKey: "contact.phoneTitle",
      valueKey: "contact.phoneNumber",
      hintKey: "contact.phoneHint",
      onPress: () =>
        Linking.openURL(`tel:${t("contact.phoneNumber").replace(/\s/g, "")}`),
      accent: "#2ECC71",
    },
  ];

  return (
    <ScreenContainer
      title={t("contact.title")}
      subtitle={t("contact.subtitle")}
    >
      <View style={{ gap: 10, marginTop: 6 }}>
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <Pressable
              key={channel.titleKey}
              testID={channel.testId}
              accessibilityRole="button"
              accessibilityLabel={t(channel.titleKey)}
              onPress={channel.onPress}
              style={[
                styles.row,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: isDark
                      ? `${channel.accent}24`
                      : `${channel.accent}14`,
                  },
                ]}
              >
                <Icon size={20} color={channel.accent} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t(channel.titleKey)}
                </Text>
                {channel.valueKey ? (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>
                    {t(channel.valueKey)}
                  </Text>
                ) : null}
                {channel.hintKey ? (
                  <Text style={[styles.hint, { color: colors.textMuted }]}>
                    {t(channel.hintKey)}
                  </Text>
                ) : null}
              </View>
              <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  value: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginTop: 2,
  },
  hint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    marginTop: 2,
  },
});
