"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface OperatorCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  status?: 'upcoming' | 'now-showing' | 'ended' | 'default'
  showIndicator?: boolean
}

const OperatorCheckbox = React.forwardRef<HTMLInputElement, OperatorCheckboxProps>(
  ({ className, label, status = 'default', showIndicator = false, ...props }, ref) => {
    const statusClasses = {
      upcoming: 'operator-checkbox-upcoming',
      'now-showing': 'operator-checkbox-now-showing',
      ended: 'operator-checkbox-ended',
      default: ''
    }

    const indicatorColors = {
      upcoming: 'bg-orange-500',
      'now-showing': 'bg-blue-500',
      ended: 'bg-gray-500',
      default: 'bg-primary'
    }

    return (
      <div className="operator-checkbox-group">
        <div className="relative">
          <input
            type="checkbox"
            className={cn(
              "operator-checkbox",
              statusClasses[status],
              className
            )}
            ref={ref}
            {...props}
          />
          {props.checked && (
            <Check className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white pointer-events-none" />
          )}
        </div>
        {label && (
          <label 
            htmlFor={props.id}
            className="operator-checkbox-label flex items-center gap-2"
          >
            {showIndicator && (
              <div className={cn("w-2 h-2 rounded-full", indicatorColors[status])} />
            )}
            {label}
          </label>
        )}
      </div>
    )
  }
)
OperatorCheckbox.displayName = "OperatorCheckbox"

export { OperatorCheckbox }
