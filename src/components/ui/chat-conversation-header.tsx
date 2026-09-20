import * as React from "react"
import { MapPin, Star } from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type ChatConversationHeaderProps = React.ComponentProps<"header"> & {
    backButtonLabel?: string
    onBack?: () => void
    itemImageSrc?: string
    itemImageAlt: string
    itemPrice: string
    itemTitle: string
    profileImageSrc?: string
    profileImageAlt: string
    userName: string
    rating?: number
    distanceLabel?: string
    attendanceRate?: number
    attendanceMeetups?: number
    productStatusIcon?: "bookmark" | "deal" | "pending_sale"
    menuLabel?: string
    onMenuClick?: () => void
    expanded?: boolean
    defaultExpanded?: boolean
    onExpandedChange?: (nextExpanded: boolean) => void
}

function StarRating({ rating }: { rating?: number }) {
    const resolvedRating =
        typeof rating === "number" && Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0
    const fullStars = Math.floor(resolvedRating)

    return (
        <div className="flex items-center gap-1 text-[color:var(--text-primary)]" aria-label={`${resolvedRating}/5 estrellas`}>
            {[0, 1, 2, 3, 4].map((value) => (
                <Star
                    key={value}
                    size={16}
                    className={cn(value < fullStars ? "fill-current" : "text-[color:var(--border-strong)]")}
                />
            ))}
        </div>
    )
}

function resolveAttendanceMessage(attendanceRate?: number, attendanceMeetups?: number): {
    text: string
    className: string
} | null {
    const hasAttendanceData =
        typeof attendanceRate === "number" &&
        Number.isFinite(attendanceRate) &&
        typeof attendanceMeetups === "number" &&
        attendanceMeetups > 0

    if (!hasAttendanceData) {
        return null
    }

    const resolvedAttendanceRate = Math.max(0, Math.min(100, Math.round(attendanceRate)))

    if (resolvedAttendanceRate > 90) {
        return {
            text: `${resolvedAttendanceRate}% de asistencia (${attendanceMeetups})`,
            className: "text-[color:var(--wm-color-input-ring-success)]",
        }
    }

    if (resolvedAttendanceRate >= 70) {
        return {
            text: `${resolvedAttendanceRate}% de asistencia (${attendanceMeetups})`,
            className: "text-[color:var(--feedback-warning)]",
        }
    }

    return {
        text: "Baja asistencia a quedadas",
        className: "text-[color:var(--wm-color-semantic-error)]",
    }
}

function ProductImage({
    src,
    alt,
    className,
    statusIcon,
    statusIconPosition = "top-left",
}: {
    src?: string
    alt: string
    className: string
    statusIcon?: "bookmark" | "deal" | "pending_sale"
    statusIconPosition?: "top-left" | "center"
}) {
    const isPendingSaleStatusIcon = statusIcon === "pending_sale"
    const statusIconColor =
        statusIcon === "bookmark"
            ? "text-[color:var(--status-reserved)]"
            : statusIcon === "deal"
                ? "text-[color:var(--status-sold)]"
                : "text-[color:var(--text-inverse)]"

    return (
        <div className={cn("relative overflow-hidden rounded-[var(--wm-size-8)]", className)}>
            {src ? (
                <img src={src} alt={alt} className="h-full w-full object-cover" />
            ) : (
                <div className="h-full w-full bg-[color:var(--bg-surface)]" aria-hidden />
            )}
            {statusIcon ? (
                <span
                    className={cn(
                        "absolute inline-flex h-8 w-8 items-center justify-center rounded-full",
                        isPendingSaleStatusIcon
                            ? "bg-[color:var(--action-primary)]"
                            : "border border-[color:var(--border-divider)] bg-[color:var(--bg-base)]",
                        statusIconColor,
                        statusIconPosition === "center" ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "left-2 top-2"
                    )}
                >
                    <WallapopIcon name={statusIcon === "pending_sale" ? "deal" : statusIcon} size={14} />
                </span>
            ) : null}
        </div>
    )
}

