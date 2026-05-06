"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export function ErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-danger" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-zinc-500 mb-2 max-w-sm">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      {error?.message && (
        <p className="text-xs text-zinc-700 font-mono mb-6 max-w-sm bg-zinc-900 px-3 py-2 rounded-lg">
          {error.message}
        </p>
      )}
      <div className="flex items-center gap-3">
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        <Button variant="ghost" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </motion.div>
  );
}

// Next.js 14 error.tsx compatible component
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} onReset={reset} />;
}
