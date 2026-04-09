import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-25 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all resize-y",
          "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-slate-50",
          hasError && "border-danger-500 focus-visible:ring-danger-500",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";