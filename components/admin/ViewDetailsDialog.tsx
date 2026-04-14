'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

/** A section can render either a list of label/value fields (grid) or custom content */
export interface DetailSection {
  title: string
  /** Standard: render a responsive grid of label/value pairs */
  fields?: { label: string; value: React.ReactNode }[]
  /** Custom: render arbitrary content. Ignored if `fields` is provided */
  children?: React.ReactNode
  /** Grid columns for fields layout: 1, 2, or 3 (default 2) */
  gridCols?: 1 | 2 | 3
}

export interface ViewDetailsDialogAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  icon?: React.ReactNode
  disabled?: boolean
}

export interface ViewDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Main title (e.g. "Escrow Details") */
  title: string
  /** Optional subtitle, e.g. ID (shown below title) */
  subtitle?: React.ReactNode
  /** Called when user clicks copy next to subtitle; if provided, a copy button is shown */
  onCopySubtitle?: () => void
  /** Optional badge (e.g. status) shown in the header */
  badge?: React.ReactNode
  /** Sections to render; each has a title and either fields or children */
  sections: DetailSection[]
  /** Optional action buttons in the footer (Close is always added) */
  actions?: ViewDetailsDialogAction[]
  /** Optional custom footer (replaces default footer with actions + Close) */
  footer?: React.ReactNode
  /** Max width of the dialog */
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  /** Optional class for the content wrapper */
  className?: string
}

const maxWidthClasses = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
}

export function ViewDetailsDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  onCopySubtitle,
  badge,
  sections,
  actions,
  footer,
  maxWidth = '4xl',
  className,
}: ViewDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white shadow-xl dark:border-slate-800/60 dark:bg-black',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        <DialogHeader className="border-b border-slate-200/70 pb-4 mb-4 dark:border-slate-800/70">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </DialogTitle>
              {subtitle != null && (
                <DialogDescription className="mt-2 flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                  {typeof subtitle === 'string' ? (
                    <>
                      <span className="font-mono truncate px-2 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {subtitle}
                      </span>
                      {onCopySubtitle && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={onCopySubtitle}
                          title="Copy"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  ) : (
                    subtitle
                  )}
                </DialogDescription>
              )}
            </div>
            {badge != null && <div className="flex-shrink-0">{badge}</div>}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800/70 dark:bg-black"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                {section.title}
              </h3>
              {section.fields != null && section.fields.length > 0 ? (
                <div
                  className={cn(
                    'grid gap-4 text-sm',
                    section.gridCols === 1 && 'grid-cols-1',
                    section.gridCols === 3 && 'grid-cols-1 md:grid-cols-3',
                    (section.gridCols === 2 || section.gridCols == null) && 'grid-cols-1 md:grid-cols-2'
                  )}
                >
                  {section.fields.map((field, i) => (
                    <div key={i} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        {field.label}
                      </Label>
                      <div className="mt-1 text-slate-900 dark:text-white [&_.font-mono]:font-mono [&_.text-xs]:text-xs">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-900 dark:text-white [&_.text-muted-foreground]:text-slate-500 [&_.dark\\:text-slate-400]:dark:text-slate-400">
                  {section.children}
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6 border-t border-slate-200/70 pt-4 flex flex-col gap-3 dark:border-slate-800/70">
          {footer != null ? (
            footer
          ) : (
            <>
              {actions != null && actions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {actions.map((action, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={action.variant ?? 'default'}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        {action.icon && <span className="mr-2 inline-flex">{action.icon}</span>}
                        {action.label}
                      </Button>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
