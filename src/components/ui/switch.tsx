"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      [
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-none",
        "border-2 border-black bg-white shadow-neo-sm transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
      ].join(" "),
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        [
          "pointer-events-none block h-4 w-4 rounded-none border-2 border-black bg-white",
          "shadow-none ring-0 transition-transform",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
        ].join(" ")
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
