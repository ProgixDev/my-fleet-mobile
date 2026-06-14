import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  myBookings,
  bookingDetail,
  bookingSummary,
  createBooking,
  adaptServerBooking,
  type CreateClientBookingPayload,
} from "@/services/bookingService";
import { useAgencyStore } from "@/stores/useAgencyStore";

export function useMyBookings() {
  const agencyId = useAgencyStore((s) => s.paired?.id ?? null);
  return useQuery({
    queryKey: ["my-bookings", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const raw = await myBookings(agencyId);
      return raw.map(adaptServerBooking);
    },
    enabled: !!agencyId,
  });
}

export function useBookingDetail(id: string | undefined) {
  const agencyId = useAgencyStore((s) => s.paired?.id ?? null);
  return useQuery({
    queryKey: ["booking", id, agencyId],
    queryFn: async () => {
      if (!id || !agencyId) throw new Error("Missing id or agency");
      const raw = await bookingDetail(agencyId, id);
      return adaptServerBooking(raw);
    },
    enabled: !!id && !!agencyId,
  });
}

/**
 * Creates a booking against the currently paired agency. The server computes
 * and returns the authoritative price (`totalAmount`, in cents); the client
 * must never send or trust a locally-computed total. On success, the
 * `['my-bookings']` cache is invalidated so the new booking shows up.
 */
export function useCreateBooking() {
  const agencyId = useAgencyStore((s) => s.paired?.id ?? null);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateClientBookingPayload) => {
      if (!agencyId) throw new Error("No agency paired");
      return createBooking(agencyId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}

export function useBookingSummary(id: string | undefined) {
  const agencyId = useAgencyStore((s) => s.paired?.id ?? null);
  return useQuery({
    queryKey: ["booking-summary", id, agencyId],
    queryFn: async () => {
      if (!id || !agencyId) throw new Error("Missing id or agency");
      const raw = await bookingSummary(agencyId, id);
      return adaptServerBooking(raw);
    },
    enabled: !!id && !!agencyId,
  });
}
