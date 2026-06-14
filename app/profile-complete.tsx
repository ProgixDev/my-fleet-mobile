// Profile completion screen. Reached via deep-link from app/scan.tsx
// when POST /client/agencies/:id/pair returns 422 PROFILE_INCOMPLETE.
// Customers complete the missing identity fields here, then re-scan.
//
// The fields collected here mirror PROFILE_REQUIRED_FIELDS server-side
// (src/bookings/bookings.public.controller.ts).

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getProfile,
  updateProfile,
  type UpdateProfilePayload,
} from "@/services/profileService";

const FIELD_LABELS: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  phone: "Phone",
  date_of_birth: "Date of birth (YYYY-MM-DD)",
  address: "Address",
  id_type: "ID type (passport / national-id / driving-license)",
  id_number: "ID number",
  driver_license: "Driver license number",
  driver_license_expiry: "Driver license expiry (YYYY-MM-DD)",
};

const SNAKE_TO_CAMEL: Record<string, keyof UpdateProfilePayload> = {
  first_name: "firstName",
  last_name: "lastName",
  phone: "phone",
  date_of_birth: "dateOfBirth",
  address: "address",
  id_type: "idType",
  id_number: "idNumber",
  driver_license: "driverLicense",
  driver_license_expiry: "driverLicenseExpiry",
};

export default function ProfileCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ missing?: string }>();
  const queryClient = useQueryClient();

  const missingFields = useMemo(
    () =>
      (params.missing ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && FIELD_LABELS[s]),
    [params.missing],
  );

  const profileQuery = useQuery({
    queryKey: ["client-profile"],
    queryFn: getProfile,
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profileQuery.data) return;
    const next: Record<string, string> = {};
    for (const field of missingFields) {
      const camel = SNAKE_TO_CAMEL[field];
      const current =
        profileQuery.data[camel as keyof typeof profileQuery.data];
      next[field] = typeof current === "string" ? current : "";
    }
    setValues(next);
  }, [profileQuery.data, missingFields]);

  const mutation = useMutation({
    mutationFn: async () => {
      const patch: UpdateProfilePayload = {};
      for (const [snake, value] of Object.entries(values)) {
        const camel = SNAKE_TO_CAMEL[snake];
        if (!camel || !value.trim()) continue;
        (patch as Record<string, string>)[camel] = value.trim();
      }
      return updateProfile(patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-profile"] });
      router.back();
    },
  });

  if (profileQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Agencies need this information to verify your identity at pickup.
        </Text>

        {missingFields.map((field) => (
          <View key={field} style={styles.field}>
            <Text style={styles.label}>{FIELD_LABELS[field]}</Text>
            <TextInput
              style={styles.input}
              value={values[field] ?? ""}
              onChangeText={(text) =>
                setValues((prev) => ({ ...prev, [field]: text }))
              }
              autoCapitalize={field === "id_type" ? "none" : "words"}
              testID={`profile-complete-${field.replace(/_/g, "-")}-input`}
              accessibilityLabel={FIELD_LABELS[field]}
            />
          </View>
        ))}

        {mutation.error ? (
          <Text style={styles.error}>
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Failed to save"}
          </Text>
        ) : null}

        <Pressable
          style={[styles.submit, mutation.isPending && styles.submitDisabled]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
          testID="profile-complete-submit-button"
          accessibilityRole="button"
          accessibilityState={{ disabled: mutation.isPending }}
        >
          <Text style={styles.submitText}>
            {mutation.isPending ? "Saving..." : "Save and continue"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E0E12" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0E0E12",
  },
  scroll: { padding: 20 },
  title: { color: "#fff", fontSize: 24, fontWeight: "600", marginBottom: 8 },
  subtitle: { color: "#9CA3AF", fontSize: 14, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { color: "#D1D5DB", fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: "#1A1A22",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 15,
  },
  submit: {
    backgroundColor: "#8B3D7E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#F87171", marginBottom: 12, fontSize: 13 },
});
