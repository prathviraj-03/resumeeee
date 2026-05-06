"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { toast } from "sonner";
import { isRateLimitError, isAuthError, getErrorMessage } from "@/lib/api/error";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (isRateLimitError(error)) return false;      // don't retry 429
        if (isAuthError(error))      return false;      // don't retry 401/403
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 400) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        // Global 429 toast — individual pages can override with their own handlers
        if (isRateLimitError(error)) {
          toast.warning("Rate limit reached (20 req/min on AI routes). Please wait a moment.", { id: "rate-limit" });
        }
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
