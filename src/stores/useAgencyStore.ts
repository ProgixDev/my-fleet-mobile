import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PublicAgency } from "@/services/agencyService";

interface AgencyState {
  paired: PublicAgency | null;
  pairedAt: string | null;
  /**
   * Whether this session has already asked the server which agencies the
   * customer belongs to.
   *
   * Deliberately NOT persisted (see `partialize`): it must start false on
   * every launch so a fresh install, or a device that has been signed out,
   * still performs the lookup. The router waits on this before deciding
   * between /home and /scan — without it, an authenticated-but-unhydrated
   * user is bounced to the scan screen before the answer arrives.
   */
  serverSynced: boolean;
}

interface AgencyActions {
  pair: (agency: PublicAgency) => void;
  unpair: () => void;
  /** Adopt the server's answer. Passing null records "asked, nothing found". */
  applyServerPairing: (agency: PublicAgency | null) => void;
  markServerSynced: () => void;
}

type AgencyStore = AgencyState & AgencyActions;

export const useAgencyStore = create<AgencyStore>()(
  persist(
    (set) => ({
      paired: null,
      pairedAt: null,
      serverSynced: false,

      pair: (agency) =>
        set({ paired: agency, pairedAt: new Date().toISOString() }),

      unpair: () => set({ paired: null, pairedAt: null }),

      applyServerPairing: (agency) =>
        set((state) => {
          if (!agency) return { serverSynced: true };
          // A local pairing wins on identity — the customer may have just
          // scanned a different agency — but the server's copy is fresher for
          // display fields like name, logo and address.
          const keepLocal = state.paired !== null && state.paired.id !== agency.id;
          if (keepLocal) return { serverSynced: true };
          return {
            paired: agency,
            pairedAt: state.pairedAt ?? new Date().toISOString(),
            serverSynced: true,
          };
        }),

      markServerSynced: () => set({ serverSynced: true }),
    }),
    {
      name: "my-fleet-client-agency",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Only the pairing itself survives a relaunch. `serverSynced` is
      // per-session state and must not be restored.
      partialize: (state) => ({
        paired: state.paired,
        pairedAt: state.pairedAt,
      }),
    },
  ),
);
