// Waste management system types and constants

export const WASTE_TYPES = [
  'organic',
  'plastic',
  'paper',
  'metal',
  'glass',
  'e-waste',
  'hazardous',
  'other',
] as const

export type WasteType = typeof WASTE_TYPES[number]

export const COLLECTION_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'missed',
  'cancelled',
] as const

export type CollectionStatus = typeof COLLECTION_STATUSES[number]

export const WASTE_TYPE_DISPLAY_NAMES: Record<WasteType, string> = {
  organic: 'Organic Waste',
  plastic: 'Plastic',
  paper: 'Paper',
  metal: 'Metal',
  glass: 'Glass',
  'e-waste': 'E-Waste',
  hazardous: 'Hazardous',
  other: 'Other',
}

export const STATUS_DISPLAY_NAMES: Record<CollectionStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
}

// Rwanda provinces for geographic data
export const RWANDA_PROVINCES = [
  'Kigali City',
  'Eastern Province',
  'Northern Province',
  'Southern Province',
  'Western Province',
] as const

export const TOTAL_RWANDA_PROVINCES = 5

