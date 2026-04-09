import { cn } from "../utils"

interface PaneProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "shadow" | "flat";
}

export function Pane({ 
    children, 
    className, 
    variant = "default", 
    ...props 
}: PaneProps) {
    return (
        <div 
            className={cn(
                "w-full rounded-2xl p-8 transition-all",
                variant === "default" && "bg-white border border-slate-200",
                variant === "shadow" && "bg-white shadow-xl shadow-slate-200/50 border border-slate-100",
                variant === "flat" && "bg-slate-50",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}