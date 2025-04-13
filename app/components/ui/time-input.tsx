"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { formatTime, parseTime } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null;
  onChange: (valueInSeconds: number | null) => void;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, className, disabled, onBlur, onKeyDown, ...props }, ref) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState<string>(formatTime(value));
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!isEditing) {
           setDisplayValue(formatTime(value));
        }
    }, [value, isEditing]);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setDisplayValue(e.target.value);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const parsedSeconds = parseTime(e.target.value);
        const finalSeconds = parsedSeconds !== null ? Math.max(0, parsedSeconds) : null;

        setIsEditing(false);
        setDisplayValue(formatTime(finalSeconds));
        if (finalSeconds !== value) {
          onChange(finalSeconds);
        }
         if (onBlur) {
             onBlur(e);
         }
    };

     const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
         if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
         } else if (e.key === 'Escape') {
             setDisplayValue(formatTime(value));
             setIsEditing(false);
         }
         if (onKeyDown) {
             onKeyDown(e);
         }
     };

    return (
        <div
          className={cn(
            "flex items-center justify-center min-h-[32px] px-2",
            !isEditing && !disabled && "cursor-text",
            className
          )}
          onClick={() => {
              if (!isEditing && !disabled) {
                  setIsEditing(true);
              }
          }}
        >
          {isEditing ? (
            <Input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              disabled={disabled}
              placeholder="m:ss"
              className="h-auto p-0 text-center font-normal border-none focus-visible:ring-0 bg-transparent shadow-none w-full rounded-none"
              style={{ background: 'transparent' }}
              {...props}
            />
          ) : (
            <span className={cn(
                "text-sm truncate",
                !displayValue && "text-muted-foreground"
                )}>
              {displayValue || "--:--"}
            </span>
          )}
        </div>
    );
  }
);

TimeInput.displayName = "TimeInput";

export { TimeInput };