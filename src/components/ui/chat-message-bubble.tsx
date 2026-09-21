import * as React from "react"

import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type ChatMessageBubbleVariant = "sent" | "received"
type ChatMessageDeliveryState = "sent" | "read"

type ChatMessageBubbleProps = React.ComponentProps<"div"> & {
  variant?: ChatMessageBubbleVariant
  time?: string
  deliveryState?: ChatMessageDeliveryState
}

const bubbleVariantClass: Record<ChatMessageBubbleVariant, string> = {
  received:
    "border-[0.8px] border-[color:var(--border-bubble)] bg-transparent px-3 py-2",
  sent: "border-[0.8px] border-[color:var(--wm-color-border-default)] bg-[color:var(--wm-color-border-default)] px-3 py-2",
}

function ChatMessageBubble({
  className,
  variant = "received",
  time,
  deliveryState = "sent",
  children,
  ...props
}: ChatMessageBubbleProps) {
  const showMeta = Boolean(time)

  return (
    <div
      data-slot="chat-message-bubble"
      data-variant={variant}
      data-delivery-state={deliveryState}
      className={cn(
        "inline-block max-w-[88%] rounded-[var(--wm-size-20)] font-brand text-[length:var(--wm-size-16)] leading-5 text-[color:var(--wm-color-text-primary)] sm:max-w-[80%]",
        bubbleVariantClass[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-end gap-2">
        <span>{children}</span>
        {showMeta ? (
          <span className="inline-flex shrink-0 items-center gap-1 self-end whitespace-nowrap font-brand text-[length:var(--wm-size-14)] leading-[var(--wm-size-14)] text-[color:var(--text-bubble-meta)]">
            <span>{time}</span>
            {variant === "sent" ? (
              <span
                aria-label={deliveryState === "read" ? "Leido" : "Enviado"}
                className={cn(
                  "inline-flex items-center leading-none",
                  deliveryState === "read" ? "text-[color:var(--action-primary)]" : "text-[color:var(--delivery-sent)]"
                )}
              >
                <WallapopIcon name="double_check" size={13} strokeWidth={1.9} />
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  )
}


const designSystemMeta = {
    id: "chat-message-bubble",
    entityType: "component",
    title: "Chat Message Bubble",
    description: "Chat Message Bubble del design system de Wallapop Meet.",
    status: "ready",
    states: ["sent","received","read"],
    storybookTitle: "Design System/Chat Message Bubble",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { ChatMessageBubble, designSystemMeta }
