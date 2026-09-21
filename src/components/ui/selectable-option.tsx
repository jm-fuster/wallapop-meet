import * as React from "react"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type SelectableOptionProps = {
    selected: boolean
    title?: string
    subtitle?: string
    leftIcon?: React.ReactNode
    rightAdornment?: React.ReactNode
    disabled?: boolean
    className?: string
    onClick?: () => void
    children?: React.ReactNode
}

function SelectionCircle({ selected }: { selected: boolean }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "mt-0.5 inline-flex h-[var(--wm-size-20)] w-[var(--wm-size-20)] items-center justify-center rounded-full border transition-colors",
                selected
                    ? "border-[color:var(--text-primary)] bg-[color:var(--text-primary)]"
                    : "border-[color:var(--border-strong)] bg-[color:var(--bg-base)]"
            )}
        >
            <span
                className={cn(
                    "h-[var(--wm-size-8)] w-[var(--wm-size-8)] rounded-full transition-colors",
                    selected ? "bg-[color:var(--text-on-action)]" : "bg-transparent"
                )}
            />
        </span>
    )
}

function SelectableOption({
    selected,
    title,
    subtitle,
    leftIcon,
    rightAdornment,
    disabled = false,
    className,
    onClick,
    children,
}: SelectableOptionProps) {
    const hasStructuredContent = Boolean(title || subtitle || leftIcon || rightAdornment)

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={selected}
            aria-disabled={disabled}
            className={cn(
                "w-full rounded-[var(--wm-size-20)] border px-4 py-4 text-left transition-shadow",
                selected
                    ? "border-[color:var(--text-primary)] shadow-[inset_0_0_0_1px_var(--text-primary)]"
                    : "border-[color:var(--border-strong)]",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                className
            )}
        >
            {hasStructuredContent ? (
                <div className="flex items-start gap-3">
                    {leftIcon ? (
                        <span className="mt-0.5 inline-flex h-[var(--wm-size-28)] w-[var(--wm-size-28)] items-center justify-center rounded-full bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]">
                            {leftIcon}
                        </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                        {title ? (
                            <p className="font-brand-strong text-[length:var(--wm-size-16)] leading-tight text-[color:var(--text-primary)]">
                                {title}
                            </p>
                        ) : null}
                        {subtitle ? (
                            <p className="mt-1 font-brand-text text-[length:var(--wm-size-13)] leading-[1.3] text-[color:var(--text-tertiary)]">
                                {subtitle}
                            </p>
                        ) : null}
                        {children ? <div className="mt-2">{children}</div> : null}
                    </div>
                    {rightAdornment ?? <SelectionCircle selected={selected} />}
                </div>
            ) : (
                children
            )}
        </button>
    )
}


const designSystemMeta = {
    id: "selectable-option",
    entityType: "component",
    title: "Selectable Option",
    description: "Selectable Option del design system de Wallapop Meet.",
    status: "ready",
    states: ["default","selected","disabled"],
    storybookTitle: "Design System/Selectable Option",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { SelectableOption, designSystemMeta }
