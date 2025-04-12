"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { formatTime, parseTime } from "@/lib/utils"
import { cn } from "@/lib/utils"

// Use standard React input attributes type
interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null; // Value is in seconds
  onChange: (valueInSeconds: number | null) => void;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, className, disabled, onBlur, onKeyDown, ...props }, ref) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState<string>(formatTime(value));
    const inputRef = React.useRef<HTMLInputElement>(null); // Ref for focusing

    // Update internal display state if external value changes
    React.useEffect(() => {
        // Only update display if not currently editing to avoid disrupting typing
        if (!isEditing) {
           setDisplayValue(formatTime(value));
        }
    }, [value, isEditing]);

    // Focus input when editing starts
    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select(); // Select text on focus
        }
    }, [isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setDisplayValue(e.target.value);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const parsedSeconds = parseTime(e.target.value);
        const finalSeconds = parsedSeconds !== null ? Math.max(0, parsedSeconds) : null;

        setIsEditing(false); // Exit editing mode on blur
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
             setDisplayValue(formatTime(value)); // Revert display to original value
             setIsEditing(false); // Exit editing mode
         }
         if (onKeyDown) {
             onKeyDown(e);
         }
     };

    return (
        <div
          className={cn(
            // Container styling: ensures height and alignment
            "flex items-center justify-center min-h-[32px] px-2", // Adjust height (h-8 is 32px) and padding
            !isEditing && !disabled && "cursor-text", // Show text cursor when not editing
            className // Allow overriding via prop
          )}
          onClick={() => {
              if (!isEditing && !disabled) {
                  setIsEditing(true);
              }
          }}
        >
          {isEditing ? (
            <Input
              ref={inputRef} // Use the local ref
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              disabled={disabled}
              placeholder="m:ss"
              // Styling for the input when editing
              className="h-auto p-0 text-center font-normal border-none focus-visible:ring-0 bg-transparent shadow-none w-full rounded-none"
              style={{ background: 'transparent' }}
              {...props}
            />
          ) : (
            // Display as text when not editing
            <span className={cn(
                "text-sm truncate",
                !displayValue && "text-muted-foreground" // Style placeholder differently
                )}>
              {displayValue || "--:--"} {/* Show value or placeholder */}
            </span>
          )}
        </div>
    );
  }
);

TimeInput.displayName = "TimeInput";

export { TimeInput };