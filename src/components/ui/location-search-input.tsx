import { Search } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type LocationSearchInputProps = {
    value: string
    onValueChange: (nextValue: string) => void
    placeholder?: string
    className?: string
}

function LocationSearchInput({
    value,
    onValueChange,
    placeholder = "¿Donde?",
    className,
}: LocationSearchInputProps) {
    const inputId = React.useId()
    return (
        <label
            htmlFor={inputId}
            className={cn(
                "flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--bg-soft)] px-4 py-2.5",
                className
            )}
        >
            <Search size={16} className="text-[color:var(--text-meta)]" aria-hidden />
            <input
                id={inputId}
                name="location-search-input"
                type="text"
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent font-wallie-fit text-[length:var(--wm-size-16)] text-[color:var(--wm-color-input-text)] outline-none placeholder:text-[color:var(--text-secondary)]"
            />
        </label>
    )
}


const designSystemMeta = {
    id: "location-search-input",
    entityType: "component",
    title: "Location Search Input",
    description: "Location Search Input del design system de Wallapop Meet.",
    status: "ready",
    states: ["default"],
    storybookTitle: "Design System/Location Search Input",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { LocationSearchInput, designSystemMeta }
export type { LocationSearchInputProps }
