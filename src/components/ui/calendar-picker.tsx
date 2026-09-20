import * as React from "react"
import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"

import {
  buildCalendarDayCells,
  type CalendarDayCell,
} from "@/components/ui/calendar-picker.utils"
import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

type CalendarPickerProps = {
  label?: string
  monthDate: Date
  selectedDateValue: string
  minDateValue: string
  onMonthChange: (nextMonthDate: Date) => void
  onSelectDate: (nextDateValue: string) => void
  state?: "default" | "error"
  error?: string
  dayLabels?: string[]
  locale?: string
  className?: string
}

function CalendarPicker({
  label,
  monthDate,
  selectedDateValue,
  minDateValue,
  onMonthChange,
  onSelectDate,
  state = "default",
  error,
  dayLabels = ["L", "M", "X", "J", "V", "S", "D"],
  locale = "es-ES",
  className,
}: CalendarPickerProps) {
  const calendarCells = React.useMemo(
    () => buildCalendarDayCells(monthDate, minDateValue),
    [monthDate, minDateValue]
  )

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label className="text-[length:var(--wm-size-14)] font-medium leading-[1.4] text-[color:var(--wm-color-text-primary)]">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "rounded-[var(--wm-size-20)] border p-3",
          state === "error"
            ? "border-2 border-[color:var(--wm-color-input-ring-error)]"
            : "border-[color:var(--wm-color-border-default)]",
          className
        )}
      >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
            )
          }
        >
          <WallapopIcon name="chevron_right" size="small" className="rotate-180" />
        </button>
        <p className="font-wallie-chunky text-[length:var(--wm-size-18)] capitalize text-[color:var(--text-primary)]">
          {monthDate.toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          type="button"
          aria-label="Mes siguiente"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
            )
          }
        >
          <WallapopIcon name="chevron_right" size="small" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1" role="presentation">
        {dayLabels.map((label) => (
          <p
            key={label}
            className="pb-0.5 text-center font-wallie-fit text-[length:var(--wm-size-11)] text-[color:var(--text-secondary)]"
          >
            {label}
          </p>
        ))}
        {calendarCells.map((cell) => {
          const isSelected = selectedDateValue === cell.dateValue
          return (
            <button
              key={cell.dateValue}
              type="button"
              aria-label={cell.date.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              aria-pressed={isSelected}
              disabled={cell.isPast}
              onClick={() => onSelectDate(cell.dateValue)}
              className={`h-8 rounded-[var(--wm-size-8)] border text-center text-[length:var(--wm-size-13)] ${
                isSelected
                  ? "border-[color:var(--action-primary-pressed)] bg-[color:var(--bg-accent-subtle)] font-wallie-chunky text-[color:var(--text-primary)] shadow-[inset_0_0_0_1px_var(--action-primary)]"
                  : `border-transparent bg-[color:var(--bg-surface)] font-wallie-fit hover:bg-[color:var(--bg-surface)] ${
                      cell.inCurrentMonth ? "text-[color:var(--text-primary)]" : "text-[color:var(--action-disabled-text)]"
                    }`
              } ${
                cell.isPast
                  ? "cursor-not-allowed opacity-40 hover:bg-[color:var(--bg-surface)]"
                  : ""
              }`}
            >
              {cell.date.getDate()}
            </button>
          )
        })}
      </div>
      </div>
      {error ? (
        <p className="text-[length:var(--wm-size-12)] leading-[1.4] text-[color:var(--wm-color-input-ring-error)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}


const designSystemMeta = {
    id: "calendar-picker",
    entityType: "component",
    title: "Calendar Picker",
    description: "Calendar Picker del design system de Wallapop Meet.",
    status: "ready",
    states: ["default","error"],
    storybookTitle: "Design System/CalendarPicker",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { CalendarPicker, designSystemMeta }
export type { CalendarPickerProps, CalendarDayCell }


