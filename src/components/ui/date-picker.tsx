"use client"

import * as React from "react"
import { format } from "date-fns-jalali"
import { faIR } from "date-fns-jalali/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import { toPersianDigits, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | null) => void
  placeholder?: string
  className?: string
}

// تعریف دستی نوع props برای custom header
type CustomHeaderProps = {
  date: Date
  decreaseMonth: () => void
  increaseMonth: () => void
  prevMonthButtonDisabled: boolean
  nextMonthButtonDisabled: boolean
}

export default function JalaliDatePicker({
  date,
  onDateChange,
  placeholder,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal rtl:flex-row-reverse",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2" />
          {date
            ? toPersianDigits(format(date, "d MMMM yyyy", { locale: faIR }))
            : placeholder || "انتخاب تاریخ"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ReactDatePicker
          selected={date}
          onChange={(selectedDate: Date | null) => {
            onDateChange?.(selectedDate)
            setIsOpen(false)
          }}
          inline
          locale="fa"
          shouldCloseOnSelect={false}
          calendarClassName="font-sans rtl"
          renderCustomHeader={(props: CustomHeaderProps) => {
            const {
              date: current,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            } = props

            return (
              <div className="flex items-center justify-between px-2 py-2">
                <button
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  {toPersianDigits("‹")}
                </button>
                <span className="text-sm font-medium">
                  {toPersianDigits(
                    format(current, "MMMM yyyy", { locale: faIR })
                  )}
                </span>
                <button
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  {toPersianDigits("›")}
                </button>
              </div>
            )
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
