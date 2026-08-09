// Fallback for any route expo-router cannot match.
//
// The app registers the `myfleet://` scheme, so anything can be thrown at it —
// a stale link, a mistyped deep link, a path from a future version. Without
// this screen an unmatched route left the app on a blank view with no way out.

import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("common.error") }} />
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.background }}
        testID="not-found-screen"
      >
        <Text
          style={{ color: colors.text, fontSize: 17, textAlign: "center" }}
        >
          {t("common.error")}
        </Text>
        <Link href="/home" replace asChild>
          <Text
            style={{
              color: colors.primary,
              fontSize: 15,
              marginTop: 16,
              textDecorationLine: "underline",
            }}
            testID="not-found-home-link"
          >
            {t("common.back")}
          </Text>
        </Link>
      </View>
    </>
  );
}
