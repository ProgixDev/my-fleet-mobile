import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTheme } from "@/context/ThemeContext";

const SECTIONS = ["sec1", "sec2", "sec3", "sec4", "sec5"] as const;

export default function TermsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScreenContainer
      title={t("terms.title")}
      subtitle={t("terms.subtitle")}
    >
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        {t("terms.intro")}
      </Text>

      <View style={{ gap: 14, marginTop: 18 }}>
        {SECTIONS.map((key) => (
          <View
            key={key}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.heading, { color: colors.text }]}>
              {t(`terms.${key}Title`)}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t(`terms.${key}Body`)}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => Linking.openURL("https://myfleetagency.com/cgu")}
        style={{ marginTop: 18 }}
      >
        <Text style={[styles.link, { color: colors.primary }]}>
          {t("terms.fullPolicy", "Consulter les conditions complètes en ligne")}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  heading: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
