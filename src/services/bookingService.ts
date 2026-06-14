import { apiRequest, BASE_URL } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

const AGENCY_HEADER = "x-agency-id";

// The client app currently scopes itself to a single agency; this id is set
// at boot time (e.g. via deep-link or env). For now, callers pass it explicitly.
function agencyHeaders(agencyId: string): Record<string, string> {
  return { [AGENCY_HEADER]: agencyId };
}

interface ServerBooking {
  id: string;
  vehicleId: string;
  vehicleName: string;
  agencyName?: string;
  agencyPhone?: string | null;
  startDate: string;
  endDate: string;
  pickupTime?: string;
  returnTime?: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  totalAmount: number;
  depositStatus:
    | "none"
    | "held"
    | "captured"
    | "partially_captured"
    | "released"
    | "forfeited"
    | "failed"
    | null;
  depositCapturedAmount: number | null;
  rentalInvoiceId: string | null;
  damagesInvoiceId: string | null;
  startMileage: number | null;
  returnMileage: number | null;
  includedKm: number | null;
  extraKmRate: number | null;
  kmDriven: number | null;
  kmOverage: number | null;
  overageCost: number | null;
  workflow: Record<string, unknown> | null;
}

export interface CreateClientBookingPayload {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupTime?: string;
  returnTime?: string;
  pickupLocation?: string;
  returnLocation?: string;
  options?: Array<{
    id: string;
    label?: string;
    price?: number;
    enabled: boolean;
    deliveryDetails?: {
      address: string;
      lat: number;
      lng: number;
      distanceKm: number;
      fee: number;
    };
  }>;
  insurance?: { tier: "basic" | "all_inclusive" };
  notes?: string;
}

export async function listAgencyVehicles(agencyId: string): Promise<unknown[]> {
  const headers = await getAuthHeader();
  return apiRequest<unknown[]>("/fleet/catalog", {
    headers: { ...headers, ...agencyHeaders(agencyId) },
  });
}

export async function getVehicle(
  agencyId: string,
  vehicleId: string,
): Promise<unknown> {
  const headers = await getAuthHeader();
  return apiRequest<unknown>(`/fleet/catalog/${vehicleId}`, {
    headers: { ...headers, ...agencyHeaders(agencyId) },
  });
}

export async function createBooking(
  agencyId: string,
  payload: CreateClientBookingPayload,
): Promise<ServerBooking> {
  const headers = await getAuthHeader();
  return apiRequest<ServerBooking>("/client/bookings", {
    method: "POST",
    headers: {
      ...headers,
      ...agencyHeaders(agencyId),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function myBookings(agencyId: string): Promise<ServerBooking[]> {
  const headers = await getAuthHeader();
  return apiRequest<ServerBooking[]>("/client/bookings", {
    headers: { ...headers, ...agencyHeaders(agencyId) },
  });
}

export async function bookingDetail(
  agencyId: string,
  id: string,
): Promise<ServerBooking> {
  const headers = await getAuthHeader();
  return apiRequest<ServerBooking>(`/client/bookings/${id}`, {
    headers: { ...headers, ...agencyHeaders(agencyId) },
  });
}

export async function bookingSummary(
  agencyId: string,
  id: string,
): Promise<ServerBooking> {
  const headers = await getAuthHeader();
  return apiRequest<ServerBooking>(`/client/bookings/${id}/summary`, {
    headers: { ...headers, ...agencyHeaders(agencyId) },
  });
}

export async function createCheckoutSession(
  agencyId: string,
  bookingId: string,
): Promise<{ url: string; sessionId?: string }> {
  const headers = await getAuthHeader();
  return apiRequest<{ url: string; sessionId?: string }>(
    `/client/bookings/${encodeURIComponent(bookingId)}/pay/checkout`,
    {
      method: "POST",
      headers: {
        ...headers,
        ...agencyHeaders(agencyId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
}

// Adapter — normalises the server booking to the client app's existing
// in-app `Booking` shape so screens that read `mockData.ts` types still work.
export function adaptServerBooking(b: ServerBooking): {
  id: string;
  vehicleId: string;
  vehicleName: string;
  agencyName: string;
  agencyPhone?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: "active" | "confirmed" | "completed";
  total: number;
  reference: string;
  pickupMethod: string;
  withChauffeur: boolean;
  startMileage?: number;
  returnMileage?: number;
  includedKm?: number;
  extraKmRate?: number;
  kmDriven?: number;
  kmOverage?: number;
  overageCost?: number;
  depositStatus?: ServerBooking["depositStatus"];
  rentalInvoiceId?: string | null;
  damagesInvoiceId?: string | null;
} {
  const status: "active" | "confirmed" | "completed" =
    b.status === "active" || b.status === "completed" ? b.status : "confirmed";
  return {
    id: b.id,
    vehicleId: b.vehicleId,
    vehicleName: b.vehicleName,
    agencyName: b.agencyName ?? "",
    agencyPhone: b.agencyPhone ?? undefined,
    startDate: b.startDate,
    endDate: b.endDate,
    startTime: b.pickupTime ?? "09:00",
    endTime: b.returnTime ?? "18:00",
    status,
    total: b.totalAmount,
    reference: b.id.slice(0, 8).toUpperCase(),
    // pickupMethod/withChauffeur have no field on the booking DTO yet; kept as
    // defaults until the backend exposes the selected options on the booking.
    pickupMethod: "agency",
    withChauffeur: false,
    startMileage: b.startMileage ?? undefined,
    returnMileage: b.returnMileage ?? undefined,
    includedKm: b.includedKm ?? undefined,
    extraKmRate: b.extraKmRate ?? undefined,
    kmDriven: b.kmDriven ?? undefined,
    kmOverage: b.kmOverage ?? undefined,
    overageCost: b.overageCost ?? undefined,
    depositStatus: b.depositStatus,
    rentalInvoiceId: b.rentalInvoiceId,
    damagesInvoiceId: b.damagesInvoiceId,
  };
}

export const __internal = { BASE_URL };
