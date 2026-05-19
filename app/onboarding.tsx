import { useCallback, useRef, useState } from "react";
import { Dimensions, Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ArrowRight, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Client accent (matches tailwind.config.js `accent.DEFAULT`)
const ACCENT = "#4A1942";
const ACCENT_SOFT = "#8B3D7E";

const SLIDES = [
  {
    key: "screen1" as const,
    image: require("../assets/audi-q5/audi-q5-1.jpg"),
  },
  {
    key: "screen2" as const,
    image: require("../assets/bmw-x3/bmw-x3-2.jpg"),
  },
  {
    key: "screen3" as const,
    image: require("../assets/classe-a/classe-a-1.jpg"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const textOpacity = useSharedValue(1);

  const updateIndex = useCallback(
    (idx: number) => {
      if (idx !== activeIndex) {
        textOpacity.value = withTiming(0, { duration: 150 }, () => {
          runOnJS(setActiveIndex)(idx);
          textOpacity.value = withTiming(1, { duration: 280 });
        });
      }
    },
    [activeIndex, textOpacity],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const idx = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(updateIndex)(idx);
    },
  });

  const handleNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      scrollRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      textOpacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setActiveIndex)(nextIndex);
        textOpacity.value = withTiming(1, { duration: 280 });
      });
    } else {
      router.replace("/auth");
    }
  }, [activeIndex, router, textOpacity]);

  const handleSkip = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/auth");
  }, [router]);

  const isLastSlide = activeIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[activeIndex]!;

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />

      {/* ── Full-bleed image carousel ─────────────────────────── */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={false}
        className="flex-1"
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.key}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          >
            <Image
              source={slide.image}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
              contentFit="cover"
              transition={400}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {/* ── Bottom gradient for legibility ──────────────────── */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(5, 4, 4, 0.35)",
          "rgba(5, 4, 4, 0.85)",
          "rgba(5, 4, 4, 1)",
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.62,
        }}
        pointerEvents="none"
      />

      {/* ── Top bar: centered logo pill ─────────────────────── */}
      <View
        className="absolute left-0 right-0 items-center z-10"
        style={{ top: 60 }}
        pointerEvents="box-none"
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <BlurView
            intensity={30}
            tint="dark"
            className="items-center justify-center rounded-full overflow-hidden border"
            style={{
              width: 48,
              height: 48,
              borderColor: "rgba(255, 255, 255, 0.15)",
            }}
          >
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 30, height: 30 }}
              contentFit="contain"
            />
          </BlurView>
        </Animated.View>
      </View>

      {/* ── Skip pill ──────────────────────────────────────── */}
      {!isLastSlide && (
        <Animated.View
          entering={FadeIn.duration(500)}
          className="absolute z-10"
          style={{ top: 66, right: 20 }}
        >
          <Pressable onPress={handleSkip} hitSlop={10}>
            <BlurView
              intensity={30}
              tint="dark"
              className="flex-row items-center rounded-full overflow-hidden border"
              style={{
                gap: 4,
                paddingLeft: 14,
                paddingRight: 10,
                paddingVertical: 8,
                borderColor: "rgba(255, 255, 255, 0.15)",
              }}
            >
              <Text className="font-poppins-medium text-[13px] text-white/90">
                {t("onboarding.skip")}
              </Text>
              <ChevronRight
                size={14}
                color="rgba(255, 255, 255, 0.9)"
                strokeWidth={2}
              />
            </BlurView>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Bottom glass card ──────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(600).delay(150)}
        className="absolute"
        style={{ bottom: 40, left: 16, right: 16 }}
      >
        <View
          className="overflow-hidden border"
          style={{
            borderRadius: 32,
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <BlurView
            intensity={50}
            tint="dark"
            style={{
              padding: 22,
              backgroundColor: "rgba(5, 4, 4, 0.55)",
            }}
          >
            {/* Step chip + pagination dots */}
            <View className="flex-row items-center justify-between mb-4">
              <View
                className="rounded-full border"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  backgroundColor: "rgba(74, 25, 66, 0.25)",
                  borderColor: "rgba(74, 25, 66, 0.55)",
                }}
              >
                <Text
                  className="font-poppins-semibold text-[11px]"
                  style={{ color: ACCENT_SOFT, letterSpacing: 1 }}
                >
                  {t("onboarding.stepIndicator", {
                    current: String(activeIndex + 1).padStart(2, "0"),
                    total: String(SLIDES.length).padStart(2, "0"),
                  })}
                </Text>
              </View>

              <View className="flex-row" style={{ gap: 6 }}>
                {SLIDES.map((_, i) => (
                  <PaginationDot key={i} index={i} scrollX={scrollX} />
                ))}
              </View>
            </View>

            {/* Title + subtitle + chips with fade transition */}
            <Animated.View style={textAnimatedStyle}>
              <Text
                className="font-poppins-bold text-white"
                style={{
                  fontSize: 28,
                  lineHeight: 34,
                  marginBottom: 10,
                  letterSpacing: -0.5,
                }}
              >
                {t(`onboarding.${currentSlide.key}.title`)}
              </Text>

              <Text
                className="font-poppins text-[14px]"
                style={{
                  lineHeight: 21,
                  color: "rgba(255, 255, 255, 0.7)",
                  marginBottom: 16,
                }}
              >
                {t(`onboarding.${currentSlide.key}.subtitle`)}
              </Text>

              <View
                className="flex-row flex-wrap"
                style={{ gap: 6, marginBottom: 22 }}
              >
                {["chip1", "chip2", "chip3"].map((chipKey) => (
                  <View
                    key={chipKey}
                    className="rounded-full border"
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderColor: "rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    <Text
                      className="font-poppins-medium text-[11px]"
                      style={{
                        color: "rgba(255, 255, 255, 0.85)",
                        letterSpacing: 0.2,
                      }}
                    >
                      {t(`onboarding.${currentSlide.key}.${chipKey}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* CTA pill: accent circle + centered label + triple chevron */}
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                className="flex-row items-center rounded-full border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  padding: 6,
                  paddingRight: 18,
                  borderColor: "rgba(74, 25, 66, 0.45)",
                }}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: ACCENT,
                    shadowColor: ACCENT,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>

                <Text
                  className="flex-1 text-center font-poppins-semibold text-white"
                  style={{
                    fontSize: 15,
                    letterSpacing: 0.3,
                    marginLeft: -42,
                  }}
                >
                  {isLastSlide
                    ? t("onboarding.getStarted")
                    : t("onboarding.next")}
                </Text>

                <View className="flex-row" style={{ gap: 2 }}>
                  <ChevronRight
                    size={14}
                    color="rgba(139, 61, 126, 0.5)"
                    strokeWidth={2.4}
                  />
                  <ChevronRight
                    size={14}
                    color="rgba(139, 61, 126, 0.75)"
                    strokeWidth={2.4}
                    style={{ marginLeft: -8 }}
                  />
                  <ChevronRight
                    size={14}
                    color={ACCENT_SOFT}
                    strokeWidth={2.4}
                    style={{ marginLeft: -8 }}
                  />
                </View>
              </View>
            </Pressable>
          </BlurView>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Pagination Dot ──────────────────────────────────────────────────────────

function PaginationDot({
  index,
  scrollX,
}: {
  index: number;
  scrollX: { value: number };
}) {
  const style = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const width = interpolate(scrollX.value, inputRange, [6, 22, 6], "clamp");
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      "clamp",
    );

    return { width, opacity };
  });

  return (
    <Animated.View
      style={[
        {
          height: 6,
          borderRadius: 3,
          backgroundColor: ACCENT_SOFT,
        },
        style,
      ]}
    />
  );
}
