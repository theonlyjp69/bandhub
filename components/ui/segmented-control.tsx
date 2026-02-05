'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<{
    value: string
    label: string
  }>
  className?: string
}

export function SegmentedControl({
  value,
  onValueChange,
  options,
  className
}: SegmentedControlProps): React.ReactElement {
  return (
    <div className={cn(
      "inline-flex rounded-lg bg-muted p-1",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onValueChange(option.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-all",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
