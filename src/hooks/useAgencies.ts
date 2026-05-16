import { useQuery } from "@tanstack/react-query";
import {
  listPublicAgencies,
  getPublicAgency,
  listPublicVehicles,
  getPublicVehicle,
  type ListPublicAgenciesFilters,
  type PublicAgency,
  type PublicVehicle,
  type PublicVehicleDetail,
} from "@/services/agencyService";

export function useAgencies(filters: ListPublicAgenciesFilters = {}) {
  return useQuery<PublicAgency[]>({
    queryKey: ["agencies", filters],
    queryFn: () => listPublicAgencies(filters),
  });
}

export function useAgency(idOrSlug: string | undefined) {
  return useQuery<PublicAgency>({
    queryKey: ["agency", idOrSlug],
    queryFn: () => getPublicAgency(idOrSlug!),
    enabled: !!idOrSlug,
  });
}

export function useAgencyVehicles(agencyId: string | undefined) {
  return useQuery<PublicVehicle[]>({
    queryKey: ["agency", agencyId, "vehicles"],
    queryFn: () => listPublicVehicles(agencyId!),
    enabled: !!agencyId,
  });
}

export function useVehicle(vehicleId: string | undefined, agencyId: string | undefined) {
  return useQuery<PublicVehicleDetail>({
    queryKey: ["vehicle", vehicleId, "agency", agencyId],
    queryFn: () => getPublicVehicle(vehicleId!, agencyId!),
    enabled: !!vehicleId && !!agencyId,
  });
}
