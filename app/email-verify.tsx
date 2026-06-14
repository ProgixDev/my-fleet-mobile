import { useEffect, useRef, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/stores/useAuthStore";
import { classifyOtpError } from "@/lib/otpErrors";
import { useSafeBack } from "@/hooks/useSafeBack";

const RESEND_COUNTDOWN = 30;

export default function EmailVerifyScreen() {
  const router = useRouter();
  const goBack = useSafeBack("/auth");
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COUNTDOWN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLoading = useAuthStore((s) => s.isLoading);
  const verifyEmailSignupOtp = useAuthStore((s) => s.verifyEmailSignupOtp);
  const requestEmailSignupOtp = useAuthStore((s) => s.requestEmailSignupOtp);

  // Missing email param means this screen was opened out of flow; bounce back.
  useEffect(() => {
    if (!email) {
      router.replace("/auth");
    }
  }, [email, router]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const token = code.replace(/\D/g, "");
  const isComplete = token.length === 6;

  const handleVerify = async () => {
    setError(null);
    if (!isComplete) {
      setError(t("emailAuth.errors.invalidCode"));
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmailSignupOtp(email, token);
      router.replace("/home");
    } catch (e) {
      setError(classifyOtpError(e, t));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError(null);
    try {
      await requestEmailSignupOtp(email);
      setResendIn(RESEND_COUNTDOWN);
    } catch (e) {
      setError(classifyOtpError(e, t));
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
            onPress={goBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            disabled={busy}
            testID="email-verify-back-button"
            accessibilityRole="button"
            accessibilityLabel={t("common.back", { defaultValue: "Back" })}
          >
            <ArrowLeft size={22} color={colors.text} strokeWidth={1.5} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>
            {t("emailAuth.codeTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("emailAuth.codeSubtitle", { email })}
          </Text>

          <View style={styles.inputRow}>
            <Mail size={20} color={iconColor} strokeWidth={1.5} />
            <TextInput
              placeholder={t("emailAuth.codePlaceholder")}
              placeholderTextColor="rgba(234, 234, 234, 0.4)"
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              editable={!busy}
              testID="email-verify-input"
              accessibilityLabel={t("emailAuth.codePlaceholder")}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.submitContainer}>
            <Button
              fullWidth
              onPress={handleVerify}
              disabled={busy || !isComplete}
              testID="email-verify-submit-button"
            >
              {t("emailAuth.verify")}
            </Button>
          </View>

          <TouchableOpacity
            onPress={handleResend}
            disabled={resendIn > 0 || busy}
            style={styles.resendRow}
            activeOpacity={0.7}
            testID="email-verify-resend-button"
            accessibilityRole="button"
          >
            <Text
              style={[styles.resendText, resendIn > 0 && styles.resendDisabled]}
            >
              {resendIn > 0
                ? t("emailAuth.resendWithCountdown", { seconds: resendIn })
                : t("emailAuth.resend")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/auth")}
            style={styles.changeRow}
            activeOpacity={0.7}
            disabled={busy}
            testID="email-verify-change-email-button"
            accessibilityRole="button"
          >
            <Text style={styles.changeText}>{t("emailAuth.changeEmail")}</Text>
          </TouchableOpacity>
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
    fontSize: 18,
    letterSpacing: 6,
    color: "#EAEAEA",
    height: 48,
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
  resendRow: {
    alignItems: "center",
    paddingTop: 20,
  },
  resendText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#EAEAEA",
  },
  resendDisabled: {
    color: "rgba(234, 234, 234, 0.5)",
  },
  changeRow: {
    alignItems: "center",
    paddingTop: 14,
  },
  changeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.6)",
  },
});
