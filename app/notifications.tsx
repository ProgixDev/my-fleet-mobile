import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  Truck,
  Gift,
  Shield,
  Star,
  Receipt,
  Bell,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks/useNotifications";
import type { ServerNotification } from "@/services/notificationService";

const iconMap: Record<string, LucideIcon> = {
  booking: Calendar,
  delivery: Truck,
  loyalty: Gift,
  kyc: Shield,
  review: Star,
  return_summary_ready: Receipt,
};

const colorMap: Record<string, string> = {
  booking: "rgba(46, 204, 113, 0.15)",
  delivery: "rgba(74, 25, 66, 0.2)",
  loyalty: "rgba(241, 196, 15, 0.15)",
  kyc: "rgba(243, 156, 18, 0.15)",
  review: "rgba(234, 234, 234, 0.1)",
  return_summary_ready: "rgba(74, 25, 66, 0.25)",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}j`;
}

function notifRoute(n: ServerNotification): string | null {
  const data = n.data ?? {};
  if (typeof data.bookingId === "string") return `/booking/${data.bookingId}`;
  if (typeof data.route === "string") return data.route;
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#EAEAEA" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.title}>{t("notifications.title")}</Text>
          {notifications.some((n) => !n.read) ? (
            <TouchableOpacity
              onPress={() => markAllRead.mutate()}
              hitSlop={10}
              style={{ marginLeft: "auto" }}
            >
              <Text style={{ color: "#EAEAEA", fontSize: 12 }}>
                {t("notifications.markAllRead", { defaultValue: "Tout lire" })}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Notification List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#EAEAEA" />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
            <Text style={{ color: "rgba(234, 234, 234, 0.6)" }}>
              {t("notifications.loadError", { defaultValue: "Impossible de charger les notifications." })}
            </Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={{ color: "#EAEAEA", fontWeight: "600" }}>
                {t("common.retry", { defaultValue: "Réessayer" })}
              </Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center", gap: 8 }}>
            <Bell size={32} color="rgba(234, 234, 234, 0.3)" strokeWidth={1.5} />
            <Text style={{ color: "rgba(234, 234, 234, 0.5)", fontSize: 14 }}>
              {t("notifications.empty", { defaultValue: "Pas encore de notification." })}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((notif) => {
              const Icon = iconMap[notif.type] ?? Bell;
              const bgColor = colorMap[notif.type] ?? "rgba(234, 234, 234, 0.1)";
              const route = notifRoute(notif);

              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notifRow,
                    { backgroundColor: notif.read ? "#050404" : "#2E1C2B" },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (!notif.read) markRead.mutate(notif.id);
                    if (route) router.push(route as never);
                  }}
                >
                  <View
                    style={[styles.iconCircle, { backgroundColor: bgColor }]}
                  >
                    <Icon size={18} color="#EAEAEA" strokeWidth={1.5} />
                  </View>

                  <View style={styles.notifTextWrapper}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifTime}>
                      {t("notifications.agoPrefix", {
                        time: timeAgo(notif.createdAt),
                      })}
                    </Text>
                  </View>

                  {!notif.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050404",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#EAEAEA",
  },

  /* List */
  list: {
    gap: 8,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifTextWrapper: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#EAEAEA",
    lineHeight: 20,
  },
  notifTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(234, 234, 234, 0.4)",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A1942",
    flexShrink: 0,
  },
});
