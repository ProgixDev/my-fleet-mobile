import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { CreditCard, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTheme } from "@/context/ThemeContext";
import {
  usePaymentMethods,
  useDeletePaymentMethod,
} from "@/hooks/usePaymentMethods";

const GRADIENTS: [string, string][] = [
  ["#4A1942", "#8B3D7E"],
  ["#2E1C2B", "#4A1942"],
  ["#1B1B36", "#3D2B6E"],
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: cards = [], isLoading, isError, refetch } = usePaymentMethods();
  const deleteCard = useDeletePaymentMethod();

  const handleDelete = (id: string, last4: string) => {
    Alert.alert(
      t("paymentMethods.removeTitle", { defaultValue: "Supprimer la carte" }),
      t("paymentMethods.removeConfirm", {
        defaultValue: `Supprimer la carte se terminant par ${last4} ?`,
      }),
      [
        { text: t("common.cancel", { defaultValue: "Annuler" }), style: "cancel" },
        {
          text: t("common.delete", { defaultValue: "Supprimer" }),
          style: "destructive",
          onPress: () => deleteCard.mutate(id),
        },
      ],
    );
  };

  return (
    <ScreenContainer
      title={t("paymentMethods.title")}
      subtitle={t("paymentMethods.subtitle")}
    >
      <View style={{ gap: 14, marginTop: 6 }}>
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: 30, alignItems: "center", gap: 12 }}>
            <Text style={{ color: colors.textSecondary }}>
              {t("paymentMethods.loadError", {
                defaultValue: "Impossible de charger vos cartes.",
              })}
            </Text>
            <Pressable
              testID="payment-methods-retry-button"
              accessibilityRole="button"
              onPress={() => refetch()}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {t("common.retry", { defaultValue: "Réessayer" })}
              </Text>
            </Pressable>
          </View>
        ) : cards.length === 0 ? (
          <View style={{ paddingVertical: 30, alignItems: "center", gap: 8 }}>
            <CreditCard
              size={32}
              color={colors.textSecondary}
              strokeWidth={1.5}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {t("paymentMethods.empty", {
                defaultValue: "Aucune carte enregistrée.",
              })}
            </Text>
          </View>
        ) : (
          cards.map((card, idx) => (
            <View key={card.id}>
              <LinearGradient
                colors={GRADIENTS[idx % GRADIENTS.length]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <CreditCard size={22} color="#FFFFFF" strokeWidth={1.6} />
                  {card.isDefault && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>
                        {t("paymentMethods.primary").toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardNumber}>
                  •••• •••• •••• {card.last4}
                </Text>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardBrand}>{card.brand}</Text>
                  <Text style={styles.cardExpiry}>
                    {t("paymentMethods.expiry", {
                      month: pad2(card.expMonth),
                      year: String(card.expYear).slice(-2),
                    })}
                  </Text>
                </View>
              </LinearGradient>

              <Pressable
                testID={`payment-methods-remove-button-${card.id}`}
                accessibilityRole="button"
                accessibilityLabel={t("paymentMethods.remove")}
                onPress={() => handleDelete(card.id, card.last4)}
                disabled={deleteCard.isPending}
                style={[
                  styles.removeRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: deleteCard.isPending ? 0.5 : 1,
                  },
                ]}
              >
                <Trash2 size={16} color={colors.error} strokeWidth={1.8} />
                <Text style={[styles.removeText, { color: colors.error }]}>
                  {t("paymentMethods.remove")}
                </Text>
              </Pressable>
            </View>
          ))
        )}
        {/* "Add card" is intentionally hidden for v1.0: payment is collected in
            Stripe Checkout (card entered in-browser per booking). Re-enable with
            a real Stripe Payment Sheet (@stripe/stripe-react-native) later. */}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: 22,
    gap: 22,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  primaryBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9.5,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  cardNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBrand: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  cardExpiry: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
  },
  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 16,
  },
  removeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 6,
  },
  addText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
