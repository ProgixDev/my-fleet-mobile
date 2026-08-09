import { z } from "zod";

import { apiRequest } from "./api";
import { getAuthHeader } from "./authHeader";

export interface PublicAgency {
  id: string;
  slug: string;
  name: string;
  logo: string;
  country: string;
  currency: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  vehicleCount?: number;
  rating?: number | null;
  reviewCount?: number;
}

export interface ListPublicAgenciesFilters {
  city?: string;
  country?: string;
  search?: string;
}

export async function listPublicAgencies(
  filters: ListPublicAgenciesFilters = {},
): Promise<PublicAgency[]> {
  const headers = await getAuthHeader();
  const qs = new URLSearchParams();
  if (filters.city) qs.set("city", filters.city);
  if (filters.country) qs.set("country", filters.country);
  if (filters.search) qs.set("search", filters.search);
  const query = qs.toString();
  return apiRequest<PublicAgency[]>(
    `/agency/public${query ? `?${query}` : ""}`,
    { headers },
  );
}

/**
 * Shape of an agency as this app stores it. Parsed rather than trusted: the
 * result is written straight into persisted state, so a malformed response
 * would be cached to disk and survive restarts.
 */
const pairedAgencySchema = z.object({
  id: z.string().min(1),
  slug: z.string(),
  name: z.string(),
  logo: z.string(),
  country: z.string(),
  currency: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string().optional(),
  vehicleCount: z.number().optional(),
  rating: z.number().nullable().optional(),
  reviewCount: z.number().optional(),
});

/**
 * The agencies this customer is already paired with, most recently paired
 * first.
 *
 * Pairing is created by scanning an agency QR, but the resulting relation
 * lives on the server while the app keeps it only in AsyncStorage — so a
 * reinstall or a new device silently loses it. This is the source of truth
 * used to rehydrate `useAgencyStore` on sign-in.
 */
export async function listMyAgencies(): Promise<PublicAgency[]> {
  const headers = await getAuthHeader();
  const data = await apiRequest<unknown>("/agency/public/mine", { headers });
  return z.array(pairedAgencySchema).parse(data);
}

export interface PublicVehicle {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  status: string;
  year: number;
  dailyRate: number;
  fuelType: string;
  transmission: string;
  seats: number;
  thumbnailUrl: string | null;
}

export interface PublicVehicleDetail extends PublicVehicle {
  mileage: number;
  color: string;
  features: string[];
  includedKm?: number;
  extraKmRate?: number;
  images: { angle: string; url: string }[];
}

export async function getPublicAgency(idOrSlug: string): Promise<PublicAgency> {
  const headers = await getAuthHeader();
  return apiRequest<PublicAgency>(
    `/agency/public/${encodeURIComponent(idOrSlug)}`,
    { headers },
  );
}

export async function listPublicVehicles(
  agencyId: string,
): Promise<PublicVehicle[]> {
  const auth = await getAuthHeader();
  return apiRequest<PublicVehicle[]>(`/fleet/catalog`, {
    headers: { ...auth, "X-Agency-Id": agencyId },
  });
}

export async function getPublicVehicle(
  id: string,
  agencyId: string,
): Promise<PublicVehicleDetail> {
  const auth = await getAuthHeader();
  return apiRequest<PublicVehicleDetail>(
    `/fleet/catalog/${encodeURIComponent(id)}`,
    {
      headers: { ...auth, "X-Agency-Id": agencyId },
    },
  );
}
