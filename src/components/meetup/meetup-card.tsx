import * as React from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Label, type LabelTone } from "@/components/ui/label"
import { NoticeBanner } from "@/components/ui/notice-banner"
import { WallapopIcon } from "@/components/ui/wallapop-icon"
import {
    resolveArrivalActionState,
    resolveMeetupCardCtaIds,
    type MeetupCardCtaId,
} from "@/components/meetup/meetup-ui-rules"
import { WalletTopUpSheet } from "@/components/meetup/wallet-top-up-sheet"
import L from "leaflet"
import type { LucideIcon } from "lucide-react"
import {
    Banknote,
    CheckCircle2,
    CircleDashed,
    Clock,
    Handshake,
    MapPin,
    QrCode,
    XCircle,
} from "lucide-react"
import QRCode from "react-qr-code"
import { buildWalletInPersonPayPayload, deriveWalletDisplayCode } from "@/meetup/wallet-payment-qr"
import { MapContainer, Marker, TileLayer } from "react-leaflet"
import { getArrivalWindow } from "@/meetup/arrival-window"
import { transitionMeetup } from "@/meetup/state-machine"
import type { ActorRole, MeetupMachine, MeetupEvent, MeetupPaymentMethod } from "@/meetup/types"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type MeetupCardProps = {
    meetup: MeetupMachine
    actorRole: ActorRole
    currentTime: Date
    onMeetupChange: (next: MeetupMachine) => void
    onError: (message: string) => void
    counterpartName?: string
    onEditProposal?: () => void
    onOpenMapPreview?: () => void
    onRedZoneCancelConfirmed?: () => void
    useLiveMapThumbnail?: boolean
    /** Distancia estimada al punto de encuentro; si es mayor a 100 m, se bloquea "Estoy aquí" y se muestra el aviso de proximidad. */
    distanceToMeetupMeters?: number | null
    /** Saldo disponible en Wallapop Wallet del comprador (para aceptar quedada con pago Wallet). */
    buyerWalletAvailableEur?: number
    onWalletTopUp?: (amountEur: number) => void
}

type CardAction = {
    id: string
    label: React.ReactNode
    variant: "primary" | "inline_action" | "critical" | "outline" | "ghost" | "status_sold_solid"
    run: () => void
    disabled?: boolean
    className?: string
    fullWidth?: boolean
    ariaLabel?: string
}

const RED_ZONE_CANCELLATION_MINUTES = 30
const NO_SHOW_GRACE_MINUTES = 5

type StatusPill = {
    label: string
    tone: LabelTone
    Icon: LucideIcon
}

function statusPill(meetup: MeetupMachine): StatusPill {
    const { status } = meetup
    switch (status) {
        case "PROPOSED":
            return {
                label: "pendiente",
                tone: "pending",
                Icon: Clock,
            }
        case "COUNTER_PROPOSED":
            return {
                label: "pendiente",
                tone: "pending",
                Icon: Clock,
            }
        case "CONFIRMED":
            return {
                label: "confirmada",
                tone: "confirmed",
                Icon: CheckCircle2,
            }
        case "ARRIVED":
            return {
                label: "has llegado",
                tone: "arrived",
                Icon: MapPin,
            }
        case "COMPLETED":
            return {
                label: "completada",
                tone: "completed",
                Icon: Handshake,
            }
        case "CANCELLED":
            return {
                label: "cancelada",
                tone: "cancelled",
                Icon: XCircle,
            }
        default:
            return {
                label: "sin propuesta",
                tone: "pending",
                Icon: CircleDashed,
            }
    }
}

function formatScheduledAt(value: Date): string {
    const datePart = value.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
    })
    const timePart = value.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
    })
    return `${datePart} \u00B7 ${timePart}`
}

function formatMessageTime(value: Date): string {
    return value.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
    })
}

function buildStaticMapThumbnailUrl(lat: number, lng: number): string {
    return `${lat.toFixed(6)},${lng.toFixed(6)}`
}

function formatIcsDate(value: Date): string {
    const iso = value.toISOString().replace(/[-:]/g, "")
    return iso.replace(/\.\d{3}Z$/, "Z")
}

