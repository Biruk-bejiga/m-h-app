"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CheckIn } from "@/lib/types";

type CheckInState = {
  checkins: CheckIn[];
  hasHydrated: boolean;

  addCheckIn: (checkin: CheckIn) => void;
  clearAll: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set, get) => ({
      checkins: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      addCheckIn: (checkin) => {
        const next = [...get().checkins, checkin].sort(
          (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
        );
        set({ checkins: next });
      },

      clearAll: () => set({ checkins: [] }),
    }),
    {
      name: "mhcb-checkins-v1",
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
