import { BASE_URL } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export type KycField = "idFront" | "idBack" | "licenseFront" | "licenseBack";

// Posts a single document to the agency-scoped client endpoint. The backend
// stores it in supabase storage and patches client.documents[<field>].
//
// NOTE: this assumes the backend has a /client/kyc endpoint. If the endpoint
// is not yet deployed, the upload will surface a 404 — see plan §"Client app
// work · 1. New service layer".
export async function uploadKycDocument(
  agencyId: string,
  field: KycField,
  uri: string,
  fileName?: string,
): Promise<{ key: string; url: string }> {
  const headers = await getAuthHeader();
  const form = new FormData();
  form.append("file", {
    uri,
    name: fileName ?? `${field}.jpg`,
    type: "image/jpeg",
  } as unknown as Blob);
  form.append("field", field);

  const res = await fetch(`${BASE_URL}/client/kyc`, {
    method: "POST",
    headers: {
      ...headers,
      "x-agency-id": agencyId,
    },
    body: form,
  });
  const body = (await res.json()) as {
    success?: boolean;
    data?: { key: string; url: string };
    error?: { message?: string };
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? `KYC upload failed (${res.status})`);
  }
  return body.data;
}
