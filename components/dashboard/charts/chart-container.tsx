import { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

export interface ChartContainerProps {
  children: ReactElement
  height?: number
  className?: string
}

export function ChartContainer({
  children,
  height = 300,
  className = '',
}: ChartContainerProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

