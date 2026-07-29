'use client';
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    (<DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-orange-100/80 [&:has([aria-selected].day-outside)]:bg-orange-50/50 [&:has([aria-selected].day-range-end)]:rounded-r-xl [&:has([aria-selected].day-range-start)]:rounded-l-xl",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-xl [&:has(>.day-range-start)]:rounded-l-xl first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl"
            : "[&:has([aria-selected])]:rounded-xl"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium aria-selected:opacity-100 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all"
        ),
        day_range_start: "day-range-start bg-orange-500 text-white font-bold rounded-l-xl hover:bg-orange-600 hover:text-white shadow-xs",
        day_range_end: "day-range-end bg-orange-500 text-white font-bold rounded-r-xl hover:bg-orange-600 hover:text-white shadow-xs",
        day_selected:
          "bg-orange-500 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-500 focus:text-white font-bold rounded-xl shadow-xs",
        day_today: "bg-orange-100 text-orange-700 font-bold rounded-xl",
        day_outside:
          "day-outside text-slate-300 aria-selected:bg-orange-50 aria-selected:text-slate-400 opacity-50",
        day_disabled: "text-slate-300 opacity-50",
        day_range_middle:
          "aria-selected:bg-orange-100 aria-selected:text-orange-900 font-semibold rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props} />)
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
