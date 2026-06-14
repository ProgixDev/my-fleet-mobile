import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useTheme } from "@/context/ThemeContext";
import { useKycStatus } from "@/hooks/useKyc";
import { KYC_FIELDS, type KycField } from "@/services/kycService";

// Per-document status is binary in Phase 1 (uploaded vs missing). Verification
// is relation-level (agency_client.verified_at) and not surfaced per document,
// so an uploaded doc shows as "pending" (awaiting agency review).
type Status = "verified" | "pending" | "missing";

const FIELD_LABEL_KEYS: Record<KycField, string> = {
  idFront: "documents.idFront",
  idBack: "documents.idBack",
  licenseFront: "documents.licenseFront",
  licenseBack: "documents.licenseBack",
};

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: kyc, isLoading, isError } = useKycStatus();

  const statusMeta: Record<
    Status,
    { labelKey: string; color: string; bg: string; Icon: LucideIcon }
  > = {
    verified: {
      labelKey: "documents.statusVerified",
      color: "#2ECC71",
      bg: "rgba(46, 204, 113, 0.14)",
      Icon: CheckCircle2,
    },
    pending: {
      labelKey: "documents.statusPending",
      color: "#F39C12",
      bg: "rgba(243, 156, 18, 0.14)",
      Icon: Clock,
    },
    missing: {
      labelKey: "documents.statusMissing",
      color: colors.error,
      bg: isDark ? "rgba(231, 76, 60, 0.14)" : "rgba(220, 38, 38, 0.12)",
      Icon: AlertCircle,
    },
  };

  const rows = KYC_FIELDS.map((field) => {
    const fieldStatus = kyc?.fields[field] ?? "missing";
    const status: Status = fieldStatus === "uploaded" ? "pending" : "missing";
    return { id: field, labelKey: FIELD_LABEL_KEYS[field], status };
  });

  return (
    <ScreenContainer
      title={t("documents.title")}
      subtitle={t("documents.subtitle")}
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t("documents.loadError")}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 6 }}>
          {rows.map((doc) => {
            const meta = statusMeta[doc.status];
            const Icon = meta.Icon;
            return (
              <Pressable
                key={doc.id}
                testID={`documents-row-${doc.id}`}
                onPress={() => router.push("/kyc")}
                style={[
                  styles.row,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.thumb,
                    { backgroundColor: isDark ? "rgba(74, 25, 66, 0.25)" : "rgba(74, 25, 66, 0.08)" },
                  ]}
                >
                  <FileText size={20} color={colors.primary} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t(doc.labelKey)}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
                    <Icon size={11} color={meta.color} strokeWidth={2} />
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      {t(meta.labelKey)}
                    </Text>
                  </View>
                </View>
                {doc.status === "missing" ? (
                  <View
                    style={[
                      styles.cta,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Camera size={12} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.ctaText}>{t("documents.upload")}</Text>
                  </View>
                ) : (
                  <ChevronRight
                    size={18}
                    color={colors.textSecondary}
                    strokeWidth={1.5}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
