import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isLocalDemoMode } from "@/constants/demoMode";
import { getPublicAgency, type PublicAgency } from "@/services/agencyService";
import { pairWithAgency } from "@/services/profileService";
import { ApiClientError } from "@/services/api";
import { useAgencyStore } from "@/stores/useAgencyStore";
import { fleetKeys } from "./useAgencyFleet";

export const pairingKeys = {
  all: ["pairing"] as const,
};

export class ProfileIncompleteError extends Error {
  constructor(public missingFields: string[]) {
    super("Profile is incomplete");
    this.name = "ProfileIncompleteError";
  }
}

// Resolves the public agency by id/slug, then creates the agency_client
// relation server-side. The local store is only updated after the relation
// exists, so the user can't browse a fleet they're not paired with.
//
// Throws ProfileIncompleteError if the server's pair endpoint reports 422
// PROFILE_INCOMPLETE — the caller should route the user to profile
// completion and retry.
export function usePairWithAgency() {
  const setActive = useAgencyStore((s) => s.pair);
  const queryClient = useQueryClient();
  return useMutation<PublicAgency, Error, string>({
    mutationFn: async (idOrSlug) => {
      const agency = await getPublicAgency(idOrSlug);
      if (isLocalDemoMode) {
        return agency;
      }
      try {
        await pairWithAgency(agency.id);
      } catch (err) {
        if (
          err instanceof ApiClientError &&
          err.code === "PROFILE_INCOMPLETE"
        ) {
          const details = err.details as
            | { missingFields?: string[] }
            | undefined;
          throw new ProfileIncompleteError(details?.missingFields ?? []);
        }
        throw err;
      }
      return agency;
    },
    onSuccess: (agency) => {
      setActive(agency);
      queryClient.invalidateQueries({ queryKey: fleetKeys.all });
    },
  });
}
