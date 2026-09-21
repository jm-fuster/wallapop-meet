import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { WallapopIcon, type WallapopIconName } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type InboxBottomNavIconName = Extract<
  WallapopIconName,
  "home" | "heart" | "plus" | "mail" | "user"
>

type InboxBottomNavItem = {
  id: string
  label: string
  icon: InboxBottomNavIconName
  badgeCount?: number
}

type InboxBottomNavProps = React.ComponentProps<"nav"> & {
  items?: InboxBottomNavItem[]
  activeItemId?: string
  onItemSelect?: (itemId: string) => void
}

const inboxBottomNavDefaultItems: InboxBottomNavItem[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "favorites", label: "Favoritos", icon: "heart" },
  { id: "sell", label: "Vender", icon: "plus" },
  { id: "inbox", label: "Buzón", icon: "mail" },
  { id: "profile", label: "Tu", icon: "user" },
]

function InboxBottomNav({
  className,
  items = inboxBottomNavDefaultItems,
  activeItemId = "inbox",
  onItemSelect,
  ...props
}: InboxBottomNavProps) {
  return (
    <nav
      data-slot="inbox-bottom-nav"
      aria-label="Navegacion principal"
      className={cn(
        "w-full border-t border-[color:var(--border-strong)] bg-[color:var(--bg-base)] px-2 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]",
        className
      )}
      {...props}
    >
      <ul className="flex items-stretch justify-between gap-0">
        {items.map((item) => {
          const isActive = item.id === activeItemId

          return (
            <li key={item.id} className="min-w-0 flex-1">
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-[var(--wm-size-60)] w-full flex-col items-center justify-center gap-0.5 px-0.5 text-center",
                  "focus-visible:ring-2 focus-visible:ring-[color:var(--wm-color-border-focus)] focus-visible:outline-none"
                )}
                onClick={() => onItemSelect?.(item.id)}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <WallapopIcon
                    name={item.icon}
                    size={20}
                    className={cn(isActive ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-tertiary)]")}
                    strokeWidth={1.9}
                  />
                </span>
                <span
                  className={cn(
                    "max-w-full whitespace-nowrap text-center font-brand text-[length:var(--wm-size-11)] leading-[var(--wm-size-14)]",
                    isActive ? "font-brand-strong text-[color:var(--text-primary)]" : "text-[color:var(--text-tertiary)]"
                  )}
                >
                  {item.label}
                </span>
                {item.badgeCount ? (
                  <Badge
                    value={item.badgeCount}
                    className="absolute top-0 right-[22%] min-h-[var(--wm-size-18)] min-w-[var(--wm-size-18)] text-[length:var(--wm-size-11)] leading-[var(--wm-size-16)]"
                  />
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


const designSystemMeta = {
    id: "inbox-bottom-nav",
    entityType: "component",
    title: "Inbox Bottom Nav",
    description: "Inbox Bottom Nav del design system de Wallapop Meet.",
    status: "ready",
    states: ["default"],
    storybookTitle: "Design System/Inbox Bottom Nav",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { InboxBottomNav, type InboxBottomNavItem, designSystemMeta }
