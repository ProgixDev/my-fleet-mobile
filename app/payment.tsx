import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Lock, Shield } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { createCheckoutSession } from "@/services/bookingService";
import { useSafeBack } from "@/hooks/useSafeBack";

export default function PaymentScreen() {
  const goBack = useSafeBack("/home");
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const params = useLocalSearchParams<{ amount?: string; bookingId?: string }>();
  const amountStr =
    typeof params.amount === "string" && params.amount.length > 0
      ? params.amount
      : "0";
  const bookingIdParam =
    typeof params.bookingId === "string" && params.bookingId.length > 0
      ? params.bookingId
      : null;
  const agencyId = useAgencyStore((s) => s.paired?.id ?? null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    if (!bookingIdParam) {
      Alert.alert(
        t("payment.errorTitle", { defaultValue: "Erreur" }),
        t("payment.missingBooking", {
          defaultValue: "Réservation introuvable. Reprenez depuis vos réservations.",
        }),
      );
      return;
    }
    if (!agencyId) {
      Alert.alert(
        t("payment.errorTitle", { defaultValue: "Erreur" }),
        t("payment.missingAgency", {
          defaultValue: "Aucune agence associée à votre compte.",
        }),
      );
      return;
    }
    setIsProcessing(true);
    try {
      const session = await createCheckoutSession(agencyId, bookingIdParam);
      if (!session.url) {
        throw new Error("Missing checkout URL");
      }
      // Open Stripe Checkout in the device's external browser. After payment,
      // Stripe redirects to PUBLIC_PAYMENT_RETURN_URL on the server, which then
      // deep-links back to myfleet://payment-return?status=success&session_id=...
      const supported = await Linking.canOpenURL(session.url);
      if (!supported) {
        throw new Error("Cannot open payment URL");
      }
      await Linking.openURL(session.url);
    } catch (e) {
      Alert.alert(
        t("payment.errorTitle", { defaultValue: "Erreur de paiement" }),
        e instanceof Error
          ? e.message
          : t("payment.errorGeneric", {
              defaultValue:
                "Impossible de démarrer le paiement. Réessayez plus tard.",
            }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={colors.statusBarStyle} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              testID="payment-back-button"
              accessibilityRole="button"
              accessibilityLabel={t("common.back", { defaultValue: "Retour" })}
              onPress={goBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={styles.title}>{t("payment.title")}</Text>
          </View>
          <Text style={styles.stepLabel}>
            {t("payment.stepLabel", { current: 2, total: 3 })}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "66%" }]} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("payment.methodTitle")}</Text>

          <View style={styles.checkoutNote}>
            <Lock size={18} color={colors.primary} strokeWidth={1.8} />
            <Text style={styles.checkoutNoteText}>
              {t("payment.checkoutNote", {
                defaultValue:
                  "Le paiement s'effectue de manière sécurisée via Stripe. Vous saisirez votre carte à l'étape suivante.",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.securityRow}>
          <View style={styles.securityItem}>
            <Lock size={16} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.securityText}>{t("payment.securePayment")}</Text>
          </View>
          <View style={styles.securityItem}>
            <Shield size={16} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.securityText}>{t("payment.guaranteed")}</Text>
          </View>
        </View>

        <TouchableOpacity
          testID="payment-confirm-button"
          accessibilityRole="button"
          accessibilityLabel={t("payment.confirmPay", { amount: amountStr })}
          onPress={handlePay}
          disabled={isProcessing}
          style={[styles.primaryCta, isProcessing && { opacity: 0.7 }]}
          activeOpacity={0.9}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryCtaText}>
              {t("payment.confirmPay", { amount: amountStr })}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 22,
      color: colors.text,
      letterSpacing: -0.3,
    },
    stepLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: colors.textSecondary,
    },

    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginHorizontal: 20,
      marginBottom: 20,
      overflow: "hidden",
    },
    progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },

    section: { marginBottom: 24 },
    sectionTitle: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
    },

    checkoutNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    checkoutNoteText: {
      flex: 1,
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
    },

    securityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginBottom: 24,
    },
    securityItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    securityText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: colors.textMuted,
    },

    primaryCta: {
      height: 54,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    primaryCtaText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: "#FFFFFF",
      letterSpacing: 0.3,
    },
  });
}
