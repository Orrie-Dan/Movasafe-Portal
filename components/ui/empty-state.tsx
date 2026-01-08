import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 animate-fade-in">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        {Icon && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl animate-pulse-slow" />
            <div className="relative p-6 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <Icon className="h-12 w-12 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        )}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">{description}</p>
        {action && (
          <Button 
            onClick={action.onClick} 
            variant="gradient"
            className="mt-4"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