function ChatConversationHeader({
    className,
    backButtonLabel = "Volver a conversaciones",
    onBack,
    itemImageSrc,
    itemImageAlt,
    itemPrice,
    itemTitle,
    profileImageSrc,
    profileImageAlt,
    userName,
    rating,
    distanceLabel,
    attendanceRate,
    attendanceMeetups,
    productStatusIcon,
    menuLabel,
    onMenuClick,
    expanded,
    defaultExpanded = false,
    onExpandedChange,
    ...props
}: ChatConversationHeaderProps) {
    const isControlled = typeof expanded === "boolean"
    const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded)
    const isExpanded = isControlled ? expanded : uncontrolledExpanded

    const toggleExpanded = React.useCallback(() => {
        const nextExpanded = !isExpanded
        if (!isControlled) {
            setUncontrolledExpanded(nextExpanded)
        }
        onExpandedChange?.(nextExpanded)
    }, [isControlled, isExpanded, onExpandedChange])

    const attendanceMessage = resolveAttendanceMessage(attendanceRate, attendanceMeetups)

    return (
        <header
            className={cn(
                "border-b border-[color:var(--border-divider)] bg-[color:var(--bg-base)] px-4 pt-3 pb-3",
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none",
                    isExpanded ? "pointer-events-none max-h-0 opacity-0" : "max-h-[var(--wm-size-180)] opacity-100"
                )}
            >
                <div className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-x-3">
                    {onBack ? (
                        <IconButton
                            label={backButtonLabel}
                            icon={<WallapopIcon name="arrow_left" size={20} />}
                            variant="menu_close"
                            onClick={onBack}
                            className="h-9 w-9 bg-transparent p-0 text-[color:var(--text-primary)] sm:h-10 sm:w-10"
                        />
                    ) : (
                        <span className="h-9 w-9 sm:h-10 sm:w-10" aria-hidden />
                    )}

                    <button
                        type="button"
                        className="grid min-w-0 grid-cols-[var(--wm-size-42)_1fr_var(--wm-size-34)] items-start gap-x-3 text-left"
                        onClick={toggleExpanded}
                        aria-expanded={false}
                        aria-label={`Mostrar detalles del chat con ${userName}`}
                    >
                        <ProductImage
                            src={itemImageSrc}
                            alt={itemImageAlt}
                            statusIcon={productStatusIcon}
                            statusIconPosition="center"
                            className="h-[var(--wm-size-42)] w-[var(--wm-size-42)]"
                        />
                        <div className="min-w-0">
                            <p className="truncate font-wallie-chunky text-[length:var(--wm-size-19)] leading-[var(--wm-size-21)] text-[color:var(--text-primary)]">
                                {itemPrice}
                            </p>
                            <p className="truncate pt-0.5 font-wallie-fit text-[length:var(--wm-size-15)] leading-[var(--wm-size-19)] text-[color:var(--text-primary)]">
                                {itemTitle}
                            </p>
                        </div>
                        {profileImageSrc ? (
                            <img
                                src={profileImageSrc}
                                alt={profileImageAlt}
                                className="h-[var(--wm-size-34)] w-[var(--wm-size-34)] rounded-full border border-[color:var(--border-strong)] object-cover"
                            />
                        ) : (
                            <div
                                className="h-[var(--wm-size-34)] w-[var(--wm-size-34)] rounded-full border border-[color:var(--border-strong)] bg-[color:var(--bg-surface)]"
                                aria-hidden
                            />
                        )}
                    </button>

                    <IconButton
                        label={menuLabel ?? `Mas opciones de la conversacion con ${userName}`}
                        icon={<WallapopIcon name="ellipsis_horizontal" size={20} strokeWidth={1.8} />}
                        variant="menu_close"
                        onClick={onMenuClick}
                        className="h-9 w-9 rounded-full bg-transparent p-0 text-[color:var(--text-tertiary)] hover:bg-[color:var(--bg-surface)] sm:h-10 sm:w-10"
                    />
                </div>
            </div>

            <div
                className={cn(
                    "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none",
                    isExpanded ? "max-h-[var(--wm-size-460)] opacity-100" : "pointer-events-none max-h-0 opacity-0"
                )}
            >
                <div className="mb-2 flex items-center justify-between">
                    {onBack ? (
                        <IconButton
                            label={backButtonLabel}
                            icon={<WallapopIcon name="arrow_left" size={20} />}
                            variant="menu_close"
                            onClick={onBack}
                            className="h-9 w-9 bg-transparent p-0 text-[color:var(--text-primary)] sm:h-10 sm:w-10"
                        />
                    ) : (
                        <span className="h-9 w-9 sm:h-10 sm:w-10" aria-hidden />
                    )}

                    <IconButton
                        label={menuLabel ?? `Mas opciones de la conversacion con ${userName}`}
                        icon={<WallapopIcon name="ellipsis_horizontal" size={20} strokeWidth={1.8} />}
                        variant="menu_close"
                        onClick={onMenuClick}
                        className="h-9 w-9 rounded-full bg-transparent p-0 text-[color:var(--text-tertiary)] hover:bg-[color:var(--bg-surface)] sm:h-10 sm:w-10"
                    />
                </div>

                <button
                    type="button"
                    className="grid w-full grid-cols-[var(--wm-size-110)_1fr] gap-x-3 text-left"
                    onClick={toggleExpanded}
                    aria-expanded={true}
                    aria-label={`Ocultar detalles del chat con ${userName}`}
                >
                    <ProductImage
                        src={itemImageSrc}
                        alt={itemImageAlt}
                        statusIcon={productStatusIcon}
                        className={cn(
                            "row-span-2 self-stretch transition-[width,height,transform] duration-500 ease-in-out motion-reduce:transition-none",
                            isExpanded
                                ? "h-full w-[var(--wm-size-110)] scale-100"
                                : "h-[var(--wm-size-42)] w-[var(--wm-size-42)] scale-95"
                        )}
                    />

                    <div
                        className={cn(
                            "min-w-0 pb-1 transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
                            isExpanded ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <p className="truncate font-wallie-chunky text-[length:var(--wm-size-22)] leading-[var(--wm-size-24)] text-[color:var(--text-primary)]">
                            {itemPrice}
                        </p>
                        <p className="truncate pt-0.5 font-wallie-fit text-[length:var(--wm-size-16)] leading-[var(--wm-size-20)] text-[color:var(--text-primary)]">
                            {itemTitle}
                        </p>
                    </div>

                    <div
                        className={cn(
                            "relative min-w-0 border-t border-[color:var(--border-divider)] pt-1 transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
                            isExpanded ? "opacity-100" : "opacity-0"
                        )}
                    >
                        {profileImageSrc ? (
                            <img
                                src={profileImageSrc}
                                alt={profileImageAlt}
                                className="absolute top-1 right-0 h-[var(--wm-size-60)] w-[var(--wm-size-60)] rounded-full border border-[color:var(--border-strong)] object-cover"
                            />
                        ) : (
                            <div
                                className="absolute top-1 right-0 h-[var(--wm-size-60)] w-[var(--wm-size-60)] rounded-full border border-[color:var(--border-strong)] bg-[color:var(--bg-surface)]"
                                aria-hidden
                            />
                        )}
                        <div className="pr-[var(--wm-size-60)]">
                            <p className="truncate font-wallie-chunky text-[length:var(--wm-size-20)] leading-[var(--wm-size-21)] text-[color:var(--text-secondary)]">
                                {userName}
                            </p>
                        </div>
                        <div className="mt-0 pr-[var(--wm-size-60)] space-y-0">
                            {typeof rating === "number" ? <StarRating rating={rating} /> : null}
                            {distanceLabel ? (
                                <p className="flex items-center gap-2 truncate font-wallie-fit text-[length:var(--wm-size-16)] leading-[var(--wm-size-20)] text-[color:var(--text-secondary)]">
                                    <MapPin size={15} />
                                    {distanceLabel}
                                </p>
                            ) : null}
                            {attendanceMessage ? (
                                <p
                                    className={cn(
                                        "truncate font-wallie-fit text-[length:var(--wm-size-16)] leading-[var(--wm-size-20)]",
                                        attendanceMessage.className
                                    )}
                                >
                                    {attendanceMessage.text}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </button>
            </div>
        </header>
    )
}


const designSystemMeta = {
    id: "chat-conversation-header",
    entityType: "component",
    title: "Chat Conversation Header",
    description: "Chat Conversation Header del design system de Wallapop Meet.",
    status: "ready",
    states: ["default","expanded"],
    storybookTitle: "Design System/Chat Conversation Header",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { ChatConversationHeader, type ChatConversationHeaderProps, designSystemMeta }
