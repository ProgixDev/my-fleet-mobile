import { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Send, Paperclip, Phone, Check, CheckCheck } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useBookingDetail } from "@/hooks/useBookings";
import { useMessages, usePostMessage } from "@/hooks/useMessages";
import { useTheme } from "@/context/ThemeContext";

interface Message {
  id: number;
  text: string;
  from: "agency" | "user";
  time: string;
}

export default function MessagerieScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [message, setMessage] = useState("");
  const listRef = useRef<FlatList>(null);

  const { data: booking } = useBookingDetail(id);
  const { data: serverMessages = [] } = useMessages(id);
  const postMessage = usePostMessage(id);

  const messages: Message[] = useMemo(
    () =>
      serverMessages.map((m, idx) => ({
        id: idx + 1,
        text: m.body,
        from: m.senderRole === "client" ? "user" : "agency",
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    [serverMessages],
  );

  const agencyLogo = "P";
  const agencyName = booking?.agencyName || t("messagerie.fallbackAgency");

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    postMessage.mutate(trimmed);
    setMessage("");
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [message, postMessage]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isUser = item.from === "user";
      const prev = messages[index - 1];
      const next = messages[index + 1];
      const isFirstInGroup = !prev || prev.from !== item.from;
      const isLastInGroup = !next || next.from !== item.from;

      return (
        <View
          style={[
            styles.messageRow,
            isUser ? styles.messageRowUser : styles.messageRowAgency,
            { marginTop: isFirstInGroup ? 12 : 3 },
          ]}
        >
          {/* Agency avatar — show only on last-in-group for a cleaner look */}
          {!isUser && (
            <View style={{ width: 32, marginRight: 8 }}>
              {isLastInGroup && (
                <View style={styles.rowAvatar}>
                  <Text style={styles.rowAvatarText}>{agencyLogo}</Text>
                </View>
              )}
            </View>
          )}

          <View
            style={[
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleAgency,
              isUser
                ? isLastInGroup && { borderBottomRightRadius: 6 }
                : isLastInGroup && { borderBottomLeftRadius: 6 },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                { color: isUser ? "#FFFFFF" : colors.text },
              ]}
            >
              {item.text}
            </Text>
            {isLastInGroup && (
              <View style={styles.bubbleFooter}>
                <Text
                  style={[
                    styles.bubbleTime,
                    { color: isUser ? "rgba(255,255,255,0.65)" : colors.textMuted },
                  ]}
                >
                  {item.time}
                </Text>
                {isUser && (
                  <CheckCheck
                    size={13}
                    color="rgba(255,255,255,0.75)"
                    strokeWidth={2}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      );
    },
    [messages, styles, agencyLogo, colors],
  );

  const canSend = message.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Status bar lives over the burgundy header — keep icons light */}
      <StatusBar style="light" />

      {/* ─── Full-bleed header (extends under the notch) ─── */}
      <LinearGradient
        colors={[colors.primary, "#8B3D7E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={1.8} />
        </Pressable>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{agencyLogo}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>
              {agencyName}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatus}>{t("messagerie.online")}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={async () => {
            // Try to dial the agency directly via the OS phone dialer.
            // Fall back to the in-app call screen if no number is available.
            // For now booking doesn't expose the agency phone — keep the
            // mock-UI behaviour but make sure it's intentional.
            const phone = (booking as { agencyPhone?: string } | undefined)
              ?.agencyPhone;
            if (phone) {
              const url = `tel:${phone.replace(/\s+/g, "")}`;
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
                return;
              }
            }
            Alert.alert(
              t("messagerie.callTitle", { defaultValue: "Appeler l'agence" }),
              t("messagerie.callNoPhone", {
                defaultValue:
                  "Aucun numéro de téléphone n'est disponible pour cette agence.",
              }),
            );
          }}
          style={styles.callBtn}
          hitSlop={10}
        >
          <Phone size={18} color="#FFFFFF" strokeWidth={1.8} />
        </Pressable>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />

        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.inputRow}>
            <Pressable style={styles.attachBtn} hitSlop={8}>
              <Paperclip
                size={19}
                color={colors.textSecondary}
                strokeWidth={1.8}
              />
            </Pressable>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t("messagerie.inputPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              multiline
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={[
              styles.sendBtn,
              {
                backgroundColor: colors.primary,
                opacity: canSend ? 1 : 0.4,
              },
            ]}
          >
            <Send
              size={18}
              color="#FFFFFF"
              strokeWidth={2}
              fill={canSend ? "#FFFFFF" : "transparent"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  isDark: boolean,
) {
  const bubbleAgencyBg = isDark
    ? "rgba(46, 28, 43, 0.9)"
    : "#F2F2F7";
  const inputBg = isDark ? colors.surface : "#F2F2F7";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },

    /* Header */
    header: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 999,
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: "rgba(255, 255, 255, 0.22)",
      borderWidth: 1.5,
      borderColor: "rgba(255, 255, 255, 0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerAvatarText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: "#FFFFFF",
    },
    headerName: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: "#FFFFFF",
      letterSpacing: -0.2,
    },
    onlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 1,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#2ECC71",
    },
    headerStatus: {
      fontFamily: "Poppins_500Medium",
      fontSize: 11.5,
      color: "rgba(255, 255, 255, 0.85)",
    },
    callBtn: {
      width: 38,
      height: 38,
      borderRadius: 999,
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      alignItems: "center",
      justifyContent: "center",
    },

    /* Messages */
    messagesList: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 14,
    },
    messageRow: { flexDirection: "row", alignItems: "flex-end" },
    messageRowUser: { justifyContent: "flex-end" },
    messageRowAgency: { justifyContent: "flex-start" },
    rowAvatar: {
      width: 32,
      height: 32,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    rowAvatarText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 13,
      color: "#FFFFFF",
    },

    bubble: {
      maxWidth: "78%",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 22,
    },
    bubbleUser: {
      backgroundColor: colors.primary,
    },
    bubbleAgency: {
      backgroundColor: bubbleAgencyBg,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : "transparent",
    },
    bubbleText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14.5,
      lineHeight: 20,
    },
    bubbleFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      justifyContent: "flex-end",
      marginTop: 4,
    },
    bubbleTime: {
      fontFamily: "Poppins_400Regular",
      fontSize: 10.5,
    },

    /* Input */
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 10,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inputRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: inputBg,
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 10 : 6,
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.border,
    },
    attachBtn: { paddingVertical: 2 },
    input: {
      flex: 1,
      fontFamily: "Poppins_400Regular",
      fontSize: 14.5,
      color: colors.text,
      maxHeight: 100,
      paddingVertical: 0,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 4,
    },
  });
}
