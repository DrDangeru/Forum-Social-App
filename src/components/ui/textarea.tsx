import * as React from "react"

import { cn } from "../../lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-none border-2 border-black " + 
          "bg-white px-3 py-2 text-sm ring-offset-background font-bold " + 
          "placeholder:text-gray-400 focus-visible:outline-none " +
          "focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 " +
          "disabled:cursor-not-allowed disabled:opacity-50 shadow-neo-sm transition-all " +
          "focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
