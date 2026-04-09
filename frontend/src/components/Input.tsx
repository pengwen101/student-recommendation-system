import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../utils"; 

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all",
          "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          hasError && "border-danger-500 focus-visible:ring-danger-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";