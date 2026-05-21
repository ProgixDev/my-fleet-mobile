import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Home,
  Truck,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  AlertCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { useVehicle, useAgency } from "@/hooks/useAgencies";
import {
  computeDeliveryFee,
  type DeliveryComputeResult,
  type DeliveryConfig,
} from "@/utils/delivery";
import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HALF_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function formatDateShort(d: Date, shortMonths: string[]): string {
  return `${d.getDate()} ${shortMonths[d.getMonth()]}`;
}
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isBetween(d: Date, start: Date, end: Date): boolean {
  return d.getTime() > start.getTime() && d.getTime() < end.getTime();
}

export default function BookingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [startDate, setStartDate] = useState(new Date(2026, 5, 12));
  const [endDate, setEndDate] = useState(new Date(2026, 5, 15));
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("18:00");
  const [pickupMethod, setPickupMethod] = useState<"agency" | "delivery">("agency");
  const [withChauffeur, setWithChauffeur] = useState(false);

  const [showDateModal, setShowDateModal] = useState(false);
  const [showPickupTimeModal, setShowPickupTimeModal] = useState(false);
  const [showReturnTimeModal, setShowReturnTimeModal] = useState(false);

  const [calMonth, setCalMonth] = useState(startDate.getMonth());
  const [calYear, setCalYear] = useState(startDate.getFullYear());
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [tempStart, setTempStart] = useState<Date>(startDate);
  const [tempEnd, setTempEnd] = useState<Date>(endDate);

  const pairedAgencyId = useAgencyStore((s) => s.paired?.id ?? null);
  const { data: vehicle } = useVehicle(id, pairedAgencyId ?? undefined);
  const { data: agency } = useAgency(pairedAgencyId ?? undefined);
  // Delivery config isn't shipped by the public agency endpoint yet — fall back
  // to disabled (no free-delivery option) until the backend exposes it. The
  // `as` cast keeps the wider union (TS narrows a bare `const = undefined` to
  // `undefined`, which then collapses the truthy branches below to `never`).
  const deliveryConfig = undefined as DeliveryConfig | undefined;
  const deliveryEnabled = false;

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryResult, setDeliveryResult] = useState<DeliveryComputeResult | null>(null);
  const [deliveryComputing, setDeliveryComputing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!deliveryEnabled && pickupMethod === "delivery") setPickupMethod("agency");
  }, [deliveryEnabled, pickupMethod]);

  useEffect(() => {
    if (pickupMethod !== "delivery" || !deliveryConfig) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setDeliveryResult(null);
      setDeliveryComputing(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (deliveryAddress.trim().length === 0) {
      setDeliveryResult(null);
      setDeliveryComputing(false);
      return;
    }
    setDeliveryComputing(true);
    debounceRef.current = setTimeout(async () => {
      const result = await computeDeliveryFee(deliveryAddress, deliveryConfig);
      setDeliveryResult(result);
      setDeliveryComputing(false);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [deliveryAddress, pickupMethod, deliveryConfig]);

  if (!vehicle || !agency) return null;

  const days = daysBetween(startDate, endDate);
  // Public catalog returns only `dailyRate`. A dedicated chauffeur price isn't
  // exposed yet — use 30% of the daily rate as a placeholder until the backend
  // ships a real value.
  const chauffeurDailyPrice = Math.round(vehicle.dailyRate * 0.3);
  const vehicleTotal = vehicle.dailyRate * days;
  const chauffeurFee = withChauffeur ? chauffeurDailyPrice * days : 0;
  const deliveryFee =
    pickupMethod === "delivery" && deliveryResult && deliveryResult.ok
      ? deliveryResult.fee
      : 0;
  const total = vehicleTotal + chauffeurFee + deliveryFee;

  const canConfirm =
    pickupMethod === "agency" ||
    (pickupMethod === "delivery" && deliveryResult !== null && deliveryResult.ok);

  const shortMonths = t("calendar.shortMonths", { returnObjects: true }) as string[];
  const monthNames = t("calendar.months", { returnObjects: true }) as string[];
  const daysOfWeek = t("calendar.daysOfWeek", { returnObjects: true }) as string[];

  const dateLabel = t(
    days === 1 ? "booking.dateLabelSingle" : "booking.dateLabel",
    {
      start: formatDateShort(startDate, shortMonths),
      end: formatDateShort(endDate, shortMonths),
      count: days,
    },
  );

  const openDateModal = useCallback(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setSelectingEnd(false);
    setCalMonth(startDate.getMonth());
    setCalYear(startDate.getFullYear());
    setShowDateModal(true);
  }, [startDate, endDate]);

  const handleDayPress = useCallback((day: number) => {
    const selected = new Date(calYear, calMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) return;
    if (!selectingEnd) {
      setTempStart(selected);
      setTempEnd(selected);
      setSelectingEnd(true);
    } else {
      if (selected <= tempStart) {
        setTempStart(selected);
        setSelectingEnd(true);
      } else {
        setTempEnd(selected);
        setSelectingEnd(false);
      }
    }
  }, [calYear, calMonth, selectingEnd, tempStart]);

  const confirmDates = useCallback(() => {
    if (tempEnd > tempStart) {
      setStartDate(tempStart);
      setEndDate(tempEnd);
    }
    setShowDateModal(false);
  }, [tempStart, tempEnd]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarDays = Array.from({ length: firstDay }, () => 0).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  return (
    <View style={styles.container}>
      <StatusBar style={colors.statusBarStyle} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={styles.title}>{t("booking.title")}</Text>
          </View>
          <Text style={styles.stepLabel}>
            {t("booking.stepLabel", { current: 1, total: 3 })}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "33%" }]} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* ─── Dates ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("booking.datesTitle")}</Text>
          <TouchableOpacity
            style={styles.dateCard}
            activeOpacity={0.85}
            onPress={openDateModal}
          >
            <Calendar size={36} color={colors.primary} strokeWidth={1.8} />
            <Text style={styles.dateText}>{dateLabel}</Text>
            <Text style={styles.modifyLink}>{t("booking.modify")}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Time ─── */}
        <View style={styles.timeRow}>
          <View style={{ width: HALF_WIDTH }}>
            <Text style={styles.timeLabel}>{t("booking.timePickupLabel")}</Text>
            <TouchableOpacity
              style={styles.timeBox}
              activeOpacity={0.85}
              onPress={() => setShowPickupTimeModal(true)}
            >
              <Clock size={18} color={colors.textSecondary} strokeWidth={1.6} />
              <Text style={styles.timeValue}>{pickupTime}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: HALF_WIDTH }}>
            <Text style={styles.timeLabel}>{t("booking.timeReturnLabel")}</Text>
            <TouchableOpacity
              style={styles.timeBox}
              activeOpacity={0.85}
              onPress={() => setShowReturnTimeModal(true)}
            >
              <Clock size={18} color={colors.textSecondary} strokeWidth={1.6} />
              <Text style={styles.timeValue}>{returnTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Pickup ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("booking.pickupTitle")}</Text>
          <View style={styles.pickupRow}>
            <TouchableOpacity
              onPress={() => setPickupMethod("agency")}
              activeOpacity={0.85}
              style={[
                styles.pickupCard,
                {
                  borderWidth: pickupMethod === "agency" ? 2 : 1,
                  borderColor:
                    pickupMethod === "agency" ? colors.primary : colors.border,
                },
              ]}
            >
              <Home
                size={28}
                color={pickupMethod === "agency" ? colors.primary : colors.textSecondary}
                strokeWidth={1.6}
              />
              <Text style={styles.pickupLabel}>{t("booking.pickupAgency")}</Text>
            </TouchableOpacity>
            {deliveryEnabled && deliveryConfig && (
              <TouchableOpacity
                onPress={() => setPickupMethod("delivery")}
                activeOpacity={0.85}
                style={[
                  styles.pickupCard,
                  {
                    borderWidth: pickupMethod === "delivery" ? 2 : 1,
                    borderColor:
                      pickupMethod === "delivery" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Truck
                  size={28}
                  color={pickupMethod === "delivery" ? colors.primary : colors.textSecondary}
                  strokeWidth={1.6}
                />
                <Text style={styles.pickupLabel}>{t("booking.pickupDelivery")}</Text>
                <Text style={styles.pickupExtra}>
                  {t("booking.deliveryRate", {
                    rate: deliveryConfig.ratePerKm.toFixed(2).replace(".", ","),
                    currency: deliveryConfig.currency,
                  })}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {pickupMethod === "delivery" && deliveryConfig && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.deliveryPanel}
            >
              <Text style={styles.deliveryLabel}>
                {t("booking.delivery.addressLabel")}
              </Text>
              <View style={styles.addressInputWrap}>
                <MapPin size={18} color={colors.textSecondary} strokeWidth={1.6} />
                <TextInput
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder={t("booking.delivery.addressPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  style={styles.addressInput}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>
              <Text style={styles.deliveryHint}>
                {t("booking.delivery.hintBase", {
                  label: deliveryConfig.basePointLabel,
                })}
                {deliveryConfig.maxDistanceKm != null && (
                  <Text>
                    {t("booking.delivery.hintRadius", {
                      km: deliveryConfig.maxDistanceKm,
                    })}
                  </Text>
                )}
              </Text>

              {deliveryComputing && (
                <View style={styles.deliveryStatusRow}>
                  <Text style={styles.deliveryStatusText}>
                    {t("booking.delivery.computing")}
                  </Text>
                </View>
              )}

              {!deliveryComputing && deliveryResult && !deliveryResult.ok && (
                <View style={styles.deliveryErrorBox}>
                  <AlertCircle size={14} color="#F87171" strokeWidth={1.8} />
                  <Text style={styles.deliveryErrorText}>
                    {deliveryResult.message}
                  </Text>
                </View>
              )}

              {!deliveryComputing && deliveryResult && deliveryResult.ok && (
                <View style={styles.deliveryFeeBox}>
                  <View style={styles.deliveryFeeRow}>
                    <Text style={styles.deliveryFeeLabel}>
                      {t("booking.delivery.distance")}
                    </Text>
                    <Text style={styles.deliveryFeeValue}>
                      {t("booking.delivery.distanceKm", {
                        km: deliveryResult.distanceKm.toFixed(1),
                      })}
                    </Text>
                  </View>
                  <View style={styles.deliveryFeeRow}>
                    <Text style={styles.deliveryFeeLabel}>
                      {t("booking.delivery.feeLabel")}
                    </Text>
                    <Text style={styles.deliveryFeeAmount}>
                      {t("booking.delivery.feeValue", {
                        fee: deliveryResult.fee.toFixed(2).replace(".", ","),
                        currency: deliveryConfig.currency,
                      })}
                    </Text>
                  </View>
                  {deliveryResult.minFeeApplied && (
                    <Text style={styles.deliveryMinNote}>
                      {t("booking.delivery.minFeeApplied", {
                        min: (deliveryConfig.minFee ?? 0)
                          .toFixed(2)
                          .replace(".", ","),
                        currency: deliveryConfig.currency,
                      })}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* ─── Chauffeur ─── */}
        <View style={styles.chauffeurRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.chauffeurTitle}>
              {t("booking.chauffeur.title")}
            </Text>
            <Text style={styles.chauffeurPrice}>
              {t("booking.chauffeur.price", { price: chauffeurDailyPrice })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setWithChauffeur(!withChauffeur)}
            activeOpacity={0.7}
            style={[
              styles.toggle,
              {
                backgroundColor: withChauffeur
                  ? colors.primary
                  : isDark
                    ? "rgba(234, 234, 234, 0.15)"
                    : "rgba(0, 0, 0, 0.12)",
              },
            ]}
          >
            <View
              style={[styles.toggleThumb, { left: withChauffeur ? 24 : 4 }]}
            />
          </TouchableOpacity>
        </View>

        {/* ─── Summary ─── */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>{t("booking.summaryTitle")}</Text>
          <View style={styles.summaryVehicle}>
            <View style={styles.summaryThumb} />
            <View>
              <Text style={styles.summaryVehicleName}>{vehicle.name}</Text>
              <Text style={styles.summaryAgency}>{agency.name}</Text>
            </View>
          </View>
          <View style={styles.lineItems}>
            <View style={styles.lineItem}>
              <Text style={styles.lineItemLabel}>
                {t(
                  days === 1
                    ? "booking.summary.rental_one"
                    : "booking.summary.rental_other",
                  { count: days },
                )}
              </Text>
              <Text style={styles.lineItemValue}>
                {t("booking.summary.valueEuro", { value: vehicleTotal })}
              </Text>
            </View>
            {deliveryFee > 0 && (
              <View style={styles.lineItem}>
                <Text style={styles.lineItemLabel}>
                  {deliveryResult && deliveryResult.ok
                    ? t("booking.summary.deliveryLineWithKm", {
                        km: deliveryResult.distanceKm.toFixed(1),
                      })
                    : t("booking.summary.deliveryLine")}
                </Text>
                <Text style={styles.lineItemValue}>
                  {t("booking.summary.valueEuro", {
                    value: deliveryFee.toFixed(2).replace(".", ","),
                  })}
                </Text>
              </View>
            )}
            {chauffeurFee > 0 && (
              <View style={styles.lineItem}>
                <Text style={styles.lineItemLabel}>
                  {t(
                    days === 1
                      ? "booking.summary.chauffeurLine_one"
                      : "booking.summary.chauffeurLine_other",
                    { count: days },
                  )}
                </Text>
                <Text style={styles.lineItemValue}>
                  {t("booking.summary.valueEuro", { value: chauffeurFee })}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("booking.summary.total")}</Text>
            <Text style={styles.totalValue}>
              {t("booking.summary.valueEuro", {
                value: total.toFixed(2).replace(".", ","),
              })}
            </Text>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          disabled={!canConfirm}
          onPress={() => {
            if (!canConfirm) return;
            const deliveryParams =
              pickupMethod === "delivery" && deliveryResult && deliveryResult.ok
                ? {
                    deliveryAddress,
                    deliveryDistanceKm: String(deliveryResult.distanceKm),
                    deliveryFee: String(deliveryResult.fee),
                  }
                : {};
            router.push({ pathname: "/payment", params: deliveryParams } as never);
          }}
          style={[
            styles.primaryCta,
            !canConfirm && { opacity: 0.5 },
          ]}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryCtaText}>
            {t("booking.continueToPayment")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ═══ Date Picker Modal ═══ */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDateModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("booking.calendarModalTitle")}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)} activeOpacity={0.7}>
                <X size={24} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.calSummary}>
              <View style={styles.calSummaryItem}>
                <Text style={styles.calSummaryLabel}>{t("booking.calendarStart")}</Text>
                <Text style={styles.calSummaryValue}>
                  {formatDateShort(tempStart, shortMonths)}
                </Text>
              </View>
              <View style={styles.calSummaryDivider} />
              <View style={styles.calSummaryItem}>
                <Text style={styles.calSummaryLabel}>{t("booking.calendarEnd")}</Text>
                <Text style={styles.calSummaryValue}>
                  {tempEnd > tempStart
                    ? formatDateShort(tempEnd, shortMonths)
                    : t("booking.calendarEmpty")}
                </Text>
              </View>
              <View style={styles.calSummaryDivider} />
              <View style={styles.calSummaryItem}>
                <Text style={styles.calSummaryLabel}>{t("booking.calendarDuration")}</Text>
                <Text style={styles.calSummaryValue}>
                  {tempEnd > tempStart
                    ? t("booking.calendarDurationDays", {
                        count: daysBetween(tempStart, tempEnd),
                      })
                    : t("booking.calendarEmpty")}
                </Text>
              </View>
            </View>

            <View style={styles.calMonthNav}>
              <TouchableOpacity onPress={prevMonth} activeOpacity={0.7} style={styles.calNavBtn}>
                <ChevronLeft size={20} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.calMonthLabel}>
                {monthNames[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} activeOpacity={0.7} style={styles.calNavBtn}>
                <ChevronRight size={20} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.calWeekRow}>
              {daysOfWeek.map((d) => (
                <Text key={d} style={styles.calWeekDay}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarDays.map((day, i) => {
                if (day === 0) return <View key={`e-${i}`} style={styles.calCell} />;
                const date = new Date(calYear, calMonth, day);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const isPast = date < today;
                const isStart = isSameDay(date, tempStart);
                const isEnd = tempEnd > tempStart && isSameDay(date, tempEnd);
                const isInRange = tempEnd > tempStart && isBetween(date, tempStart, tempEnd);

                return (
                  <TouchableOpacity
                    key={`d-${day}`}
                    style={[
                      styles.calCell,
                      isInRange && styles.calCellRange,
                      (isStart || isEnd) && styles.calCellSelected,
                    ]}
                    activeOpacity={isPast ? 1 : 0.7}
                    onPress={() => !isPast && handleDayPress(day)}
                  >
                    <Text style={[
                      styles.calDayText,
                      isPast && styles.calDayPast,
                      (isStart || isEnd) && styles.calDaySelected,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calFooter}>
              <TouchableOpacity
                onPress={confirmDates}
                style={styles.primaryCta}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryCtaText}>{t("booking.confirm")}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══ Time Picker Modals ═══ */}
      {[
        { visible: showPickupTimeModal, setVisible: setShowPickupTimeModal, title: t("booking.timePickupLabel"), selected: pickupTime, onSelect: setPickupTime },
        { visible: showReturnTimeModal, setVisible: setShowReturnTimeModal, title: t("booking.timeReturnLabel"), selected: returnTime, onSelect: setReturnTime },
      ].map((modal) => (
        <Modal key={modal.title} visible={modal.visible} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => modal.setVisible(false)}>
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalDragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modal.title}</Text>
                <TouchableOpacity onPress={() => modal.setVisible(false)} activeOpacity={0.7}>
                  <X size={24} color={colors.text} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
              <View style={styles.timeGrid}>
                {HOURS.map((hour) => {
                  const isSelected = modal.selected === hour;
                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                      activeOpacity={0.7}
                      onPress={() => { modal.onSelect(hour); modal.setVisible(false); }}
                    >
                      <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ))}
    </View>
  );
}

const CELL_SIZE = (SCREEN_WIDTH - 80) / 7;

function makeStyles(colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) {
  const accentSoft = isDark ? "rgba(74, 25, 66, 0.25)" : "rgba(74, 25, 66, 0.08)";
  const accentBorder = isDark ? "rgba(74, 25, 66, 0.5)" : "rgba(74, 25, 66, 0.35)";
  const inputBg = isDark ? "#050404" : "#F5F5F7";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
    title: { fontFamily: "Poppins_700Bold", fontSize: 22, color: colors.text, letterSpacing: -0.3 },
    stepLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: colors.textSecondary },

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

    dateCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 22,
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: colors.text,
    },
    modifyLink: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      color: colors.primary,
      letterSpacing: 0.3,
    },

    timeRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    timeLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    timeBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    timeValue: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: colors.text },

    pickupRow: { flexDirection: "row", gap: 12 },
    pickupCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      alignItems: "center",
      gap: 8,
    },
    pickupLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text },
    pickupExtra: { fontFamily: "Poppins_400Regular", fontSize: 12, color: colors.textMuted },

    deliveryPanel: {
      marginTop: 12,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deliveryLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: colors.textSecondary,
    },
    addressInputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: inputBg,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressInput: {
      flex: 1,
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: colors.text,
      paddingVertical: 12,
    },
    deliveryHint: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: colors.textMuted,
    },
    deliveryStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    deliveryStatusText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: colors.textSecondary,
    },
    deliveryErrorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: "rgba(248, 113, 113, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.4)",
    },
    deliveryErrorText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 12,
      color: "#F87171",
      flex: 1,
    },
    deliveryFeeBox: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: accentSoft,
      borderWidth: 1,
      borderColor: accentBorder,
      gap: 4,
    },
    deliveryFeeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    deliveryFeeLabel: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: colors.textSecondary,
    },
    deliveryFeeValue: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: colors.text,
    },
    deliveryFeeAmount: {
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
      color: colors.text,
    },
    deliveryMinNote: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },

    chauffeurRow: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chauffeurTitle: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: colors.text,
      marginBottom: 4,
    },
    chauffeurPrice: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: colors.textSecondary,
    },
    toggle: {
      width: 48,
      height: 28,
      borderRadius: 14,
      position: "relative",
      justifyContent: "center",
    },
    toggleThumb: {
      position: "absolute",
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },

    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryVehicle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingBottom: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryThumb: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    summaryVehicleName: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: colors.text,
    },
    summaryAgency: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: colors.textSecondary,
    },
    lineItems: { gap: 8, marginBottom: 16 },
    lineItem: { flexDirection: "row", justifyContent: "space-between" },
    lineItemLabel: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
    lineItemValue: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: colors.text,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: colors.text,
    },
    totalValue: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: colors.primary,
    },

    /* Primary CTA */
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

    /* Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 32,
    },
    modalDragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark
        ? "rgba(234, 234, 234, 0.3)"
        : "rgba(0, 0, 0, 0.25)",
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 20,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    modalTitle: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 18,
      color: colors.text,
    },

    calSummary: {
      flexDirection: "row",
      marginHorizontal: 20,
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 14,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calSummaryItem: { flex: 1, alignItems: "center" },
    calSummaryLabel: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 4,
    },
    calSummaryValue: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: colors.text,
    },
    calSummaryDivider: { width: 1, backgroundColor: colors.border },

    calMonthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    calNavBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    calMonthLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 16,
      color: colors.text,
    },

    calWeekRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 8 },
    calWeekDay: {
      width: CELL_SIZE,
      textAlign: "center",
      fontFamily: "Poppins_500Medium",
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    calGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20 },
    calCell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    calCellRange: { backgroundColor: accentSoft },
    calCellSelected: {
      backgroundColor: colors.primary,
      borderRadius: CELL_SIZE / 2,
    },
    calDayText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.text },
    calDayPast: { color: colors.textMuted },
    calDaySelected: {
      fontFamily: "Poppins_700Bold",
      color: "#FFFFFF",
    },

    calFooter: { paddingHorizontal: 20, paddingTop: 20 },

    timeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    timeChip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeChipText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: colors.text,
    },
    timeChipTextSelected: { color: "#FFFFFF" },
  });
}
