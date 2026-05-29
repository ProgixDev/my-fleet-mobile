import { isLocalDemoMode } from "@/constants/demoMode";
import { reviews as demoReviews } from "@/data/mockData";
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

function mapDemoReview(review: (typeof demoReviews)[number], index: number): AgencyReview {
  return {
    id: review.id,
    agencyId: review.agencyId,
    userId: `demo-user-${index}`,
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  };
}

export async function listAgencyReviews(agencyId: string): Promise<AgencyReview[]> {
  if (isLocalDemoMode) {
    return demoReviews
      .filter((review) => review.agencyId === agencyId)
      .map(mapDemoReview);
  }

  const headers = await getAuthHeader();
  return apiRequest<AgencyReview[]>(
    `/reviews/agency/${encodeURIComponent(agencyId)}`,
    { headers },
  );
}

export async function getAgencyRating(agencyId: string): Promise<AgencyRating> {
  if (isLocalDemoMode) {
    const items = demoReviews.filter((review) => review.agencyId === agencyId);
    if (items.length === 0) return { average: null, count: 0 };
    const sum = items.reduce((acc, item) => acc + item.rating, 0);
    return {
      average: Number((sum / items.length).toFixed(1)),
      count: items.length,
    };
  }

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
  if (isLocalDemoMode) {
    return {
      id: `demo-review-${Date.now()}`,
      agencyId: payload.agencyId,
      userId: "demo-client",
      userName: "Demo Client",
      rating: payload.rating,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
    };
  }

  const headers = await getAuthHeader();
  return apiRequest<AgencyReview>("/reviews", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
