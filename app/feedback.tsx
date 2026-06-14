import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react-native";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTheme } from "@/context/ThemeContext";
import { useSafeBack } from "@/hooks/useSafeBack";

export default function FeedbackScreen() {
  const goBack = useSafeBack("/home");
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const canSubmit = rating > 0;

  const handleSubmit = () => {
    Alert.alert(t("feedback.thanks"));
    goBack();
  };

  return (
    <ScreenContainer
      title={t("feedback.title")}
      subtitle={t("feedback.subtitle")}
    >
      <View style={{ gap: 16, marginTop: 6 }}>
        {/* Rating */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.text }]}>
            {t("feedback.ratingLabel")}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= rating;
              return (
                <Pressable
                  key={n}
                  onPress={() => setRating(n)}
                  hitSlop={8}
                >
                  <Star
                    size={36}
                    strokeWidth={1.8}
                    color={active ? "#F1C40F" : colors.textMuted}
                    fill={active ? "#F1C40F" : "transparent"}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Comment */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.text }]}>
            {t("feedback.commentLabel")}
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t("feedback.commentPlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.textArea,
              {
                color: colors.text,
                backgroundColor: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.04)",
                borderColor: colors.border,
              },
            ]}
          />
        </View>

        {/* Submit */}
        <Pressable
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={({ pressed }) => ({
            height: 54,
            borderRadius: 999,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: !canSubmit ? 0.45 : pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 6,
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 15,
              color: "#FFFFFF",
              letterSpacing: 0.2,
            }}
          >
            {t("feedback.submit")}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    textAlignVertical: "top",
  },
});
