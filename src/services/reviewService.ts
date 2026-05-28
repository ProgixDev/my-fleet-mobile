import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export interface AgencyReview {
  id: string;
  agencyId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AgencyRating {
  average: number | null;
  count: number;
}

export async function listAgencyReviews(agencyId: string): Promise<AgencyReview[]> {
  const headers = await getAuthHeader();
  return apiRequest<AgencyReview[]>(
    `/reviews/agency/${encodeURIComponent(agencyId)}`,
    { headers },
  );
}

export async function getAgencyRating(agencyId: string): Promise<AgencyRating> {
  const headers = await getAuthHeader();
  return apiRequest<AgencyRating>(
    `/reviews/agency/${encodeURIComponent(agencyId)}/rating`,
    { headers },
  );
}

export async function postReview(payload: {
  agencyId: string;
  rating: number;
  comment: string;
  bookingId?: string;
}): Promise<AgencyReview> {
  const headers = await getAuthHeader();
  return apiRequest<AgencyReview>("/reviews", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
