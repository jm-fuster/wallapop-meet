import * as React from "react"

import { cn } from "@/lib/utils"
import { WallapopIcon } from "@/components/ui/wallapop-icon"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type ChatSecurityBannerProps = React.ComponentProps<"div"> & {
  message: string
  linkText?: string
  onLinkClick?: () => void
  showIcon?: boolean
}

function ChatSecurityBanner({
  className,
  message,
  linkText,
  onLinkClick,
  showIcon = true,
  ...props
}: ChatSecurityBannerProps) {
  return (
    <div
      data-slot="chat-security-banner"
      className={cn("w-full bg-[color:var(--bg-base)] px-4 pt-4 pb-2", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        {showIcon ? (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--wm-size-8)] bg-[color:var(--bg-surface)]">
            <WallapopIcon name="shield" size="small" className="text-[color:var(--action-primary)]" />
          </span>
        ) : null}
        <p className="font-wallie text-[length:var(--wm-size-12)] leading-[var(--wm-size-18)] text-[color:var(--text-security)]">
          {message}{" "}
          {linkText ? (
            <button
              type="button"
              onClick={onLinkClick}
              className="font-wallie-fit text-[length:var(--wm-size-12)] leading-4 text-[color:var(--action-link)] underline"
            >
              {linkText}
            </button>
          ) : null}
        </p>
      </div>
    </div>
  )
}


const designSystemMeta = {
    id: "chat-security-banner",
    entityType: "component",
    title: "Chat Security Banner",
    description: "Chat Security Banner del design system de Wallapop Meet.",
    status: "ready",
    states: ["default"],
    storybookTitle: "Design System/Chat Security Banner",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { ChatSecurityBanner, designSystemMeta }
