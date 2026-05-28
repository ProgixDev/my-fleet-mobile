import { useQuery } from "@tanstack/react-query";
import {
  myBookings,
  bookingDetail,
  bookingSummary,
  adaptServerBooking,
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
