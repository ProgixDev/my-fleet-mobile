import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

/**
 * Reset-password screen. Deep-linked from the Supabase recovery email.
 *
 * Flow:
 *   1. User clicks "Forgot password" → app calls supabase.auth.resetPasswordForEmail.
 *   2. Supabase emails a recovery link that, after verification, redirects to
 *      the app's Site URL with a session cookie / access_token in the URL.
 *   3. When the app boots from that link, Supabase's JS client picks up the
 *      tokens and a recovery session becomes active.
 *   4. This screen lets the user pick a new password and calls
 *      supabase.auth.updateUser({ password }) which only works while a
 *      recovery session is live.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (password.length < 8) {
      setErrorMsg(
        t("resetPassword.errors.tooShort", {
          defaultValue: "Mot de passe trop court (minimum 8 caractères).",
        }),
      );
      return;
    }
    if (password !== confirm) {
      setErrorMsg(
        t("resetPassword.errors.mismatch", {
          defaultValue: "Les mots de passe ne correspondent pas.",
        }),
      );
      return;
    }
    setSubmitting(true);
    try {
      // Supabase auto-detects the recovery session from the URL hash on web
      // (detectSessionInUrl: true). On native, the same call works once the
      // recovery deep-link has installed the session via Linking.
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setSuccessMsg(
        t("resetPassword.success", {
          defaultValue: "Mot de passe mis à jour. Vous pouvez vous connecter.",
        }),
      );
      setTimeout(() => router.replace("/auth"), 1500);
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t("resetPassword.errors.generic", {
              defaultValue: "Impossible de mettre à jour le mot de passe.",
            }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {t("resetPassword.title", { defaultValue: "Nouveau mot de passe" })}
          </Text>
          <Text style={styles.subtitle}>
            {t("resetPassword.subtitle", {
              defaultValue:
                "Choisissez un nouveau mot de passe pour votre compte.",
            })}
          </Text>

          <View style={styles.inputRow}>
            <Lock size={18} color={colors.textSecondary} strokeWidth={1.5} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("resetPassword.passwordPlaceholder", {
                defaultValue: "Nouveau mot de passe",
              })}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPwd}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} hitSlop={10}>
              {showPwd ? (
                <EyeOff size={18} color={colors.textSecondary} strokeWidth={1.5} />
              ) : (
                <Eye size={18} color={colors.textSecondary} strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Lock size={18} color={colors.textSecondary} strokeWidth={1.5} />
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder={t("resetPassword.confirmPlaceholder", {
                defaultValue: "Confirmer le mot de passe",
              })}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPwd}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {t("resetPassword.submit", {
                  defaultValue: "Mettre à jour",
                })}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/auth")}
            style={{ alignItems: "center", marginTop: 16 }}
          >
            <Text style={{ color: colors.primary, fontWeight: "500" }}>
              {t("resetPassword.backToLogin", {
                defaultValue: "Retour à la connexion",
              })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  _isDark: boolean,
) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      padding: 24,
      paddingTop: 40,
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 32,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginBottom: 12,
    },
    input: {
      flex: 1,
      color: colors.text,
      paddingVertical: 12,
      fontSize: 15,
    },
    error: {
      color: colors.error,
      fontSize: 13,
      marginTop: 4,
      marginBottom: 8,
    },
    success: {
      color: "#22c55e",
      fontSize: 13,
      marginTop: 4,
      marginBottom: 8,
    },
    submitBtn: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    submitText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
    },
  });
}
