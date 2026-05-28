// Push token registration hook.
//
// Currently a no-op stub. To activate end-to-end push notifications:
//
//   1. Install Expo native modules (versions matching SDK 54):
//      bun expo install expo-notifications expo-device
//
//   2. Uncomment the body below and remove this notice.
//
//   3. Mount <PushRegistration /> (or call usePushRegistration()) once
//      somewhere in your authenticated layout (e.g. in app/_layout.tsx
//      inside a child that runs only when the user is logged in).
//
// The backend already exposes POST /me/push-token and includes a fanout
// from MessagesService.send → PushTokensService.sendToUser, so as soon
// as a device registers a token, messages to that user will trigger an
// OS-level notification.

import { useEffect } from "react";
import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export function usePushRegistration(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    // void registerPushToken();
  }, [enabled]);
}

// Uncomment after installing expo-notifications + expo-device.
//
// async function registerPushToken() {
//   try {
//     const Notifications = await import("expo-notifications");
//     const Device = await import("expo-device");
//     const Constants = (await import("expo-constants")).default;
//
//     if (!Device.isDevice) return; // emulators don't get push tokens
//
//     const settings = await Notifications.getPermissionsAsync();
//     let granted = settings.granted;
//     if (!granted) {
//       const req = await Notifications.requestPermissionsAsync();
//       granted = req.granted;
//     }
//     if (!granted) return;
//
//     const projectId =
//       Constants?.expoConfig?.extra?.eas?.projectId ??
//       (Constants?.easConfig as { projectId?: string } | undefined)?.projectId;
//     const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
//     const token = tokenData.data;
//
//     const platform =
//       (Constants?.platform as { ios?: unknown; android?: unknown })?.ios
//         ? "ios"
//         : "android";
//     const headers = await getAuthHeader();
//     await apiRequest<unknown>("/me/push-token", {
//       method: "POST",
//       headers: { ...headers, "Content-Type": "application/json" },
//       body: JSON.stringify({
//         token,
//         platform,
//         deviceName: Device.deviceName ?? null,
//       }),
//     });
//   } catch {
//     // Silently ignore — push is best-effort, never block the app.
//   }
// }
