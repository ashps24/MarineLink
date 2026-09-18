"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types";

/**
 * Demo role selection. This is NOT authentication — it only swaps which mock
 * user the UI pretends to be signed in as, so all three experiences are
 * demonstrable in one build. Real sessions replace this entirely.
 */
interface RoleStore {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      role: "internal",
      setRole: (role) => set({ role }),
    }),
    {
      name: "marinelink.demo-role",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
