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
