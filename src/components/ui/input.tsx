import * as React from "react"

import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type InputState = "default" | "error" | "success"

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
    label?: string
    hint?: string
    error?: string
    state?: InputState
    showCharCounter?: boolean
}

const wrapperBaseClass =
    "relative w-full min-h-6 rounded-[var(--wm-radius-300)] bg-transparent text-left transition-[padding,box-shadow,opacity] duration-200 ease-out"

const wrapperStateClass: Record<InputState, string> = {
    default:
        "shadow-[inset_0_0_0_1px_var(--wm-color-input-ring-default)] hover:shadow-[inset_0_0_0_2px_var(--wm-color-input-ring-hover)]",
    error:
        "shadow-[inset_0_0_0_2px_var(--wm-color-input-ring-error)] hover:shadow-[inset_0_0_0_2px_var(--wm-color-input-ring-error)]",
    success:
        "shadow-[inset_0_0_0_2px_var(--wm-color-input-ring-success)] hover:shadow-[inset_0_0_0_2px_var(--wm-color-input-ring-success)]",
}

const helperTextClass =
    "font-brand-text text-[length:var(--wm-size-12)] leading-4 text-[color:var(--wm-color-input-label)]"
const successTextClass =
    "font-brand-text text-[length:var(--wm-size-12)] leading-4 text-[color:var(--wm-color-input-ring-success)]"
const counterTextClass =
    "flex-1 text-right font-brand-text text-[length:var(--wm-size-12)] leading-4 text-[color:var(--wm-color-input-label)]"
const errorTextClass =
    "font-brand-text text-[length:var(--wm-size-12)] leading-4 text-[color:var(--wm-color-input-ring-error)]"

const getInitialValue = (value: React.ComponentProps<"input">["defaultValue"]) =>
    value == null ? "" : String(value)

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            label,
            hint,
            error,
            state = "default",
            id,
            value,
            defaultValue,
            maxLength,
            disabled,
            onChange,
            onFocus,
            onBlur,
            showCharCounter = true,
            ...props
        },
        ref
    ) => {
        const resolvedState: InputState = error ? "error" : state
        const helperMessage = error ?? hint
        const helperClassName = error
            ? errorTextClass
            : resolvedState === "success"
              ? successTextClass
              : helperTextClass
        const inputId = React.useId()
        const helperId = React.useId()
        const counterId = React.useId()
        const resolvedId = id ?? inputId
        const isControlled = value !== undefined
        const [uncontrolledValue, setUncontrolledValue] = React.useState(() =>
            getInitialValue(defaultValue)
        )
        const [isFocused, setIsFocused] = React.useState(false)
        const currentValue = isControlled ? String(value ?? "") : uncontrolledValue
        const hasValue = currentValue.length > 0
        const isCompact = isFocused || hasValue
        const showCounter = showCharCounter && typeof maxLength === "number"
        const showErrorIcon = resolvedState === "error"
        const describedByParts = [
            props["aria-describedby"],
            helperMessage ? helperId : undefined,
            showCounter ? counterId : undefined,
        ].filter(Boolean)

        const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
            if (!isControlled) {
                setUncontrolledValue(event.target.value)
            }
            onChange?.(event)
        }

        const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
            setIsFocused(true)
            onFocus?.(event)
        }

        const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
            setIsFocused(false)
            onBlur?.(event)
        }

        return (
            <div className="flex w-full flex-col">
                <div
                    data-slot="input-wrapper"
                    data-state={resolvedState}
                    className={cn(
                        wrapperBaseClass,
                        isCompact
                            ? "px-[var(--wm-input-padding-x)] pt-[var(--wm-input-padding-y-compact)] pb-[var(--wm-input-padding-y-compact)] min-h-[var(--wm-size-44)]"
                            : "px-[var(--wm-input-padding-x)] pt-[var(--wm-input-padding-y-default)] pb-[var(--wm-input-padding-y-default)]",
                        disabled
                            ? "opacity-[var(--wm-opacity-input-disabled)] shadow-[inset_0_0_0_1px_var(--wm-color-input-ring-default)] hover:shadow-[inset_0_0_0_1px_var(--wm-color-input-ring-default)]"
                            : isFocused && resolvedState === "default"
                              ? "shadow-[inset_0_0_0_2px_var(--wm-color-input-ring-hover)]"
                              : wrapperStateClass[resolvedState]
                    )}
                >
                    {label ? (
                        <label
                            htmlFor={resolvedId}
                            className={cn(
                                "pointer-events-none absolute right-14 left-4 overflow-hidden text-ellipsis whitespace-nowrap font-brand-text transition-all duration-200 ease-out",
                                resolvedState === "error"
                                    ? "text-[color:var(--wm-color-input-ring-error)]"
                                    : "text-[color:var(--wm-color-input-label)]",
                                isCompact
                                    ? "top-[var(--wm-size-10)] text-[length:var(--wm-size-14)] leading-5"
                                    : "top-[var(--wm-size-20)] text-[length:var(--wm-size-16)] leading-6"
                            )}
                        >
                            {label}
                        </label>
                    ) : null}
                    <div className={cn("relative", isCompact ? "mt-5" : "mt-0")}>
                        <input
                            ref={ref}
                            id={resolvedId}
                            aria-invalid={resolvedState === "error"}
                            aria-describedby={
                                describedByParts.length > 0
                                    ? describedByParts.join(" ")
                                    : undefined
                            }
                            maxLength={maxLength}
                            disabled={disabled}
                            value={value}
                            defaultValue={defaultValue}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            className={cn(
                                "w-full border-none bg-transparent p-0 pr-8 font-brand-text text-[length:var(--wm-size-16)] leading-6 text-[color:var(--wm-color-input-text)] outline-none",
                                "placeholder:text-transparent focus:placeholder:text-[color:var(--wm-color-input-placeholder-focus)]",
                                "transition-colors duration-100 ease-out",
                                disabled ? "cursor-initial" : "cursor-pointer",
                                className
                            )}
                            {...props}
                        />
                        {showErrorIcon ? (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 right-0 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[color:var(--wm-color-input-ring-error)] text-[length:var(--wm-size-18)] leading-none text-white"
                            >
                                !
                            </span>
                        ) : null}
                    </div>
                </div>
                {helperMessage || showCounter ? (
                    <div className="flex pt-1">
                        {helperMessage ? (
                            <p id={helperId} className={helperClassName}>
                                {helperMessage}
                            </p>
                        ) : null}
                        {showCounter ? (
                            <span
                                id={counterId}
                                aria-live="polite"
                                aria-atomic="true"
                                className={cn(
                                    counterTextClass,
                                    disabled && "opacity-[var(--wm-opacity-input-disabled)]"
                                )}
                            >
                                {currentValue.length}/{maxLength}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>
        )
    }
)

Input.displayName = "Input"


const designSystemMeta = {
    id: "input",
    entityType: "component",
    title: "Input",
    description: "Input del design system de Wallapop Meet.",
    status: "ready",
    states: ["default","error","success","disabled"],
    storybookTitle: "Design System/Input",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { Input, designSystemMeta }
