import { apiRequest } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export interface ServerPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export async function listPaymentMethods(): Promise<ServerPaymentMethod[]> {
  const headers = await getAuthHeader();
  return apiRequest<ServerPaymentMethod[]>("/client/payment-methods", {
    headers,
  });
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const headers = await getAuthHeader();
  await apiRequest<unknown>(
    `/client/payment-methods/${encodeURIComponent(id)}`,
    { method: "DELETE", headers },
  );
}
