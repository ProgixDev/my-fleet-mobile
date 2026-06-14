// Registers the device's Expo push token with the backend so the server's
// MessagesService.send → PushTokensService fanout can deliver OS-level
// notifications. iOS delivery goes through APNs (provisioned by EAS at build
// time); Android goes through FCM (added when the Android build ships).
//
// Best-effort: never blocks the app. No token is issued on simulators/emulators
// (Device.isDevice === false) — push must be verified on a real device.

import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushRegistration(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    void registerPushToken();
  }, [enabled]);
}

async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return; // simulators/emulators don't get push tokens

    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants?.easConfig as { projectId?: string } | undefined)?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    const platform: "ios" | "android" =
      Platform.OS === "ios" ? "ios" : "android";
    const headers = await getAuthHeader();
    await apiRequest<unknown>("/me/push-token", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        platform,
        // deviceName is optional on the backend; omit when unavailable.
        ...(Device.deviceName ? { deviceName: Device.deviceName } : {}),
      }),
    });
  } catch {
    // Silently ignore — push is best-effort and must never block the app.
  }
}