function buildGoogleCalendarUrl(meetup: MeetupMachine): string {
    const startAt = meetup.scheduledAt
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000)
    const location = meetup.proposedLocation ?? "Punto por confirmar"

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: "Quedada Wallapop Meet",
        dates: `${formatIcsDate(startAt)}/${formatIcsDate(endAt)}`,
        location,
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function createMiniMapMarkerIcon(): L.DivIcon {
    return L.divIcon({
        className: "wm-map-marker-icon",
        html: `
        <span class="wm-map-marker-shell">
            <span class="wm-map-marker-bubble wm-map-marker-bubble-sm wm-map-marker-primary">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m11 17 2 2a1 1 0 1 0 3-3"></path>
                    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path>
                    <path d="m21 3 1 11h-2"></path>
                    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path>
                    <path d="M3 4h8"></path>
                </svg>
            </span>
            <svg viewBox="0 0 14 8" width="14" height="8" class="wm-map-marker-tail" aria-hidden="true">
                <path d="M1 0H13L7 7Z" class="wm-map-marker-tail-fill"></path>
                <path d="M1 0L7 7L13 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        </span>
    `,
        iconSize: [34, 33],
        iconAnchor: [17, 32],
    })
}

function paymentMethodLabel(method: MeetupPaymentMethod): string {
    switch (method) {
        case "CASH":
            return "Efectivo"
        case "WALLET":
            return "Wallapop Wallet"
        default:
            return method
    }
}

function PaymentMethodIcon({ method }: { method: MeetupPaymentMethod | undefined }) {
    if (method === "WALLET") {
        return <QrCode size={16} className="text-[color:var(--text-primary)]" aria-hidden />
    }
    return <Banknote size={16} className="text-[color:var(--text-primary)]" aria-hidden />
}

function WalletInPersonQr({ value }: { value: string }) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [dimension, setDimension] = React.useState(0)

    React.useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) {
            return
        }
        const measure = () => {
            const next = el.getBoundingClientRect().width
            if (next > 0) {
                setDimension(Math.floor(next))
            }
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return (
        <div
            ref={containerRef}
            className="mx-auto aspect-square w-full max-w-[var(--wm-size-180)] rounded-[var(--wm-size-8)] bg-[color:var(--bg-qr)] p-2"
        >
            {dimension > 0 ? (
                <QRCode
                    value={value}
                    size={dimension}
                    level="M"
                    title="Código QR de pago con Wallapop Wallet"
                    className="h-full w-full"
                />
            ) : null}
        </div>
    )
}

