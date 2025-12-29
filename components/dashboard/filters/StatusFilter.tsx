'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Filter } from 'lucide-react'

export interface StatusOption {
  value: string
  label: string
}

export interface StatusFilterProps {
  options: StatusOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  label?: string
  className?: string
}

export function StatusFilter({
  options,
  value,
  onChange,
  multiple = false,
  label = 'Status',
  className,
}: StatusFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      if (currentValues.includes(newValue)) {
        onChange(currentValues.filter(v => v !== newValue))
      } else {
        onChange([...currentValues, newValue])
      }
    } else {
      onChange(newValue === 'all' ? '' : newValue)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Filter className="h-4 w-4 text-slate-400" />
      <Label className="text-xs text-slate-400">{label}:</Label>
      <Select
        value={Array.isArray(value) ? value[0] || 'all' : value || 'all'}
        onChange={handleChange}
      >
        <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder={`All ${label}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {label}s</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

