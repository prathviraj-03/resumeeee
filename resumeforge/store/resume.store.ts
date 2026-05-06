import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ATSScoreResult } from "@/lib/api/types";

interface ResumeState {
  selectedResumeId: string | null;
  parsedData: any | null;
  lastAtsResult: ATSScoreResult | null;
  
  setSelectedResume: (id: string | null) => void;
  setParsedData: (data: any | null) => void;
  setAtsResult: (result: ATSScoreResult | null) => void;
  resetResume: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      selectedResumeId: null,
      parsedData: null,
      lastAtsResult: null,

      setSelectedResume: (id: string | null) =>
        set({ selectedResumeId: id }),
      
      setParsedData: (data: any | null) =>
        set({ parsedData: data }),
      
      setAtsResult: (result: ATSScoreResult | null) =>
        set({ lastAtsResult: result }),

      resetResume: () =>
        set({ selectedResumeId: null, parsedData: null, lastAtsResult: null }),
    }),
    {
      name: "rf-resume",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
