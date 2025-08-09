"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "input" | "textarea";
  className?: string;
  inputClassName?: string;
  textareaClassName?: string;
  ariaLabel?: string;
  maxWords?: number;
  showWordCount?: boolean;
}

export function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "input",
  className,
  inputClassName,
  textareaClassName,
  ariaLabel,
  maxWords,
  showWordCount = false
}: FormFieldProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isOverLimit = maxWords && wordCount > maxWords;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxWords) {
      const newWordCount = newValue.trim() ? newValue.trim().split(/\s+/).length : 0;
      if (newWordCount <= maxWords) {
        onChange(newValue);
      }
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {type === "input" ? (
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn("h-11", inputClassName)}
          aria-label={ariaLabel || label}
        />
      ) : (
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn("min-h-[120px] resize-none", textareaClassName)}
          aria-label={ariaLabel || label}
        />
      )}
      {showWordCount && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>تعداد کلمات: {wordCount}</span>
          {maxWords && (
            <span className={isOverLimit ? "text-destructive" : ""}>
              {wordCount}/{maxWords}
            </span>
          )}
        </div>
      )}
    </div>
  );
} 