function MeetupCard({
    meetup,
    actorRole,
    currentTime,
    onMeetupChange,
    onError,
    counterpartName,
    onEditProposal,
    onOpenMapPreview,
    onRedZoneCancelConfirmed,
    useLiveMapThumbnail = true,
    distanceToMeetupMeters,
    buyerWalletAvailableEur,
    onWalletTopUp,
}: MeetupCardProps) {
    const arrivalAction = resolveArrivalActionState(
        meetup,
        currentTime,
        actorRole,
        distanceToMeetupMeters
    )
    const minutesToMeetup = Math.floor(
        (meetup.scheduledAt.getTime() - currentTime.getTime()) / (60 * 1000)
    )
    const isRedZoneCancellation =
        minutesToMeetup >= 0 && minutesToMeetup <= RED_ZONE_CANCELLATION_MINUTES
    const arrivalWindow = getArrivalWindow(meetup.scheduledAt)
    const isCalendarFallbackWindow =
        currentTime.getTime() >= arrivalWindow.opensAt.getTime() &&
        currentTime.getTime() <= arrivalWindow.closesAt.getTime()
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)
    const [isNoShowSheetOpen, setIsNoShowSheetOpen] = React.useState(false)
    const [isWalletTopUpOpen, setIsWalletTopUpOpen] = React.useState(false)
    const [isWalletQrDialogOpen, setIsWalletQrDialogOpen] = React.useState(false)
    const [noShowGraceError, setNoShowGraceError] = React.useState("")
    const miniMapMarkerIcon = React.useMemo(() => createMiniMapMarkerIcon(), [])

    const applyEvent = (event: MeetupEvent) => {
        const normalized: MeetupEvent =
            event.type === "ACCEPT"
                ? {
                      ...event,
                      buyerWalletAvailableEur:
                          typeof buyerWalletAvailableEur === "number"
                              ? buyerWalletAvailableEur
                              : (event.buyerWalletAvailableEur ?? 0),
                  }
                : event
        const result = transitionMeetup(meetup, normalized)
        if (!result.ok) {
            onError(result.reason)
            return
        }
        onError("")
        onMeetupChange(result.meetup)
    }

    const finalPriceEur = meetup.finalPrice
    const walletAcceptPending =
        meetup.proposedPaymentMethod === "WALLET" &&
        typeof finalPriceEur === "number" &&
        finalPriceEur > 0 &&
        (meetup.status === "PROPOSED" || meetup.status === "COUNTER_PROPOSED")

    const buyerIsAcceptingWallet =
        walletAcceptPending &&
        ((meetup.status === "PROPOSED" && actorRole === "BUYER") ||
            (meetup.status === "COUNTER_PROPOSED" && actorRole === "SELLER"))

    const walletShortfallEur =
        buyerIsAcceptingWallet && typeof finalPriceEur === "number"
            ? Math.max(
                  0,
                  finalPriceEur -
                      (typeof buyerWalletAvailableEur === "number" ? buyerWalletAvailableEur : 0)
              )
            : 0

    const walletAcceptBlocked =
        buyerIsAcceptingWallet &&
        typeof finalPriceEur === "number" &&
        (typeof buyerWalletAvailableEur !== "number" || buyerWalletAvailableEur < finalPriceEur)

    const actions: CardAction[] = []
    const PRIMARY_ACTION_CLASS =
        "h-10 w-full font-wallie-chunky text-[length:var(--wm-size-16)]"
    const OUTLINE_ACTION_CLASS =
        "h-10 w-full rounded-[var(--wm-size-999)] border-[color:var(--action-link)] bg-[color:var(--bg-base)] font-wallie-chunky text-[length:var(--wm-size-16)] text-[color:var(--action-link)] hover:bg-[color:var(--bg-surface)]"
    const TEXT_ACTION_CLASS =
        "h-auto border-transparent bg-transparent px-0 py-1 font-wallie-chunky text-[length:var(--wm-size-16)] text-[color:var(--text-secondary)] underline underline-offset-2 hover:bg-transparent hover:text-[color:var(--text-primary)]"

    const runCancel = () => {
        setIsCancelModalOpen(true)
    }

    const confirmCancellation = () => {
        setIsCancelModalOpen(false)
        applyEvent({
            type: "CANCEL",
            actorRole,
            occurredAt: currentTime,
            reason: "MANUAL_CANCEL",
        })
        if (isRedZoneCancellation) {
            onRedZoneCancelConfirmed?.()
        }
    }

    const noShowGraceEndsAt = new Date(meetup.scheduledAt.getTime() + NO_SHOW_GRACE_MINUTES * 60 * 1000)
    const canReportNoShow = currentTime.getTime() >= noShowGraceEndsAt.getTime()
    const hasContradictionAlert =
        meetup.status === "ARRIVED" && Boolean(meetup.noShowReport?.contradictionDetected)

    const showNoShowGraceError = () => {
        setNoShowGraceError("Debes dar al menos 5 minutos de cortesia antes de reportar no-show.")
        window.setTimeout(() => {
            setNoShowGraceError("")
        }, 3000)
    }

    const openNoShowFlow = () => {
        if (!canReportNoShow) {
            showNoShowGraceError()
            return
        }
        setIsNoShowSheetOpen(true)
    }

    const confirmNoShowFlow = () => {
        setIsNoShowSheetOpen(false)
        if (hasContradictionAlert) {
            applyEvent({
                type: "CONFIRM_NO_SHOW_FINAL",
                actorRole,
                occurredAt: currentTime,
            })
            return
        }
        applyEvent({
            type: "REPORT_NO_SHOW",
            actorRole,
            occurredAt: currentTime,
        })
    }

    const addToCalendar = () => {
        if (typeof window === "undefined") {
            onError("No se pudo abrir el calendario en este entorno.")
            return
        }

        window.open(buildGoogleCalendarUrl(meetup), "_blank", "noopener")
    }

    const ctaIds = resolveMeetupCardCtaIds({
        meetup,
        currentTime,
        actorRole,
        hasEditProposalAction: Boolean(onEditProposal),
        distanceToMeetupMeters,
    })

    const actionFromCtaId = (ctaId: MeetupCardCtaId): CardAction | null => {
        switch (ctaId) {
            case "propose":
                return {
                    id: "propose",
                    label: "Enviar propuesta",
                    variant: "primary",
                    run: () =>
                        applyEvent({
                            type: "PROPOSE",
                            actorRole,
                            occurredAt: currentTime,
                        }),
                    className: PRIMARY_ACTION_CLASS,
                    fullWidth: true,
                }
            case "edit":
                return onEditProposal
                    ? {
                          id: "edit",
                          label: "Editar",
                          variant: "outline",
                          run: onEditProposal,
                          className: OUTLINE_ACTION_CLASS,
                          fullWidth: true,
                      }
                    : null
            case "accept":
                return {
                    id: "accept",
                    label: "Aceptar",
                    variant: "primary",
                    run: () => {
                        if (
                            walletAcceptBlocked &&
                            actorRole === "BUYER" &&
                            onWalletTopUp &&
                            typeof finalPriceEur === "number"
                        ) {
                            onError("")
                            setIsWalletTopUpOpen(true)
                            return
                        }
                        applyEvent({
                            type: "ACCEPT",
                            actorRole,
                            occurredAt: currentTime,
                        })
                    },
                    className: `${PRIMARY_ACTION_CLASS} rounded-[var(--wm-size-999)] bg-[color:var(--action-primary)] text-[color:var(--text-on-action)] shadow-[var(--wm-shadow-inset-cta)]`,
                    fullWidth: true,
                }
            case "counter":
                return {
                    id: "counter",
                    label: "Proponer cambios",
                    variant: "outline",
                    run: onEditProposal
                        ? onEditProposal
                        : () =>
                              applyEvent({
                                  type: "COUNTER_PROPOSE",
                                  actorRole,
                                  occurredAt: currentTime,
                              }),
                    className: OUTLINE_ACTION_CLASS,
                    fullWidth: true,
                }
            case "reject":
                return {
                    id: "reject",
                    label: "Rechazar quedada",
                    variant: "ghost",
                    run: runCancel,
                    className: TEXT_ACTION_CLASS,
                    fullWidth: true,
                }
            case "accept-counter":
                return {
                    id: "accept-counter",
                    label: "Aceptar contraoferta",
                    variant: "primary",
                    run: () => {
                        if (walletAcceptBlocked && actorRole === "SELLER") {
                            onError(
                                "El comprador necesita saldo en Wallapop Wallet para confirmar. Podra recargar el monedero desde su cuenta."
                            )
                            return
                        }
                        applyEvent({
                            type: "ACCEPT",
                            actorRole,
                            occurredAt: currentTime,
                        })
                    },
                    className: PRIMARY_ACTION_CLASS,
                    fullWidth: true,
                }
            case "repropose":
                return {
                    id: "repropose",
                    label: "Reenviar propuesta",
                    variant: "outline",
                    run: () =>
                        applyEvent({
                            type: "PROPOSE",
                            actorRole,
                            occurredAt: currentTime,
                        }),
                    className: OUTLINE_ACTION_CLASS,
                    fullWidth: true,
                }
            case "arrived":
                return {
                    id: "arrived",
                    label: "Estoy aquí",
                    variant: "primary",
                    run: () =>
                        applyEvent({
                            type: "MARK_ARRIVED",
                            actorRole,
                            occurredAt: currentTime,
                        }),
                    disabled: !arrivalAction.enabled,
                    className: PRIMARY_ACTION_CLASS,
                    fullWidth: true,
                }
            case "calendar":
                return {
                    id: "calendar",
                    label: "Añadir a Calendar",
                    variant: "outline",
                    run: addToCalendar,
                    className: OUTLINE_ACTION_CLASS,
                    fullWidth: true,
                }
            case "wallet-scan-sale": {
                const scanLabel = `Escanear código QR de ${counterpartName ?? "el comprador"}`
                return {
                    id: "wallet-scan-sale",
                    label: (
                        <span className="inline-flex w-full items-center justify-center gap-2">
                            <QrCode size={18} className="shrink-0" aria-hidden />
                            <span className="text-center">{scanLabel}</span>
                        </span>
                    ),
                    variant: "status_sold_solid",
                    run: () =>
                        applyEvent({
                            type: "COMPLETE",
                            actorRole,
                            occurredAt: currentTime,
                        }),
                    className:
                        "h-auto min-h-10 w-full rounded-[var(--wm-size-999)] border-transparent px-4 py-2.5 font-wallie-chunky text-[length:var(--wm-size-16)] leading-snug",
                    fullWidth: true,
                    ariaLabel: scanLabel,
                }
            }
            case "complete":
                return {
                    id: "complete",
                    label: "Confirmar venta",
                    variant: "primary",
                    run: () =>
                        applyEvent({
                            type: "COMPLETE",
                            actorRole,
                            occurredAt: currentTime,
                        }),
                    className: `${PRIMARY_ACTION_CLASS} bg-[color:var(--status-sold)] hover:bg-[color:var(--status-sold-hover)] active:bg-[color:var(--status-sold-pressed)]`,
                    fullWidth: true,
                }
            case "no-show":
                return {
                    id: "no-show",
                    label: hasContradictionAlert ? "Definitivamente no está" : "El comprador no ha aparecido",
                    variant: "ghost",
                    run: openNoShowFlow,
                    className: TEXT_ACTION_CLASS,
                    fullWidth: true,
                }
            case "cancel":
                return {
                    id: "cancel",
                    label: "Cancelar quedada",
                    variant: "ghost",
                    run: runCancel,
                    className: TEXT_ACTION_CLASS,
                    fullWidth: true,
                }
            default:
                return null
        }
    }

    for (const ctaId of ctaIds) {
        const action = actionFromCtaId(ctaId)
        if (action) {
            actions.push(action)
        }
    }

    const paymentMethodValue = meetup.proposedPaymentMethod
        ? paymentMethodLabel(meetup.proposedPaymentMethod)
        : "Sin metodo"
    const formattedPrice =
        meetup.finalPrice !== undefined ? `${meetup.finalPrice.toFixed(2)} \u20AC` : "sin precio"
    const currentStatusPill = statusPill(meetup)
    const StatusPillIcon = currentStatusPill.Icon
    const title = `Quedada con ${counterpartName ?? "usuario"}`
    const isPendingActionStatus = meetup.status === "PROPOSED" || meetup.status === "COUNTER_PROPOSED"
    const sentAt = meetup.proposedAt ?? meetup.confirmedAt ?? meetup.cancelledAt ?? null
    const primaryActions = actions.filter((action) => action.variant !== "ghost")
    const footerAction = actions.find((action) => action.variant === "ghost")
    const hasMapCoordinates =
        typeof meetup.proposedLocationLat === "number" &&
        typeof meetup.proposedLocationLng === "number"
    const mapThumbnailCenter =
        typeof meetup.proposedLocationLat === "number" && typeof meetup.proposedLocationLng === "number"
            ? buildStaticMapThumbnailUrl(meetup.proposedLocationLat, meetup.proposedLocationLng)
            : ""
    const mapThumbnailPosition = mapThumbnailCenter
        ? (mapThumbnailCenter.split(",").map(Number) as [number, number])
        : null
    const shouldRenderLiveMapThumbnail =
        useLiveMapThumbnail && hasMapCoordinates && mapThumbnailPosition !== null
    const showBuyerWalletQrButton =
        actorRole === "BUYER" &&
        meetup.proposedPaymentMethod === "WALLET" &&
        meetup.status === "ARRIVED" &&
        Boolean(meetup.arrivalCheckins?.BUYER)
    const walletInPersonQrPayload = buildWalletInPersonPayPayload(meetup)
    const walletDisplayCode = deriveWalletDisplayCode(meetup)
    const showWalletEducationBanner =
        actorRole === "BUYER" &&
        meetup.proposedPaymentMethod === "WALLET" &&
        (meetup.status === "PROPOSED" || meetup.status === "COUNTER_PROPOSED")
    return (
        <>
            <section className="relative w-full max-w-[var(--wm-size-360)] rounded-[var(--wm-size-20)] border border-[color:var(--border-bubble)] bg-[color:var(--bg-base)] px-4 pb-3 pt-3">
            <button
                type="button"
                className="wm-mini-map relative mb-3 h-[var(--wm-size-88)] w-full overflow-hidden rounded-[var(--wm-size-16)] border border-[color:var(--border-strong)] bg-[color:var(--bg-accent-subtle)] text-left [contain:paint]"
                onClick={onOpenMapPreview}
            >
                {shouldRenderLiveMapThumbnail ? (
                    <div className="h-full w-full [pointer-events:none]">
                        <MapContainer
                            center={mapThumbnailPosition}
                            zoom={15}
                            className="h-full w-full"
                            attributionControl={false}
                            zoomControl={false}
                            dragging={false}
                            touchZoom={false}
                            doubleClickZoom={false}
                            scrollWheelZoom={false}
                            keyboard={false}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={mapThumbnailPosition} icon={miniMapMarkerIcon} />
                        </MapContainer>
                    </div>
                ) : (
                    <div className="flex h-full w-full items-center justify-center gap-2 px-3 text-[color:var(--text-primary)]">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--bg-base)]">
                            <MapPin size={14} />
                        </span>
                        <span className="truncate font-wallie-fit text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]">
                            {meetup.proposedLocation || "Ver ubicacion del punto de encuentro"}
                        </span>
                    </div>
                )}
            </button>

            <div className="flex items-center gap-2.5">
                <p className="font-wallie-chunky text-[length:var(--wm-size-18)] leading-[1.1] text-[color:var(--text-primary)]">
                    {title}
                </p>
                <Label
                    tone={isPendingActionStatus ? "pending" : currentStatusPill.tone}
                    className="items-center gap-1"
                >
                    <StatusPillIcon className="size-[var(--wm-size-12)] shrink-0" aria-hidden />
                    {currentStatusPill.label}
                </Label>
            </div>

            <dl className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2.5">
                    <dt className="inline-flex items-center justify-center text-[color:var(--text-primary)]">
                        <WallapopIcon name="calendar" size={14} />
                    </dt>
                    <dd className="font-wallie-fit text-[length:var(--wm-size-13)] text-[color:var(--text-primary)]">
                        {formatScheduledAt(meetup.scheduledAt)}
                    </dd>
                </div>
                <div className="flex items-center gap-2.5">
                    <dt className="inline-flex items-center justify-center text-[color:var(--text-primary)]">
                        <MapPin size={14} />
                    </dt>
                    <dd className="font-wallie-fit text-[length:var(--wm-size-13)] text-[color:var(--text-primary)]">
                        {meetup.proposedLocation || "Calle sin definir"}
                    </dd>
                </div>
                <div className="flex items-center gap-2.5">
                    <dt className="inline-flex items-center justify-center text-[color:var(--text-primary)]">
                        <PaymentMethodIcon method={meetup.proposedPaymentMethod} />
                    </dt>
                    <dd className="font-wallie-fit text-[length:var(--wm-size-13)] text-[color:var(--text-primary)]">
                        {paymentMethodValue} {" \u00B7 "}
                        <span className="font-wallie-chunky text-[color:var(--text-primary)]">
                            {formattedPrice}
                        </span>
                    </dd>
                </div>
            </dl>

            {showWalletEducationBanner ? (
                <NoticeBanner
                    tone="success"
                    className="mt-3 rounded-[var(--wm-size-12)] px-3 py-2 text-[length:var(--wm-size-12)] leading-[1.45]"
                >
                    Tu dinero, 100% a salvo con Wallapop Wallet. Es la forma más segura de pagar y cobrar en persona. El dinero se
                    guarda de forma segura en la app y solo se transfiere cuando escaneáis el código QR durante la quedada. Olvídate
                    de llevar efectivo y haz el trato con total tranquilidad.
                </NoticeBanner>
            ) : null}

            {showBuyerWalletQrButton ? (
                <div className="mt-4">
                    <Button
                        type="button"
                        variant="status_sold_solid"
                        size="md"
                        onClick={() => setIsWalletQrDialogOpen(true)}
                        className="h-auto min-h-10 w-full rounded-[var(--wm-size-999)] border-transparent px-4 py-2.5 font-wallie-chunky text-[length:var(--wm-size-16)] leading-snug"
                        aria-label="Mostrar código QR"
                    >
                        <span className="inline-flex w-full items-center justify-center gap-2">
                            <QrCode size={18} className="shrink-0" aria-hidden />
                            <span className="text-center">Mostrar código QR</span>
                        </span>
                    </Button>
                </div>
            ) : null}

            {meetup.status === "CONFIRMED" &&
            isCalendarFallbackWindow &&
            arrivalAction.proximityRequiredMessage.length > 0 ? (
                <NoticeBanner className="mt-3 rounded-[var(--wm-size-12)] px-3 py-2 text-[length:var(--wm-size-12)]">
                    {arrivalAction.proximityRequiredMessage}
                </NoticeBanner>
            ) : null}
            {hasContradictionAlert ? (
                <NoticeBanner className="mt-3 rounded-[var(--wm-size-12)] px-3 py-2 text-[length:var(--wm-size-12)] text-[color:var(--feedback-error)]">
                    El radar indica que {counterpartName ?? "el comprador"} esta muy cerca. Escribidle o llamadle para encontraros.
                </NoticeBanner>
            ) : null}

            {primaryActions.length > 0 ? (
                <div className="mt-4 space-y-2">
                    {primaryActions.map((action) => (
                        <Button
                            key={action.id}
                            variant={action.variant}
                            size={action.variant === "status_sold_solid" ? "md" : "sm"}
                            onClick={action.run}
                            disabled={action.disabled}
                            aria-label={action.ariaLabel}
                            className={`${action.fullWidth ? "w-full" : ""} ${action.className ?? ""}`.trim()}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            ) : null}

            {footerAction ? (
                <div className="mt-1 flex min-h-8 items-center justify-center">
                    <Button
                        variant={footerAction.variant}
                        size="sm"
                        onClick={footerAction.run}
                        disabled={footerAction.disabled}
                        className={`${footerAction.className} text-center`}
                    >
                        {footerAction.label}
                    </Button>
                </div>
            ) : null}
            {noShowGraceError ? (
                <p className="mt-2 text-center font-wallie-fit text-[length:var(--wm-size-12)] text-[color:var(--feedback-error)]">
                    {noShowGraceError}
                </p>
            ) : null}
            {sentAt ? (
                <p className="absolute bottom-3 right-4 text-right font-wallie-fit text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]">
                    {formatMessageTime(sentAt)}
                </p>
            ) : null}
            </section>
            {isCancelModalOpen && typeof document !== "undefined"
                ? createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay-scrim)] px-4">
                        <div className="w-full max-w-[var(--wm-size-420)] rounded-[var(--wm-size-16)] bg-[color:var(--bg-base)] p-4 shadow-[var(--wm-shadow-300)]">
                            <h3 className="font-wallie-chunky text-[length:var(--wm-size-18)] text-[color:var(--text-primary)]">
                                Seguro que quieres cancelar o rechazar la quedada?
                            </h3>
                            <p className="mt-2 font-wallie-fit text-[length:var(--wm-size-14)] text-[color:var(--text-secondary)]">
                                Esta accion no se puede deshacer.
                            </p>
                            {isRedZoneCancellation ? (
                                <NoticeBanner className="mt-2 py-2">
                                    Estas en los ultimos 30 min y esto afectara a tu fiabilidad.
                                </NoticeBanner>
                            ) : null}
                            <div className="mt-4 space-y-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className={PRIMARY_ACTION_CLASS}
                                    onClick={confirmCancellation}
                                >
                                    Si
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={OUTLINE_ACTION_CLASS}
                                    onClick={() => setIsCancelModalOpen(false)}
                                >
                                    No
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null}
            {isNoShowSheetOpen && typeof document !== "undefined"
                ? createPortal(
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color:var(--overlay-scrim)]">
                        <div className="w-full max-w-[var(--wm-size-560)] rounded-t-[var(--wm-size-20)] bg-[color:var(--bg-base)] p-4 shadow-[var(--wm-shadow-300)]">
                            <h3 className="font-wallie-chunky text-[length:var(--wm-size-18)] text-[color:var(--text-primary)]">
                                Confirmar no-show del comprador?
                            </h3>
                            <p className="mt-2 font-wallie-fit text-[length:var(--wm-size-14)] text-[color:var(--text-secondary)]">
                                Esta accion cancela la quedada y libera el articulo.
                            </p>
                            <div className="mt-4 space-y-2">
                                <Button
                                    variant="critical"
                                    size="sm"
                                    className={PRIMARY_ACTION_CLASS}
                                    onClick={confirmNoShowFlow}
                                >
                                    {hasContradictionAlert ? "Definitivamente no está" : "Confirmar no-show"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={OUTLINE_ACTION_CLASS}
                                    onClick={() => setIsNoShowSheetOpen(false)}
                                >
                                    Volver
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null}
            {isWalletQrDialogOpen && typeof document !== "undefined"
                ? createPortal(
                      <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay-scrim)] px-4"
                          role="presentation"
                          onClick={() => setIsWalletQrDialogOpen(false)}
                      >
                          <div
                              role="dialog"
                              aria-modal="true"
                              aria-labelledby="wallet-qr-dialog-title"
                              className="w-full max-w-[var(--wm-size-360)] rounded-[var(--wm-size-16)] bg-[color:var(--bg-base)] p-4 shadow-[var(--wm-shadow-300)]"
                              onClick={(event) => event.stopPropagation()}
                          >
                              <h3
                                  id="wallet-qr-dialog-title"
                                  className="font-wallie-chunky text-[length:var(--wm-size-18)] text-[color:var(--text-primary)]"
                              >
                                  Pago con Wallapop Wallet
                              </h3>
                              <p className="mt-2 font-wallie-fit text-[length:var(--wm-size-13)] leading-[1.45] text-[color:var(--text-secondary)]">
                                  Muestra este código al vendedor para que lo escanee y complete el cobro.
                              </p>
                              <div className="mt-4 flex justify-center rounded-[var(--wm-size-12)] bg-[color:var(--bg-surface)] p-4">
                                  <WalletInPersonQr value={walletInPersonQrPayload} />
                              </div>
                              <p className="mt-4 text-center font-wallie-chunky text-[length:var(--wm-size-22)] tracking-[0.2em] text-[color:var(--text-primary)]">
                                  {walletDisplayCode}
                              </p>
                              <p className="mt-1 text-center font-wallie-fit text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]">
                                  Código de verificación
                              </p>
                              <div className="mt-4">
                                  <Button
                                      type="button"
                                      variant="primary"
                                      size="sm"
                                      className={PRIMARY_ACTION_CLASS}
                                      onClick={() => setIsWalletQrDialogOpen(false)}
                                  >
                                      Cerrar
                                  </Button>
                              </div>
                          </div>
                      </div>,
                      document.body
                  )
                : null}
            {onWalletTopUp ? (
                <WalletTopUpSheet
                    open={isWalletTopUpOpen}
                    onClose={() => setIsWalletTopUpOpen(false)}
                    minSuggestedAmountEur={Math.max(walletShortfallEur, 5)}
                    onConfirmTopUp={(amountEur) => {
                        onWalletTopUp(amountEur)
                    }}
                />
            ) : null}
        </>
    )
}


