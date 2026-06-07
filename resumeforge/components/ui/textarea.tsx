import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, showCount, maxLength, id, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label htmlFor={inputId} className="block text-sm font-medium text-foreground/80">
              {label}
            </label>
          )}
          {showCount && (
            <span className={cn(
              "text-xs font-mono transition-colors",
              maxLength && charCount > maxLength * 0.9 ? "text-warning" : "text-muted-foreground"
            )}>
              {charCount}{maxLength ? `/${maxLength}` : ""}
            </span>
          )}
        </div>
        <textarea
          id={inputId}
          className={cn(
            "flex w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground",
            "border-border placeholder:text-muted-foreground/50",
            "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200 resize-none",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
