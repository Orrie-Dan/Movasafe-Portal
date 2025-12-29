// Chart color palette for waste management system
export const CHART_COLORS = [
  '#3b82f6', // Blue - Primary
  '#10b981', // Green - Success/Recycling
  '#f59e0b', // Amber - Warning
  '#ef4444', // Red - Danger/Issues
  '#8b5cf6', // Purple - Secondary
  '#ec4899', // Pink - Tertiary
  '#06b6d4', // Cyan - Info
  '#f97316', // Orange - Alert
] as const

export const WASTE_TYPE_COLORS: Record<string, string> = {
  organic: '#10b981',      // Green
  plastic: '#3b82f6',      // Blue
  paper: '#f59e0b',        // Amber
  metal: '#8b5cf6',        // Purple
  glass: '#06b6d4',        // Cyan
  'e-waste': '#ef4444',    // Red
  hazardous: '#ec4899',    // Pink
  other: '#6b7280',        // Gray
}

export const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3b82f6',    // Blue
  in_progress: '#f59e0b',  // Amber
  completed: '#10b981',    // Green
  missed: '#ef4444',      // Red
  cancelled: '#6b7280',    // Gray
}

