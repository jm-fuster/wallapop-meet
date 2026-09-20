import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type ChatListItemLeadingIndicator = "bookmark" | "deal" | "pending_sale"
type ChatListItemDeliveryState = "sent" | "read"

type ChatListItemProps = React.ComponentProps<"button"> & {
  userName: string
  messageDate: string
  itemTitle: string
  messagePreview: string
  unreadCount?: number
  avatarSrc?: string
  avatarAlt?: string
  selected?: boolean
  showDivider?: boolean
  leadingIndicator?: ChatListItemLeadingIndicator
  lastMessageDeliveryState?: ChatListItemDeliveryState
}

function ChatListItem({
  className,
  userName,
  messageDate,
  itemTitle,
  messagePreview,
  unreadCount = 0,
  avatarSrc,
  avatarAlt,
  selected = false,
  showDivider = true,
  leadingIndicator,
  lastMessageDeliveryState,
  ...props
}: ChatListItemProps) {
  const isPendingSaleIndicator = leadingIndicator === "pending_sale"
  const indicatorIconName = leadingIndicator === "bookmark" ? "bookmark" : "deal"
  const leadingIndicatorColorClass =
    leadingIndicator === "bookmark"
      ? "text-[color:var(--status-reserved)]"
      : leadingIndicator === "deal"
        ? "text-[color:var(--status-sold)]"
        : "text-[color:var(--text-inverse)]"

  return (
    <button
      type="button"
      data-slot="chat-list-item"
      data-selected={selected}
      className={cn(
        "relative flex h-[var(--wm-size-100)] w-full cursor-pointer items-start gap-3 border-0 bg-transparent pl-5 pt-5 pr-3 pb-5 text-left",
        showDivider && "border-b border-[color:var(--wm-color-border-default)]",
        "transition-colors hover:bg-[color:var(--wm-color-background-surface)] data-[selected=true]:bg-[color:var(--wm-color-background-surface)]",
        "data-[selected=true]:before:absolute data-[selected=true]:before:inset-y-0 data-[selected=true]:before:left-0 data-[selected=true]:before:w-[var(--wm-size-2)] data-[selected=true]:before:bg-[color:var(--action-primary)] data-[selected=true]:before:content-['']",
        className
      )}
      {...props}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-visible rounded-[var(--wm-size-16)] bg-[color:var(--wm-color-border-default)]">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={avatarAlt ?? userName}
            className="h-full w-full rounded-[var(--wm-size-16)] object-cover"
          />
        ) : null}
        {leadingIndicator ? (
          <span
            className={cn(
              "absolute -top-2 -left-2 z-10 inline-flex size-8 items-center justify-center rounded-full",
              isPendingSaleIndicator
                ? "bg-[color:var(--action-primary)]"
                : "border border-[color:var(--border-divider)] bg-[color:var(--bg-base)]",
              leadingIndicatorColorClass
            )}
            aria-hidden="true"
          >
            <WallapopIcon name={indicatorIconName} size={15} strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-wallie text-[length:var(--wm-size-12)] leading-[var(--wm-size-18)] text-[color:var(--text-meta)]">
            {userName}
          </p>
          <p className="shrink-0 font-wallie text-[length:var(--wm-size-12)] leading-[var(--wm-size-18)] text-[color:var(--text-meta)]">
            {messageDate}
          </p>
        </div>
        <p className="truncate font-wallie-chunky text-[length:var(--wm-size-16)] leading-[var(--wm-size-16)] text-[color:var(--wm-color-text-primary)]">
          {itemTitle}
        </p>
        <div className="mt-1 flex min-h-6 items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 font-wallie text-[length:var(--wm-size-14)] leading-[var(--wm-size-14)] text-[color:var(--text-meta)]">
            {lastMessageDeliveryState ? (
              <span
                aria-label={lastMessageDeliveryState === "read" ? "Leido" : "Enviado"}
                className={cn(
                  "inline-flex shrink-0 items-center leading-none",
                  lastMessageDeliveryState === "read" ? "text-[color:var(--action-primary)]" : "text-[color:var(--delivery-sent)]"
                )}
              >
                <WallapopIcon name="double_check" size={13} strokeWidth={1.9} />
              </span>
            ) : null}
            <span className="min-w-0 truncate">{messagePreview}</span>
          </p>
          <Badge value={unreadCount} variant="unread" />
        </div>
      </div>
    </button>
  )
}


const designSystemMeta = {
    id: "chat-list-item",
    entityType: "component",
    title: "Chat List Item",
    description: "Chat List Item del design system de Wallapop Meet.",
    status: "ready",
    states: ["unselected","selected"],
    storybookTitle: "Design System/Chat List Item",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { ChatListItem, designSystemMeta }
