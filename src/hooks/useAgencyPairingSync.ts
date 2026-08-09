// Rehydrates the customer's agency pairing from the server once per session.
//
// Pairing is created by scanning an agency QR and is recorded server-side in
// `agency_client`, but the app kept it only in AsyncStorage. A reinstall, a new
// phone, or a fresh install by an App Store reviewer therefore lands an
// authenticated customer on the scan screen with no way forward — the relation
// still exists, the app just never asked for it.
//
// Best-effort and fail-open: any error still marks the session synced so the
// router is never left waiting. The worst case degrades to the old behaviour,
// which is the scan screen.

import { useEffect } from "react";

import { listMyAgencies } from "@/services/agencyService";
import { useAgencyStore } from "@/stores/useAgencyStore";

export function useAgencyPairingSync(enabled: boolean = true) {
  const serverSynced = useAgencyStore((s) => s.serverSynced);
  const applyServerPairing = useAgencyStore((s) => s.applyServerPairing);
  const markServerSynced = useAgencyStore((s) => s.markServerSynced);

  useEffect(() => {
    if (!enabled || serverSynced) return;

    let cancelled = false;

    void (async () => {
      try {
        const agencies = await listMyAgencies();
        if (cancelled) return;
        // Ordered most recently paired first by the API, so the head is the
        // right default when the app has no local pairing to keep.
        applyServerPairing(agencies[0] ?? null);
      } catch {
        if (!cancelled) markServerSynced();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, serverSynced, applyServerPairing, markServerSynced]);
}
