import * as React from "react"
import { CircleAlert, CircleCheck, Star, TriangleAlert } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type ChatCounterpartCardProps = React.ComponentProps<"article"> & {
    name: string
    rating: number
    ratingCount?: number
    distanceLabel: string
    attendanceRate?: number
    attendanceMeetups?: number
    profileImageSrc?: string
    profileImageAlt?: string
}

function StarRating({ rating, ratingCount }: { rating: number; ratingCount?: number }) {
    const stars = [1, 2, 3, 4, 5]

    return (
        <div className="flex items-center gap-2" aria-label={`${rating}/5 estrellas`}>
            <div className="flex items-center gap-0.5 text-[color:var(--wm-color-text-primary)]">
                {stars.map((value) => {
                    const full = rating >= value
                    const half = !full && rating >= value - 0.5

                    if (full) {
                        return <Star key={value} size={16} className="fill-current" />
                    }

                    if (half) {
                        return (
                            <span key={value} className="relative inline-flex h-4 w-4">
                                <Star
                                    size={16}
                                    className="absolute inset-0 text-[color:var(--wm-color-border-default)]"
                                />
                                <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                                    <Star size={16} className="fill-current text-[color:var(--wm-color-text-primary)]" />
                                </span>
                            </span>
                        )
                    }

                    return (
                        <Star key={value} size={16} className="text-[color:var(--wm-color-border-default)]" />
                    )
                })}
            </div>
            {typeof ratingCount === "number" && ratingCount > 0 ? (
                <span className="font-brand-text text-[length:var(--wm-size-14)] text-[color:var(--wm-color-text-secondary)]">
                    ({ratingCount})
                </span>
            ) : null}
        </div>
    )
}

function ChatCounterpartCard({
    className,
    name,
    rating,
    ratingCount,
    distanceLabel,
    attendanceRate,
    attendanceMeetups,
    profileImageSrc,
    profileImageAlt,
    ...props
}: ChatCounterpartCardProps) {
    const hasNoAttendanceHistory = attendanceMeetups === 0
    const hasAttendanceData =
        typeof attendanceRate === "number" &&
        Number.isFinite(attendanceRate) &&
        typeof attendanceMeetups === "number" &&
        attendanceMeetups > 0
    const resolvedAttendanceRate = hasAttendanceData
        ? Math.max(0, Math.min(100, Math.round(attendanceRate)))
        : null

    const attendanceMessage: { text: string; className: string; Icon?: LucideIcon } | null =
        hasNoAttendanceHistory
            ? {
                  text: "Sin nivel de fiabilidad aún (0 quedadas)",
                  className: "text-[color:var(--wm-color-text-secondary)]",
              }
            : resolvedAttendanceRate === null
              ? null
            : resolvedAttendanceRate > 90
              ? {
                    text: `${resolvedAttendanceRate}% de asistencia (${attendanceMeetups})`,
                    className: "text-[color:var(--feedback-success-strong)]",
                    Icon: CircleCheck,
                }
              : resolvedAttendanceRate >= 70
                ? {
                      text: `${resolvedAttendanceRate}% de asistencia (${attendanceMeetups})`,
                      className: "text-[color:var(--feedback-warning-strong)]",
                      Icon: TriangleAlert,
                  }
                : {
                      text: "Baja asistencia a quedadas",
                      className: "text-[color:var(--feedback-error-strong)]",
                      Icon: CircleAlert,
                  }

    return (
        <article
            data-slot="chat-counterpart-card"
            className={cn("rounded-[var(--wm-size-12)] bg-[color:var(--bg-base)] p-4", className)}
            {...props}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate font-brand-strong text-[length:var(--wm-size-16)] text-[color:var(--wm-color-text-primary)]">
                        {name}
                    </h3>
                    <div className="mt-2">
                        <StarRating rating={rating} ratingCount={ratingCount} />
                    </div>
                    <p className="mt-2 font-brand-text text-[length:var(--wm-size-14)] text-[color:var(--wm-color-text-secondary)]">
                        {distanceLabel}
                    </p>
                    {attendanceMessage ? (
                        <p className={`mt-1 flex items-center gap-1 font-brand-text text-[length:var(--wm-size-14)] ${attendanceMessage.className}`}>
                            {attendanceMessage.Icon ? (
                                <attendanceMessage.Icon size={14} className="shrink-0" aria-hidden />
                            ) : null}
                            <span>{attendanceMessage.text}</span>
                        </p>
                    ) : null}
                </div>
                {profileImageSrc ? (
                    <img
                        src={profileImageSrc}
                        alt={profileImageAlt ?? `Foto de perfil de ${name}`}
                        className="h-[var(--wm-size-60)] w-[var(--wm-size-60)] rounded-full object-cover"
                    />
                ) : null}
            </div>
        </article>
    )
}


const designSystemMeta = {
    id: "chat-counterpart-card",
    entityType: "component",
    title: "Chat Counterpart Card",
    description: "Chat Counterpart Card del design system de Wallapop Meet.",
    status: "ready",
    states: ["high", "medium", "low", "sin_nivel", "zero_ratings"],
    storybookTitle: "Design System/Chat Counterpart Card",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { ChatCounterpartCard, designSystemMeta }
