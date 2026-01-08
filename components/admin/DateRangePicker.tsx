'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value?: { from: Date | null; to: Date | null }
  onChange: (range: { from: Date | null; to: Date | null }) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [fromDate, setFromDate] = useState<string>(
    value?.from ? format(value.from, 'yyyy-MM-dd') : ''
  )
  const [toDate, setToDate] = useState<string>(
    value?.to ? format(value.to, 'yyyy-MM-dd') : ''
  )

  const handleFromChange = (date: string) => {
    setFromDate(date)
    onChange({
      from: date ? new Date(date) : null,
      to: value?.to || null,
    })
  }

  const handleToChange = (date: string) => {
    setToDate(date)
    onChange({
      from: value?.from || null,
      to: date ? new Date(date) : null,
    })
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        type="date"
        value={fromDate}
        onChange={(e) => handleFromChange(e.target.value)}
        className="bg-slate-800 border-slate-700 text-white w-40"
      />
      <span className="text-slate-400">to</span>
      <Input
        type="date"
        value={toDate}
        onChange={(e) => handleToChange(e.target.value)}
        className="bg-slate-800 border-slate-700 text-white w-40"
      />
    </div>
  )
}

