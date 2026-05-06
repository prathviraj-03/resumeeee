import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { pollOptimize } from "@/lib/api/ai";
import type { OptimizeStatus, OptimizeResult } from "@/lib/api/types";

interface OptimizationState {
  activeJobId: string | null;
  status: OptimizeStatus | "idle";
  progress: number;
  result: OptimizeResult | null;
  error: string | null;

  setJob: (jobId: string) => void;
  updateStatus: (status: OptimizeStatus | "idle", progress: number) => void;
  completeJob: (result: OptimizeResult) => void;
  setError: (error: string) => void;
  resetJob: () => void;
  
  // Polling logic
  startPolling: (jobId: string) => Promise<void>;
}

export const useOptimizationStore = create<OptimizationState>()(
  persist(
    (set, get) => ({
      activeJobId: null,
      status: "idle",
      progress: 0,
      result: null,
      error: null,

      setJob: (jobId) => set({ activeJobId: jobId, status: "pending", progress: 0, error: null }),
      
      updateStatus: (status, progress) => set({ status, progress }),
      
      completeJob: (result) => set({ 
        result, 
        status: "completed", 
        progress: 100,
        activeJobId: null 
      }),
      
      setError: (error) => set({ error, status: "failed", activeJobId: null }),
      
      resetJob: () => set({ activeJobId: null, status: "idle", progress: 0, result: null, error: null }),

      startPolling: async (jobId: string) => {
        const poll = async () => {
          try {
            const res = await pollOptimize(jobId);
            
            if (res.status === "completed") {
              get().completeJob(res);
              return;
            }
            
            if (res.status === "failed") {
              get().setError(res.error || "Optimization failed");
              return;
            }

            // Update progress and continue polling
            get().updateStatus(res.status, res.progress || 0);
            setTimeout(poll, 5000); // Poll every 5 seconds to stay within rate limits

          } catch (err: any) {
            get().setError(err.message || "Connection lost during optimization");
          }
        };

        get().setJob(jobId);
        await poll();
      }
    }),
    {
      name: "rf-optimization",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeJobId: state.activeJobId,
        status: state.status,
        result: state.result,
      }),
    }
  )
);
