import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export interface ServerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export async function listNotifications(): Promise<ServerNotification[]> {
  const headers = await getAuthHeader();
  return apiRequest<ServerNotification[]>("/notifications", { headers });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const headers = await getAuthHeader();
  return apiRequest<{ count: number }>("/notifications/unread-count", { headers });
}

export async function markRead(id: string): Promise<void> {
  const headers = await getAuthHeader();
  await apiRequest<unknown>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    headers,
  });
}

export async function markAllRead(): Promise<void> {
  const headers = await getAuthHeader();
  await apiRequest<unknown>("/notifications/read-all", {
    method: "PATCH",
    headers,
  });
}
