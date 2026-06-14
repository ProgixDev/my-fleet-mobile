import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

// Mirrors the backend /client/loyalty/status shape: tier and nextTier are
// objects (not strings), the field is pointsToNext (not pointsToNextTier), and
// history items use description/amount/type.
export interface LoyaltyTier {
  id: "bronze" | "silver" | "gold" | "platinum";
  name: string;
  points: number;
  benefits: string[];
}

export interface LoyaltyHistoryItem {
  id: string;
  type: "earned" | "redeemed";
  description: string;
  amount: number;
  date: string;
}

export interface LoyaltyStatus {
  points: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNext: number;
  history: LoyaltyHistoryItem[];
}

export async function getLoyaltyStatus(): Promise<LoyaltyStatus> {
  const headers = await getAuthHeader();
  return apiRequest<LoyaltyStatus>("/client/loyalty/status", { headers });
}

export async function listLoyaltyTiers(): Promise<LoyaltyTier[]> {
  const headers = await getAuthHeader();
  return apiRequest<LoyaltyTier[]>("/client/loyalty/tiers", { headers });
}
