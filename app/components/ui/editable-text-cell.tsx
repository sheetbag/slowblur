"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface EditableTextCellProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
}

const EditableTextCell = React.forwardRef<HTMLInputElement, EditableTextCellProps>(
  ({ value, onSave, className, placeholder, disabled, onBlur, onKeyDown, ...props }, ref) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [currentValue, setCurrentValue] = React.useState<string>(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (!isEditing) {
        setCurrentValue(value);
      }
    }, [value, isEditing]);

    React.useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentValue(e.target.value);
    };

    const saveChanges = () => {
        const trimmedValue = currentValue.trim();
        setIsEditing(false);
        if (trimmedValue !== value) {
          onSave(trimmedValue || "");
        }
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        saveChanges();
        if (onBlur) {
            onBlur(e);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        saveChanges();
      } else if (e.key === 'Escape') {
        setCurrentValue(value);
        setIsEditing(false);
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[32px] px-2 w-full",
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
            value={currentValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
            placeholder={placeholder || "Section"}
            className="h-auto p-0 text-center font-normal border-none focus-visible:ring-0 bg-transparent shadow-none w-full rounded-none"
            style={{ background: 'transparent' }}
            {...props}
          />
        ) : (
          <span
            className={cn(
              "text-sm truncate w-full text-center",
              !currentValue && "text-muted-foreground"
            )}
          >
            {currentValue || placeholder || "Section"}
          </span>
        )}
      </div>
    );
  }
);

EditableTextCell.displayName = "EditableTextCell";

export { EditableTextCell };