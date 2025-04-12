"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Plus, Minus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"

interface SpeedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number; // Step for +/- buttons
}

const SpeedInput = React.forwardRef<HTMLInputElement, SpeedInputProps>(
  ({ value, onChange, min = 0.25, max = 2, step = 0.05, className, disabled, ...props }, ref) => {
    // Internal state for display during typing, synced with prop 'value'
    const [displayValue, setDisplayValue] = React.useState<string>(value.toFixed(2));

    // Update internal display state if external value changes
    React.useEffect(() => {
      setDisplayValue(value.toFixed(2));
    }, [value]);

    const adjustValue = (adjustment: number) => {
      const currentValue = parseFloat(displayValue); // Use display value as base for adjustment
      let newValue = !isNaN(currentValue) ? currentValue + adjustment : min; // Default to min if current display is invalid
      // Clamp value within min/max bounds
      newValue = Math.max(min, Math.min(newValue, max));
      // Format for consistency before triggering change
      const formattedNewValue = parseFloat(newValue.toFixed(2));

      setDisplayValue(formattedNewValue.toFixed(2)); // Update display
      if (formattedNewValue !== value) {
          onChange(formattedNewValue); // Trigger external change
      }
    };

    const handleIncrement = () => {
      adjustValue(step);
    };

    const handleDecrement = () => {
      adjustValue(-step);
    };

    // Handle direct input change - update display immediately
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setDisplayValue(e.target.value); // Allow user to type freely
    };

    // Validate and clamp on blur
    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let finalValue = parseFloat(e.target.value);
        if (isNaN(finalValue)) {
            finalValue = min; // Default to min if invalid
        }
        // Clamp value within min/max bounds
        finalValue = Math.max(min, Math.min(finalValue, max));
        const formattedFinalValue = parseFloat(finalValue.toFixed(2));

        setDisplayValue(formattedFinalValue.toFixed(2)); // Ensure display matches final value
        if (formattedFinalValue !== value) { // Only call onChange if value actually changed
          onChange(formattedFinalValue);
        }
         if (props.onBlur) {
             props.onBlur(e); // Forward the original blur event if needed
         }
    };

     const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
         if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur(); // Trigger blur to finalize value
         }
         if (props.onKeyDown) {
             props.onKeyDown(e); // Forward the original keydown event
         }
     };

    return (
      <TooltipProvider>
      <div className={cn(
        "flex items-center justify-between rounded-md border border-input bg-transparent px-[1px] py-0 h-9 w-28",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow]",
        className
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm" // Use sm size for text buttons
              className="h-7 px-2 text-muted-foreground hover:text-foreground rounded-[6px]" // Adjusted padding
              onClick={handleDecrement}
              disabled={disabled || value <= min}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Decrease speed <Kbd className="ml-1">-</Kbd></p>
          </TooltipContent>
        </Tooltip>
        <Input
          ref={ref}
          type="text" // Use text to allow intermediate typing like "1."
          inputMode="decimal" // Hint for mobile keyboards
          value={displayValue} // Display internal state
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          // Keep border-none, add focus-visible:border-none and focus-visible:ring-0, keep outline-none
          className="h-auto p-0 text-center font-normal bg-transparent shadow-none w-10 flex-1 rounded-none border-none focus-visible:border-none focus-visible:ring-0 outline-none"
          style={{ background: 'transparent' }} // Ensure transparent background
          min={min}
          max={max}
          step={step}
          {...props} // Pass other input props
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm" // Use sm size
              className="h-7 px-2 text-muted-foreground hover:text-foreground rounded-[6px]" // Adjusted padding
              onClick={handleIncrement}
              disabled={disabled || value >= max}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Increase speed <Kbd className="ml-1">+</Kbd></p>
          </TooltipContent>
        </Tooltip>
      </div>
      </TooltipProvider>
    );
  }
);

SpeedInput.displayName = "SpeedInput";

export { SpeedInput };