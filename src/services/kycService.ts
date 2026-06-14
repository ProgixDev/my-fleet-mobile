import { apiRequest, BASE_URL } from "@/services/api";
import { getAuthHeader } from "@/services/authHeader";

export type KycField = "idFront" | "idBack" | "licenseFront" | "licenseBack";

export const KYC_FIELDS: KycField[] = [
  "idFront",
  "idBack",
  "licenseFront",
  "licenseBack",
];

// Backend document `type` values (see backend users.types.ts USER_DOCUMENT_TYPES)
// mapped to the client app's KycField names.
const SERVER_TYPE_TO_FIELD: Record<string, KycField> = {
  "id-front": "idFront",
  "id-back": "idBack",
  "license-front": "licenseFront",
  "license-back": "licenseBack",
};

export interface UserDocument {
  id: string;
  type: string;
  url: string;
  originalName: string;
  uploadedAt: string | null;
}

export type KycFieldStatus = "uploaded" | "missing";

export interface KycStatus {
  /** Per-field upload status, derived from the documents list. */
  fields: Record<KycField, KycFieldStatus>;
  /** True when every required field has at least one uploaded document. */
  allUploaded: boolean;
  documents: UserDocument[];
}

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

interface ServerUserDocument {
  id: string;
  type: string;
  url: string;
  originalName: string;
  uploadedAt: string | null;
}

/**
 * Fetches the customer's uploaded KYC documents (GET /client/documents) and
 * maps them to a per-field status. The endpoint is user-scoped (verification
 * is relation-level on agency_client.verified_at — there is no per-document
 * verified flag), so `agencyId` is accepted for API symmetry but not required
 * by the backend.
 */
export async function getKycStatus(_agencyId?: string): Promise<KycStatus> {
  const headers = await getAuthHeader();
  const list = await apiRequest<ServerUserDocument[]>("/client/documents", {
    headers,
  });

  const fields: Record<KycField, KycFieldStatus> = {
    idFront: "missing",
    idBack: "missing",
    licenseFront: "missing",
    licenseBack: "missing",
  };
  for (const doc of list) {
    const field = SERVER_TYPE_TO_FIELD[doc.type];
    if (field) fields[field] = "uploaded";
  }

  return {
    fields,
    allUploaded: KYC_FIELDS.every((f) => fields[f] === "uploaded"),
    documents: list.map((d) => ({
      id: d.id,
      type: d.type,
      url: d.url,
      originalName: d.originalName,
      uploadedAt: d.uploadedAt,
    })),
  };
}
