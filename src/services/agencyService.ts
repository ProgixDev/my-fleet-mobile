import { Image as RNImage } from "react-native";

import { isLocalDemoMode } from "@/constants/demoMode";
import { agencies as demoAgencies, vehicles as demoVehicles } from "@/data/mockData";
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

function resolveDemoAssetUri(asset: number): string | null {
  return RNImage.resolveAssetSource(asset)?.uri ?? null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function demoAgencySlug(id: string): string {
  return `agency-${id}`;
}

function mapDemoAgency(agency: (typeof demoAgencies)[number]): PublicAgency {
  const agencyVehicles = demoVehicles.filter((v) => v.agencyId === agency.id);
  return {
    id: agency.id,
    slug: demoAgencySlug(agency.id),
    name: agency.name,
    logo: agency.logo || agency.name.slice(0, 1).toUpperCase(),
    country: "FR",
    currency: "EUR",
    email: `${normalizeText(agency.name)}@myfleet.local`,
    phone: "+33 6 00 00 00 00",
    address: agency.address,
    city: agency.city,
    vehicleCount: agencyVehicles.length || agency.vehicles,
    rating: agency.rating,
    reviewCount: agency.reviews,
  };
}

function mapDemoVehicle(vehicle: (typeof demoVehicles)[number]): PublicVehicle {
  return {
    id: vehicle.id,
    slug: `vehicle-${vehicle.id}`,
    name: vehicle.name,
    brand: vehicle.name.split(" ")[0] ?? vehicle.name,
    category: vehicle.category,
    status: "available",
    year: vehicle.year,
    dailyRate: vehicle.price,
    fuelType: vehicle.fuel,
    transmission: vehicle.transmission,
    seats: vehicle.seats,
    thumbnailUrl:
      vehicle.images?.[0] != null
        ? resolveDemoAssetUri(vehicle.images[0]) ?? null
        : null,
  };
}

function mapDemoVehicleDetail(
  vehicle: (typeof demoVehicles)[number],
): PublicVehicleDetail {
  return {
    ...mapDemoVehicle(vehicle),
    mileage: 0,
    color: "Unknown",
    features: vehicle.features,
    images: (vehicle.images ?? [])
      .map((asset, index) => ({
        angle: `image-${index}`,
        url: resolveDemoAssetUri(asset) ?? "",
      }))
      .filter((image) => image.url.length > 0),
  };
}

function findDemoAgency(idOrSlug: string) {
  const normalized = idOrSlug.trim().toLowerCase();
  return demoAgencies.find((agency) => {
    const nameSlug = normalizeText(agency.name);
    return (
      agency.id.toLowerCase() === normalized ||
      demoAgencySlug(agency.id) === normalized ||
      nameSlug === normalized
    );
  });
}

export async function listPublicAgencies(
  filters: ListPublicAgenciesFilters = {},
): Promise<PublicAgency[]> {
  if (isLocalDemoMode) {
    return demoAgencies
      .map(mapDemoAgency)
      .filter((agency) => {
        if (filters.city && agency.city?.toLowerCase() !== filters.city.toLowerCase()) {
          return false;
        }
        if (filters.country && agency.country.toLowerCase() !== filters.country.toLowerCase()) {
          return false;
        }
        if (
          filters.search &&
          !`${agency.name} ${agency.city ?? ""} ${agency.address}`
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }

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

export async function getPublicAgency(idOrSlug: string): Promise<PublicAgency> {
  if (isLocalDemoMode) {
    const agency = findDemoAgency(idOrSlug);
    if (!agency) throw new Error("Agency not found");
    return mapDemoAgency(agency);
  }

  const headers = await getAuthHeader();
  return apiRequest<PublicAgency>(
    `/agency/public/${encodeURIComponent(idOrSlug)}`,
    { headers },
  );
}

export async function listPublicVehicles(
  agencyId: string,
): Promise<PublicVehicle[]> {
  if (isLocalDemoMode) {
    return demoVehicles
      .filter((vehicle) => vehicle.agencyId === agencyId)
      .map(mapDemoVehicle);
  }

  const auth = await getAuthHeader();
  return apiRequest<PublicVehicle[]>(`/fleet/catalog`, {
    headers: { ...auth, "X-Agency-Id": agencyId },
  });
}

export async function getPublicVehicle(
  id: string,
  agencyId: string,
): Promise<PublicVehicleDetail> {
  if (isLocalDemoMode) {
    const vehicle = demoVehicles.find(
      (item) => item.id === id && item.agencyId === agencyId,
    );
    if (!vehicle) throw new Error("Vehicle not found");
    return mapDemoVehicleDetail(vehicle);
  }

  const auth = await getAuthHeader();
  return apiRequest<PublicVehicleDetail>(
    `/fleet/catalog/${encodeURIComponent(id)}`,
    {
      headers: { ...auth, "X-Agency-Id": agencyId },
    },
  );
}
