import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  showLabel?: boolean
  variant?: "default" | "success" | "warning" | "danger"
  size?: "sm" | "md" | "lg"
}

function ProgressBar({ 
  className, 
  value,
  showLabel = false,
  variant = "default",
  size = "md",
  ...props 
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100)
  
  const variantStyles = {
    default: "from-blue-500 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    success: "from-green-500 to-green-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    warning: "from-yellow-500 to-yellow-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    danger: "from-red-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
  }

  const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-medium text-white">{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn("relative w-full bg-slate-900 rounded-full overflow-hidden", sizeStyles[size])}>
        <div className={cn("absolute inset-0 bg-gradient-to-r opacity-20", {
          "from-blue-500/20 to-blue-600/20": variant === "default",
          "from-green-500/20 to-green-600/20": variant === "success",
          "from-yellow-500/20 to-yellow-600/20": variant === "warning",
          "from-red-500/20 to-red-600/20": variant === "danger",
        })} />
        <div 
          className={cn(
            "relative h-full bg-gradient-to-r rounded-full transition-all duration-500 ease-out",
            variantStyles[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

export { ProgressBar }

