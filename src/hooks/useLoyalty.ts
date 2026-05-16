import { useQuery } from "@tanstack/react-query";
import {
  getLoyaltyStatus,
  listLoyaltyTiers,
} from "@/services/loyaltyService";

export function useLoyaltyStatus() {
  return useQuery({
    queryKey: ["loyalty", "status"],
    queryFn: getLoyaltyStatus,
  });
}

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: ["loyalty", "tiers"],
    queryFn: listLoyaltyTiers,
  });
}
