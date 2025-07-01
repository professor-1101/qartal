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
  ariaLabel
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {type === "input" ? (
        <Input
          id={id}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("h-11", inputClassName)}
          aria-label={ariaLabel || label}
        />
      ) : (
        <Textarea
          id={id}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("min-h-[120px] resize-none", textareaClassName)}
          aria-label={ariaLabel || label}
        />
      )}
    </div>
  );
} 