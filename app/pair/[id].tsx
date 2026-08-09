// Deep-link target for `myfleet://pair/<agency>` and for the web bridge at
// https://myfleetagency.com/pair/<agency>.
//
// Pairing normally happens by scanning the agency QR inside the app. This route
// covers the other way in: a renter who scanned the counter QR with their
// phone's ordinary camera and landed on the web page, which then hands over to
// the app. It performs exactly what app/scan.tsx does once it has parsed a
// payload — same mutation, same profile-incomplete handling — so the two paths
// cannot drift apart in behaviour.

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { ApiClientError } from "@/services/api";
import { ProfileIncompleteError, usePairWithAgency } from "@/hooks/usePairing";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTheme } from "@/context/ThemeContext";

export default function PairDeepLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const alreadyPaired = useAgencyStore((s) => s.paired?.id ?? null);

  const pair = usePairWithAgency();
  const attempted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // One attempt per mount: the mutation is not idempotent from the UI's
    // point of view, and a retry loop on a bad id would hammer the API.
    if (attempted.current) return;
    if (!isHydrated || !isAuthenticated || !id) return;
    attempted.current = true;

    void (async () => {
      try {
        await pair.mutateAsync(id);
        router.replace("/home");
      } catch (err) {
        if (err instanceof ProfileIncompleteError) {
          // Same gate as the scan screen: identity fields must be complete
          // before an agency relation can be created.
          router.replace({
            pathname: "/profile-complete",
            params: { missing: err.missingFields.join(",") },
          });
          return;
        }
        setError(
          err instanceof ApiClientError && err.status === 404
            ? t("scan.unknownAgency")
            : t("scan.pairingFailed"),
        );
      }
    })();
  }, [id, isAuthenticated, isHydrated, pair, router, t]);

  // Nothing to pair with — treat as a stray link rather than an error screen.
  if (isHydrated && !id) return <Redirect href="/home" />;

  // Not signed in yet. Onboarding leads to auth; once a session exists the
  // agency can be reached again from the scan screen, and server-side
  // rehydration will restore it on the next launch if pairing succeeded.
  if (isHydrated && !isAuthenticated) return <Redirect href="/onboarding" />;

  // Already paired with this very agency — skip the round-trip.
  if (alreadyPaired && alreadyPaired === id) return <Redirect href="/home" />;

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: colors.background }}
      testID="pair-deeplink-screen"
    >
      {error ? (
        <>
          <Text
            className="text-center text-base"
            style={{ color: colors.text }}
            testID="pair-deeplink-error"
          >
            {error}
          </Text>
          <Text
            className="mt-4 text-center text-sm underline"
            style={{ color: colors.textSecondary }}
            onPress={() => router.replace("/scan")}
            testID="pair-deeplink-scan-instead"
          >
            {t("scan.title")}
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text
            className="mt-4 text-center text-base"
            style={{ color: colors.text }}
            testID="pair-deeplink-status"
          >
            {t("scan.analyzing")}
          </Text>
        </>
      )}
    </View>
  );
}
