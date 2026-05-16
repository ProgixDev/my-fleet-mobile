import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export interface LoyaltyStatus {
  tier: string;
  points: number;
  pointsToNextTier: number;
  nextTier: string | null;
  history: Array<{
    id: string;
    label: string;
    points: number;
    date: string;
  }>;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  pointsRequired: number;
  benefits: string[];
  color: string;
}

export async function getLoyaltyStatus(): Promise<LoyaltyStatus> {
  const headers = await getAuthHeader();
  return apiRequest<LoyaltyStatus>("/client/loyalty/status", { headers });
}

export async function listLoyaltyTiers(): Promise<LoyaltyTier[]> {
  const headers = await getAuthHeader();
  return apiRequest<LoyaltyTier[]>("/client/loyalty/tiers", { headers });
}
