import * as React from "react"

import type { WallapopIconName } from "@/components/ui/wallapop-icon"
import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type ChatComposerProps = Omit<React.ComponentProps<"textarea">, "onSubmit"> & {
  onSubmit?: (value: string) => void
  submitLabel?: string
  submitAriaLabel?: string
  secondaryActionLabel?: string
  secondaryActionAriaLabel?: string
  secondaryActionIconName?: WallapopIconName
  onSecondaryAction?: () => void
  secondaryActionDisabled?: boolean
}

function ChatComposer({
  className,
  value,
  defaultValue,
  onChange,
  onSubmit,
  disabled,
  submitLabel = "Enviar",
  submitAriaLabel = "Enviar mensaje",
  secondaryActionLabel,
  secondaryActionAriaLabel = "Accion secundaria",
  secondaryActionIconName = "deal",
  onSecondaryAction,
  secondaryActionDisabled = false,
  placeholder = "Escribe un mensaje...",
  ...props
}: ChatComposerProps) {
  const textareaId = React.useId()
  const [innerValue, setInnerValue] = React.useState(
    defaultValue == null ? "" : String(defaultValue)
  )
  const isControlled = value !== undefined
  const resolvedValue = isControlled ? String(value ?? "") : innerValue
  const isEmpty = resolvedValue.trim().length === 0
  const hasSecondaryAction = Boolean(secondaryActionLabel || onSecondaryAction)

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    if (!isControlled) {
      setInnerValue(event.target.value)
    }
    onChange?.(event)
  }

  const handleSubmit = () => {
    if (disabled || isEmpty) {
      return
    }
    onSubmit?.(resolvedValue)
    if (!isControlled) {
      setInnerValue("")
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      data-slot="chat-composer-wrapper"
      className="w-full bg-[color:var(--bg-base)] p-2 sm:p-3"
      role="group"
      aria-label="Composer de chat"
    >
      <div
        data-slot="chat-composer"
        className={cn(
          "flex items-center gap-1.5",
          className
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 rounded-full border-[0.8px] bg-[color:var(--bg-base)] p-1.5 transition-colors",
            disabled
              ? "border-[color:var(--wm-color-border-default)]"
              : "border-[color:var(--wm-color-border-default)] focus-within:border-[color:var(--action-primary)]"
          )}
        >
          <textarea
            id={textareaId}
            name="chat-composer-message"
            value={resolvedValue}
            disabled={disabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            className={cn(
              "max-h-32 min-h-7 min-w-0 flex-1 resize-none border-none bg-transparent px-1 py-1.5 font-brand text-[length:var(--wm-size-16)] leading-6 text-[color:var(--text-primary)] outline-none",
              "placeholder:text-[color:var(--text-meta)]"
            )}
            {...props}
          />
          {hasSecondaryAction ? (
            <button
              type="button"
              aria-label={secondaryActionLabel ?? secondaryActionAriaLabel}
              title={secondaryActionLabel ?? secondaryActionAriaLabel}
              onClick={() => onSecondaryAction?.()}
              disabled={disabled || secondaryActionDisabled}
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[0.8px] transition-colors sm:h-10 sm:w-10",
                disabled || secondaryActionDisabled
                  ? "border-[color:var(--action-disabled-bg)] bg-[color:var(--action-disabled-bg)] text-[color:var(--action-disabled-text)]"
                  : "border-[color:var(--action-primary)] bg-[color:var(--action-primary)] text-[color:var(--text-inverse)]"
              )}
            >
              <WallapopIcon name={secondaryActionIconName} size="small" />
            </button>
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 shrink-0 sm:h-10 sm:w-10"
            />
          )}
        </div>
        <button
          type="button"
          aria-label={submitAriaLabel}
          title={submitLabel}
          onClick={handleSubmit}
          disabled={disabled || isEmpty}
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[0.8px] transition-colors sm:h-10 sm:w-10",
            disabled || isEmpty
              ? "border-[color:var(--action-disabled-bg)] bg-[color:var(--action-disabled-bg)] text-[color:var(--action-disabled-text)]"
              : "border-[color:var(--action-primary)] bg-[color:var(--action-primary)] text-[color:var(--text-inverse)]"
          )}
        >
          <WallapopIcon name="paper_plane" size="small" className="-translate-x-[var(--wm-size-1)] rotate-[12deg]" />
        </button>
      </div>
    </div>
  )
}


const designSystemMeta = {
    id: "chat-composer",
    entityType: "component",
    title: "Chat Composer",
    description: "Chat Composer del design system de Wallapop Meet.",
    status: "ready",
    states: ["buyer","seller","disabled"],
    storybookTitle: "Design System/Chat Composer",
    tokensUsed: [
        "tokens.color.semantic.action.primary",
        "tokens.color.semantic.action.disabled_bg",
        "tokens.color.semantic.action.disabled_text",
        "tokens.color.semantic.text.secondary",
        "tokens.color.semantic.border.divider",
    ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { ChatComposer, designSystemMeta }
