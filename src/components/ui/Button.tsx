import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps {
  variant?: ButtonVariant;
  children: string;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: "#4A1942" },
    text: { color: "#EAEAEA" },
  },
  secondary: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "rgba(234, 234, 234, 0.15)",
    },
    text: { color: "#EAEAEA" },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: "rgba(234, 234, 234, 0.6)" },
  },
  destructive: {
    container: { backgroundColor: "#E74C3C" },
    text: { color: "#EAEAEA" },
  },
};

export function Button({
  variant = "primary",
  children,
  fullWidth = false,
  disabled = false,
  onPress,
  style,
  testID,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      testID={testID}
      style={[
        styles.base,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, variantStyle.text]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.3,
  },
  text: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
});
