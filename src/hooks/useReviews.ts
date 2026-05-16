import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAgencyReviews,
  getAgencyRating,
  postReview,
} from "@/services/reviewService";

export function useAgencyReviews(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "agency", agencyId],
    queryFn: () => listAgencyReviews(agencyId!),
    enabled: !!agencyId,
  });
}

export function useAgencyRating(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "agency", agencyId, "rating"],
    queryFn: () => getAgencyRating(agencyId!),
    enabled: !!agencyId,
  });
}

export function usePostReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postReview,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["reviews", "agency", variables.agencyId] });
    },
  });
}
