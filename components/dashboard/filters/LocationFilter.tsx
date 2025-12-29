'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin } from 'lucide-react'

export interface Location {
  province?: string
  district?: string
  sector?: string
}

export interface LocationFilterProps {
  provinces: string[]
  districts: string[]
  sectors: string[]
  values: Location
  onChange: (location: Location) => void
  className?: string
}

export function LocationFilter({
  provinces,
  districts,
  sectors,
  values,
  onChange,
  className,
}: LocationFilterProps) {
  const filteredDistricts = values.province
    ? districts.filter(d => d.startsWith(values.province || ''))
    : districts

  const filteredSectors = values.district
    ? sectors.filter(s => s.startsWith(values.district || ''))
    : sectors

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-slate-400" />
        <Label className="text-sm text-slate-300">Location</Label>
      </div>
      
      <div className="flex items-center gap-2">
        <Label className="text-xs text-slate-400">Province:</Label>
        <Select
          value={values.province || 'all'}
          onChange={(e) => {
            const province = e.target.value === 'all' ? undefined : e.target.value
            onChange({ province, district: undefined, sector: undefined })
          }}
        >
          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="All Provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {values.province && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-400">District:</Label>
          <Select
            value={values.district || 'all'}
            onChange={(e) => {
              const district = e.target.value === 'all' ? undefined : e.target.value
              onChange({ ...values, district, sector: undefined })
            }}
          >
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {filteredDistricts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {values.district && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-400">Sector:</Label>
          <Select
            value={values.sector || 'all'}
            onChange={(e) => {
              const sector = e.target.value === 'all' ? undefined : e.target.value
              onChange({ ...values, sector })
            }}
          >
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {filteredSectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

