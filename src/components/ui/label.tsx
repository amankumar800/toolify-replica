import * as React from "react"
import { cn } from "@/lib/utils"

// Removed Radix UI dependency to keep it simple and light as requested by context of "no external random deps unless needed"
// We can just use a standard label 

const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            className
        )}
        {...props}
    />
))
Label.displayName = "Label"

export { Label }
