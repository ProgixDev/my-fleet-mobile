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
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  EmailNotConfirmedError,
  forgotPassword as forgotPasswordRequest,
} from "@/services/authService";
import { ApiClientError } from "@/services/api";
import {
  flattenZodErrors,
  loginFormSchema,
  signupFormSchema,
  type FieldErrors,
  type LoginForm,
  type SignupForm,
} from "@/lib/validation";

type Tab = "login" | "signup";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        fill="#4285F4"
        d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"
      />
      <Path
        fill="#34A853"
        d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"
      />
      <Path
        fill="#FBBC05"
        d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"
      />
      <Path
        fill="#EA4335"
        d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#EAEAEA">
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.14 4.56-3.74 4.25z" />
    </Svg>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors<SignupForm & LoginForm>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const requestEmailSignupOtp = useAuthStore((s) => s.requestEmailSignupOtp);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Routes the user to the email confirmation screen and (best-effort) resends
  // a fresh code. Used both right after signup and when login reports the
  // account's email is not yet confirmed (backend code EMAIL_NOT_CONFIRMED /
  // Supabase "Email not confirmed").
  const goToEmailVerify = async (
    targetEmail: string,
    opts?: { resend?: boolean },
  ) => {
    const normalized = targetEmail.trim().toLowerCase();
    if (opts?.resend) {
      try {
        await requestEmailSignupOtp(normalized);
      } catch {
        // Non-fatal: the verify screen also offers a resend button.
      }
    }
    router.push({ pathname: "/email-verify", params: { email: normalized } });
  };

  const handleForgotPassword = async () => {
    setSubmitError(null);
    setSuccessMessage(null);
    const email = formData.email.trim();
    if (!email) {
      setErrors({ email: "Enter your email above first" });
      return;
    }
    setIsForgotLoading(true);
    try {
      await forgotPasswordRequest(email.toLowerCase());
      setSuccessMessage(
        "If an account exists for this email, a reset link has been sent. Check your inbox (and spam folder).",
      );
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Could not send reset email",
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  const switchTab = (tab: Tab, opts?: { keepSuccess?: boolean }) => {
    setActiveTab(tab);
    setErrors({});
    setSubmitError(null);
    if (!opts?.keepSuccess) setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (activeTab === "signup") {
      const parsed = signupFormSchema.safeParse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      if (!parsed.success) {
        setErrors(flattenZodErrors<SignupForm>(parsed.error));
        return;
      }
      setErrors({});
      try {
        await signup({
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          password: parsed.data.password,
        });
        setFormData({
          name: "",
          email: parsed.data.email,
          phone: "",
          password: "",
        });
        // Supabase has emailed a 6-digit confirmation code as part of signup;
        // send the user straight to the verify screen (no resend needed).
        await goToEmailVerify(parsed.data.email);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Signup failed");
      }
      return;
    }

    const parsed = loginFormSchema.safeParse({
      email: formData.email,
      password: formData.password,
    });
    if (!parsed.success) {
      setErrors(flattenZodErrors<LoginForm>(parsed.error));
      return;
    }
    setErrors({});
    try {
      await login(parsed.data.email, parsed.data.password);
      router.replace("/home");
    } catch (e) {
      // The account exists but its email isn't confirmed yet. The backend
      // login envelope carries the code EMAIL_NOT_CONFIRMED (HTTP 403); the
      // client's current Supabase-direct login surfaces it as
      // EmailNotConfirmedError. In both cases, route to the verify screen and
      // resend a fresh code instead of showing a dead-end error.
      const isEmailNotConfirmed =
        e instanceof EmailNotConfirmedError ||
        (e instanceof ApiClientError && e.code === "EMAIL_NOT_CONFIRMED");
      if (isEmailNotConfirmed) {
        const targetEmail =
          e instanceof EmailNotConfirmedError ? e.email : parsed.data.email;
        await goToEmailVerify(targetEmail, { resend: true });
        return;
      }
      console.error(e);
      setSubmitError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const iconColor = colors.textSecondary;
  const themeOverrides = {
    container: { backgroundColor: colors.background },
    surface: { backgroundColor: colors.surface, borderColor: colors.border },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    textMuted: { color: colors.textMuted },
    primary: { backgroundColor: colors.primary },
  };

  return (
    <SafeAreaView style={[styles.container, themeOverrides.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Tab Toggle */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => switchTab("login")}
              style={[styles.tab, activeTab === "login" && styles.tabActive]}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "login"
                        ? "#EAEAEA"
                        : "rgba(234, 234, 234, 0.5)",
                  },
                ]}
              >
                {t("auth.tabLogin")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("signup")}
              style={[styles.tab, activeTab === "signup" && styles.tabActive]}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "signup"
                        ? "#EAEAEA"
                        : "rgba(234, 234, 234, 0.5)",
                  },
                ]}
              >
                {t("auth.tabSignup")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {activeTab === "signup" && (
              <>
                {/* Name Input */}
                <View style={styles.inputRow}>
                  <User size={20} color={iconColor} strokeWidth={1.5} />
                  <TextInput
                    placeholder={t("auth.namePlaceholder")}
                    placeholderTextColor="rgba(234, 234, 234, 0.4)"
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    style={styles.input}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.fieldError}>{errors.name}</Text>
                ) : null}

                {/* Email Input */}
                <View style={styles.inputRow}>
                  <Mail size={20} color={iconColor} strokeWidth={1.5} />
                  <TextInput
                    placeholder={t("auth.emailPlaceholder")}
                    placeholderTextColor="rgba(234, 234, 234, 0.4)"
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.fieldError}>{errors.email}</Text>
                ) : null}

                {/* Phone Input */}
                <View style={styles.inputRow}>
                  <Phone size={20} color={iconColor} strokeWidth={1.5} />
                  <Text style={styles.phonePrefix}>+33</Text>
                  <TextInput
                    placeholder={t("auth.phonePlaceholder")}
                    placeholderTextColor="rgba(234, 234, 234, 0.4)"
                    value={formData.phone}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phone: text })
                    }
                    style={styles.input}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                </View>
                {errors.phone ? (
                  <Text style={styles.fieldError}>{errors.phone}</Text>
                ) : null}
              </>
            )}

            {activeTab === "login" && (
              <>
                <View style={styles.inputRow}>
                  <Mail size={20} color={iconColor} strokeWidth={1.5} />
                  <TextInput
                    placeholder={t("auth.emailOrPhonePlaceholder")}
                    placeholderTextColor="rgba(234, 234, 234, 0.4)"
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    style={styles.input}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.fieldError}>{errors.email}</Text>
                ) : null}
              </>
            )}

            {/* Password Input */}
            <View style={styles.inputRow}>
              <Lock size={20} color={iconColor} strokeWidth={1.5} />
              <TextInput
                placeholder={t("auth.passwordPlaceholder")}
                placeholderTextColor="rgba(234, 234, 234, 0.4)"
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                style={styles.input}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff size={20} color={iconColor} strokeWidth={1.5} />
                ) : (
                  <Eye size={20} color={iconColor} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : null}
            {submitError ? (
              <Text style={styles.submitError}>{submitError}</Text>
            ) : null}

            {/* Forgot Password */}
            {activeTab === "login" && (
              <TouchableOpacity
                style={styles.forgotRow}
                activeOpacity={0.7}
                onPress={handleForgotPassword}
                disabled={isForgotLoading || isLoading}
              >
                <Text style={styles.forgotText}>
                  {isForgotLoading
                    ? "Sending..."
                    : t("auth.forgotPassword")}
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <View style={styles.submitContainer}>
              <Button fullWidth onPress={handleSubmit} disabled={isLoading}>
                {activeTab === "signup"
                  ? t("auth.submitSignup")
                  : t("auth.submitLogin")}
              </Button>
            </View>

            {/* Social Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("auth.dividerText")}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons — not yet wired to a real provider */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialButton, styles.socialButtonDisabled]}
                activeOpacity={1}
                disabled
              >
                <GoogleIcon />
                <Text style={styles.socialText}>{t("auth.socialGoogle")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.socialButtonDisabled]}
                activeOpacity={1}
                disabled
              >
                <AppleIcon />
                <Text style={styles.socialText}>{t("auth.socialApple")}</Text>
              </TouchableOpacity>
            </View>

            {/* Phone login entry point — Supabase native phone OTP */}
            <TouchableOpacity
              style={styles.phoneButton}
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={() => router.push("/phone-login")}
              testID="auth-continue-with-phone-button"
            >
              <Phone size={20} color="#EAEAEA" strokeWidth={1.5} />
              <Text style={styles.socialText}>
                {t("auth.continueWithPhone")}
              </Text>
            </TouchableOpacity>

            {/* Bottom Link */}
            <View style={styles.bottomLink}>
              <Text style={styles.bottomLinkSecondary}>
                {activeTab === "signup"
                  ? t("auth.hasAccount")
                  : t("auth.noAccount")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  switchTab(activeTab === "signup" ? "login" : "signup")
                }
                activeOpacity={0.7}
              >
                <Text style={styles.bottomLinkPrimary}>
                  {activeTab === "signup"
                    ? t("auth.switchToLogin")
                    : t("auth.switchToSignup")}
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Tabs - pill switch
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#2E1C2B",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    height: 40,
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
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Form
  form: {
    gap: 10,
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
  phonePrefix: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "rgba(234, 234, 234, 0.7)",
  },

  // Forgot password
  forgotRow: {
    alignItems: "flex-end",
    paddingRight: 4,
  },
  forgotText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(234, 234, 234, 0.6)",
  },

  // Submit
  submitContainer: {
    paddingTop: 6,
  },
  fieldError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#FF6B6B",
    paddingHorizontal: 18,
    marginTop: -4,
  },
  submitError: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#FF6B6B",
    textAlign: "center",
    paddingTop: 6,
  },
  successBanner: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.35)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  successText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#86EFAC",
    textAlign: "center",
  },

  // Social divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(234, 234, 234, 0.1)",
  },
  dividerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.5)",
  },

  // Social buttons
  socialRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 14,
  },
  socialButton: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#2E1C2B",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  phoneButton: {
    marginTop: 10,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#2E1C2B",
    borderWidth: 1,
    borderColor: "rgba(234, 234, 234, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#EAEAEA",
  },

  // Bottom link
  bottomLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 14,
  },
  bottomLinkSecondary: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(234, 234, 234, 0.6)",
  },
  bottomLinkPrimary: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#EAEAEA",
  },
});
