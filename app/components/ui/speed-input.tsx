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
  step?: number;
}

const SpeedInput = React.forwardRef<HTMLInputElement, SpeedInputProps>(
  ({ value, onChange, min = 0.25, max = 2, step = 0.05, className, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(value.toFixed(2));

    React.useEffect(() => {
      setDisplayValue(value.toFixed(2));
    }, [value]);

    const adjustValue = (adjustment: number) => {
      const currentValue = parseFloat(displayValue);
      let newValue = !isNaN(currentValue) ? currentValue + adjustment : min;
      newValue = Math.max(min, Math.min(newValue, max));
      const formattedNewValue = parseFloat(newValue.toFixed(2));

      setDisplayValue(formattedNewValue.toFixed(2));
      if (formattedNewValue !== value) {
          onChange(formattedNewValue);
      }
    };

    const handleIncrement = () => {
      adjustValue(step);
    };

    const handleDecrement = () => {
      adjustValue(-step);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setDisplayValue(e.target.value);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let finalValue = parseFloat(e.target.value);
        if (isNaN(finalValue)) {
            finalValue = min;
        }
        finalValue = Math.max(min, Math.min(finalValue, max));
        const formattedFinalValue = parseFloat(finalValue.toFixed(2));

        setDisplayValue(formattedFinalValue.toFixed(2));
        if (formattedFinalValue !== value) {
          onChange(formattedFinalValue);
        }
         if (props.onBlur) {
             props.onBlur(e);
         }
    };

     const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
         if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
         }
         if (props.onKeyDown) {
             props.onKeyDown(e);
         }
     };

    return (
      <TooltipProvider>
      <div className={cn(
        "flex items-center justify-between rounded-md border border-input bg-transparent dark:bg-card/85 px-[1px] py-0 h-9 w-28",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow]",
        className
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground rounded-[6px]"
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
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          className="h-auto p-0 text-center font-normal bg-transparent shadow-none w-10 flex-1 rounded-none border-none focus-visible:border-none focus-visible:ring-0 outline-none"
          style={{ background: 'transparent' }}
          min={min}
          max={max}
          step={step}
          {...props}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground rounded-[6px]"
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