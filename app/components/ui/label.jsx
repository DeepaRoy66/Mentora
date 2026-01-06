"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

// Simple class for the label (same as shadcn/ui default)
const labelClasses = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"

// Label component using forwardRef for accessibility
const Label = React.forwardRef((props, ref) => {
  const { className, ...rest } = props

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelClasses, className)}
      {...rest}
    />
  )
})

Label.displayName = "Label"

export { Label }