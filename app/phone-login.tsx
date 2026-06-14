import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Phone } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/stores/useAuthStore";

// Basic E.164 sanity check: a leading "+" followed by 8-15 digits. Kept simple
// on purpose — the field defaults to "+" and the user types the full number
// including the country code. Supabase / the SMS provider does the real
// validation.
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [phone, setPhone] = useState("+");
  const [error, setError] = useState<string | null>(null);

  const isLoading = useAuthStore((s) => s.isLoading);
  const requestPhoneOtp = useAuthStore((s) => s.requestPhoneOtp);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async () => {
    setError(null);
    const normalized = phone.replace(/[\s().-]/g, "").trim();
    if (!E164_REGEX.test(normalized)) {
      setError(t("phoneAuth.errors.invalidPhone"));
      return;
    }
    setSubmitting(true);
    try {
      await requestPhoneOtp(normalized);
      router.push({
        pathname: "/phone-verify",
        params: { phone: normalized },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("phoneAuth.errors.sendFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || isLoading;
  const iconColor = colors.textSecondary;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            disabled={busy}
            testID="phone-login-back-button"
            accessibilityRole="button"
            accessibilityLabel={t("common.back", { defaultValue: "Back" })}
          >
            <ArrowLeft size={22} color={colors.text} strokeWidth={1.5} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>
            {t("phoneAuth.phoneTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("phoneAuth.phoneSubtitle")}
          </Text>

          <View style={styles.inputRow}>
            <Phone size={20} color={iconColor} strokeWidth={1.5} />
            <TextInput
              placeholder={t("phoneAuth.phonePlaceholder")}
              placeholderTextColor="rgba(234, 234, 234, 0.4)"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              testID="phone-login-input"
              accessibilityLabel={t("phoneAuth.phonePlaceholder")}
            />
          </View>
          <Text style={styles.hint}>{t("phoneAuth.phoneHint")}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.submitContainer}>
            <Button
              fullWidth
              onPress={handleSendCode}
              disabled={busy}
              testID="phone-login-send-button"
            >
              {t("phoneAuth.sendCode")}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050404",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#EAEAEA",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(234, 234, 234, 0.6)",
    lineHeight: 20,
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#2E1C2B",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#EAEAEA",
    height: 48,
  },
  hint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.5)",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  error: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#FF6B6B",
    textAlign: "center",
    paddingTop: 12,
  },
  submitContainer: {
    paddingTop: 24,
  },
});
