import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlowBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info"
  glow?: boolean
}

function GlowBadge({ 
  className, 
  variant = "default", 
  glow = true,
  ...props 
}: GlowBadgeProps) {
  const variantStyles = {
    default: "bg-blue-500/20 text-blue-300 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]",
    success: "bg-green-500/20 text-green-300 border-green-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
    warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
    danger: "bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.3)]",
  }

  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300",
        variantStyles[variant],
        glow && "hover:scale-105",
        className
      )}
      {...props}
    >
      {glow && (
        <div className={cn(
          "absolute inset-0 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300",
          {
            "bg-blue-500/20": variant === "default" || variant === "info",
            "bg-green-500/20": variant === "success",
            "bg-yellow-500/20": variant === "warning",
            "bg-red-500/20": variant === "danger",
          }
        )} />
      )}
      <span className="relative flex items-center gap-1.5">
        {variant === "success" && (
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
        {props.children}
      </span>
    </div>
  )
}

export { GlowBadge }

