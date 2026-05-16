import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: "client" | "driver" | "agency";
  body: string;
  createdAt: string;
  read?: boolean;
}

export async function listMessages(bookingId: string): Promise<BookingMessage[]> {
  const headers = await getAuthHeader();
  return apiRequest<BookingMessage[]>(
    `/client/bookings/${encodeURIComponent(bookingId)}/messages`,
    { headers },
  );
}

export async function postMessage(
  bookingId: string,
  body: string,
): Promise<BookingMessage> {
  const headers = await getAuthHeader();
  return apiRequest<BookingMessage>(
    `/client/bookings/${encodeURIComponent(bookingId)}/messages`,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    },
  );
}
