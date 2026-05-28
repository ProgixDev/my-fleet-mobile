/**
 * Delivery pricing configuration as returned by /agency/public/:id/delivery.
 * Inlined here to avoid pulling in the mockData module just for the type.
 */
export interface DeliveryConfig {
  enabled: boolean;
  basePointLabel: string;
  basePointLat: number;
  basePointLng: number;
  ratePerKm: number;
  currency: string;
  minFee?: number;
  maxDistanceKm?: number;
}

/**
 * Result shape returned by computeDeliveryFee. Use the `ok` discriminator
 * before reading the other fields.
 */
export type DeliveryComputeResult =
  | {
      ok: true;
      distanceKm: number;
      fee: number;
      minFeeApplied: boolean;
    }
  | {
      ok: false;
      code: "empty" | "too_short" | "too_far";
      message: string;
      /** Populated when the reason is too_far so the UI can explain the cap. */
      distanceKm?: number;
    };

/** djb2-style hash — pure, deterministic, side-effect free. */
function hashString(value: string): number {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pseudo-random but deterministic distance derived from the address.
 * Same address → same distance → same fee. Ranges 0.5 km .. 95 km so the
 * maxDistanceKm cap is reachable for stricter agencies.
 */
export function mockDistanceKm(address: string): number {
  const normalized = address.trim().toLowerCase();
  const hash = hashString(normalized);
  // 0.5 .. 95.5 km, rounded to one decimal
  const raw = 0.5 + (hash % 9500) / 100;
  return Math.round(raw * 10) / 10;
}

export function computeDeliveryFee(
  address: string,
  config: DeliveryConfig,
): DeliveryComputeResult {
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return { ok: false, code: "empty", message: "Adresse requise" };
  }
  if (trimmed.length < 6) {
    return {
      ok: false,
      code: "too_short",
      message: "Adresse trop courte — saisissez une rue et une ville",
    };
  }

  const distanceKm = mockDistanceKm(trimmed);

  if (config.maxDistanceKm != null && distanceKm > config.maxDistanceKm) {
    return {
      ok: false,
      code: "too_far",
      message: `Adresse hors zone (${distanceKm.toFixed(1)} km > ${config.maxDistanceKm} km)`,
      distanceKm,
    };
  }

  // ratePerKm and minFee are denominated in cents (smallest currency unit),
  // matching the canonical money convention used across the app/API/DB.
  const raw = distanceKm * config.ratePerKm;
  const minFee = config.minFee ?? 0;
  const minFeeApplied = raw < minFee;
  // Round to whole cents so `fee` is always an integer in the canonical unit.
  const fee = Math.round(Math.max(raw, minFee));

  return { ok: true, distanceKm, fee, minFeeApplied };
}
