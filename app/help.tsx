import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Search,
  ChevronRight,
  Car,
  CreditCard,
  Truck,
  Undo2,
  ShieldCheck,
  UserCog,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTheme } from "@/context/ThemeContext";

interface Topic {
  icon: LucideIcon;
  labelKey: string;
}

const topics: Topic[] = [
  { icon: Car, labelKey: "help.topicBooking" },
  { icon: CreditCard, labelKey: "help.topicPayment" },
  { icon: Truck, labelKey: "help.topicDelivery" },
  { icon: Undo2, labelKey: "help.topicReturn" },
  { icon: UserCog, labelKey: "help.topicAccount" },
  { icon: ShieldCheck, labelKey: "help.topicSafety" },
];

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");

  // Filter topics by the search query (case-insensitive against the translated
  // label) so the search bar actually does something. There is no FAQ-answer
  // content yet, so each topic row routes to the support contact screen — the
  // honest, working behaviour until real articles exist.
  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((topic) => t(topic.labelKey).toLowerCase().includes(q));
  }, [query, t]);

  return (
    <ScreenContainer
      title={t("help.title")}
      subtitle={t("help.subtitle")}
    >
      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("help.searchPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Topics grid */}
      <View style={{ gap: 8, marginTop: 14 }}>
        {filteredTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Pressable
              key={topic.labelKey}
              testID={`help-topic-${topic.labelKey}`}
              onPress={() => router.push("/contact" as never)}
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
                      ? "rgba(74, 25, 66, 0.3)"
                      : "rgba(74, 25, 66, 0.08)",
                  },
                ]}
              >
                <Icon size={18} color={colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t(topic.labelKey)}
              </Text>
              <ChevronRight
                size={18}
                color={colors.textSecondary}
                strokeWidth={1.5}
              />
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
});
