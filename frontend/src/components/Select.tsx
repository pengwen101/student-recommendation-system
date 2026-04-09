import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            // 1. Base Layout (Matches Input exactly: h-10, px-3, etc.)
            "flex h-10 w-full appearance-none rounded-md border px-3 py-2 text-sm pr-10",
            
            "bg-white border-slate-300 text-slate-900 shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all",
            
            // 4. Disabled States
            "disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:bg-slate-900",
            
            // 5. Error State (If validation fails)
            hasError && "border-red-500 focus-visible:ring-red-500",
            
            // 6. User Overrides
            className
          )}
          {...props}
        >
          {children}
        </select>
        
        {/* Our Custom SVG Chevron Arrow (Replaces the ugly browser default) */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
          <svg 
            className="h-4 w-4 opacity-70" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";