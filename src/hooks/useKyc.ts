import { useQuery } from "@tanstack/react-query";
import { getKycStatus, type KycStatus } from "@/services/kycService";
import { useAgencyStore } from "@/stores/useAgencyStore";

/**
 * Loads the customer's KYC document upload status (per-field uploaded/missing).
 * The underlying endpoint (GET /client/documents) is user-scoped; the paired
 * agency id is passed through for API symmetry only. Verification itself is
 * relation-level (agency_client.verified_at) and not surfaced per document.
 */
export function useKycStatus() {
  const agencyId = useAgencyStore((s) => s.paired?.id ?? null);
  return useQuery<KycStatus>({
    queryKey: ["kyc-status", agencyId],
    queryFn: () => getKycStatus(agencyId ?? undefined),
  });
}
