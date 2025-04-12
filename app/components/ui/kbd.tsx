import * as React from "react"

import { cn } from "@/lib/utils"

const Kbd = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => {
  return (
    <kbd
      ref={ref}
      className={cn(
        "rounded-sm pointer-events-none inline-flex select-none w-5 h-5 justify-center items-center border font-mono text-xs font-normal",
        "dark:border-background dark:text-background",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
})
Kbd.displayName = "Kbd"

export { Kbd }