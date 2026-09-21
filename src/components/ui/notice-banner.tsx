import * as React from "react"

import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type NoticeBannerTone = "warning" | "success"

type NoticeBannerProps = React.ComponentProps<"p"> & {
    tone?: NoticeBannerTone
}

const toneClassName: Record<NoticeBannerTone, string> = {
    warning:
        "border border-[color:var(--border-warning-subtle)] bg-[color:var(--bg-warning-subtle)] text-[color:var(--feedback-warning-strong)]",
    success:
        "border border-[color:var(--border-success-subtle)] bg-[color:var(--bg-accent-subtle)] text-[color:var(--text-primary)]",
}

function NoticeBanner({ className, tone = "warning", ...props }: NoticeBannerProps) {
    return (
        <p
            className={cn(
                "rounded-[var(--wm-size-8)] px-2 py-1 font-brand-text text-[length:var(--wm-size-13)]",
                toneClassName[tone],
                className
            )}
            {...props}
        />
    )
}


const designSystemMeta = {
    id: "notice-banner",
    entityType: "component",
    title: "Notice Banner",
    description: "Notice Banner del design system de Wallapop Meet.",
    status: "ready",
    states: ["warning","success"],
    storybookTitle: "Design System/Notice Banner",
    tokensUsed: [
        "tokens.color.semantic.background.accent_subtle",
        "tokens.color.semantic.text.primary",
        "tokens.color.semantic.warning.base",
        "tokens.color.semantic.feedback.success",
    ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { NoticeBanner, designSystemMeta }
export type { NoticeBannerProps, NoticeBannerTone }