const designSystemMeta = {
    id: "meetup-card",
    entityType: "component",
    title: "Meetup Card",
    description:
        "Tarjeta de quedada en hilo de chat: titulo fijo, chip de estado (`Label` + icono Lucide segun `statusPill`), tres filas de datos (calendario, ubicacion, pago), mini mapa y CTAs por estado/rol. Wallapop Wallet: banner educativo verde solo en propuesta pendiente (`PROPOSED`/`COUNTER_PROPOSED`); sin banner de saldo apartado en card; comprador en `ARRIVED` con llegada marcada y pago Wallet: CTA `Mostrar codigo QR` que abre dialog con QR (`WalletInPersonQr`) y codigo de 6 digitos; vendedor en `ARRIVED` con Wallet: CTA escaneo tipo vendido. Recarga monedero via `WalletTopUpSheet` si falta saldo al aceptar. Iconos del chip: Clock pendiente, CheckCircle2 confirmada, MapPin has llegado, Handshake completada (alineado con `WallapopIcon` deal), XCircle cancelada, CircleDashed sin propuesta.",
    status: "ready",
    states: [
        "pending",
        "confirmed",
        "thirty_minutes_before",
        "arrival",
        "wallet_qr_dialog",
        "cancelled",
        "completed",
    ],
    storybookTitle: "Design System/Meetup Card",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { MeetupCard, designSystemMeta }
