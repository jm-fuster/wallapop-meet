import { getArrivalWindow, isWithinArrivalWindow } from "@/meetup/arrival-window"
import type {
    CreateMeetupMachineInput,
    MeetupChatContext,
    MeetupEvent,
    MeetupMachine,
    MeetupReliabilityImpactType,
    TransitionResult,
} from "@/meetup/types"

function nowFallback(date?: Date): Date {
    return date ?? new Date()
}

function fail(reason: string): TransitionResult {
    return { ok: false, reason }
}

function success(meetup: MeetupMachine): TransitionResult {
    return { ok: true, meetup }
}

const RED_ZONE_CANCELLATION_MINUTES = 30
const NO_SHOW_GRACE_MINUTES = 5

let meetupSequence = 0

function createMeetupId(): string {
    meetupSequence += 1
    return `meetup-${meetupSequence}`
}

function isTerminalStatus(status: MeetupMachine["status"]): boolean {
    return status === "COMPLETED" || status === "CANCELLED"
}

/**
 * Momento a partir del cual la quedada ya no puede avanzar y el sistema la cierra.
 * Una propuesta caduca a la hora propuesta; una quedada confirmada o en curso caduca
 * al cerrarse la ventana de llegada. Devuelve null si no aplica (sin propuesta o ya cerrada).
 */
export function getMeetupExpiryAt(meetup: MeetupMachine): Date | null {
    if (meetup.status === null || isTerminalStatus(meetup.status)) {
        return null
    }

    if (meetup.status === "PROPOSED" || meetup.status === "COUNTER_PROPOSED") {
        return meetup.scheduledAt
    }

    return getArrivalWindow(meetup.scheduledAt).closesAt
}

export function isMeetupExpired(meetup: MeetupMachine, now: Date): boolean {
    const expiresAt = getMeetupExpiryAt(meetup)
    return expiresAt !== null && now.getTime() > expiresAt.getTime()
}

/**
 * Una cancelacion tardia deja marca. Despues de la hora acordada pesa mas que en la
 * zona roja, porque la otra parte ya esta en el punto. Las cancelaciones que dispara el
 * propio sistema al sustituir una propuesta por una contraoferta no cuentan.
 */
function resolveCancellationImpactType(
    minutesBeforeScheduled: number
): MeetupReliabilityImpactType | null {
    if (minutesBeforeScheduled < 0) {
        return "POST_TIME_CANCELLATION"
    }

    if (minutesBeforeScheduled <= RED_ZONE_CANCELLATION_MINUTES) {
        return "RED_ZONE_CANCELLATION"
    }

    return null
}

function isValidChatContextField(value: string): boolean {
    return value.trim().length > 0
}

function assertValidChatContext(chatContext: MeetupChatContext): void {
    const {
        conversationId,
        listingId,
        sellerUserId,
        buyerUserId,
    } = chatContext

    if (!isValidChatContextField(conversationId)) {
        throw new Error("conversationId es obligatorio para crear Wallapop Meet desde chat.")
    }

    if (!isValidChatContextField(listingId)) {
        throw new Error("listingId es obligatorio para crear Wallapop Meet desde chat.")
    }

    if (!isValidChatContextField(sellerUserId)) {
        throw new Error("sellerUserId es obligatorio para crear Wallapop Meet desde chat.")
    }

    if (!isValidChatContextField(buyerUserId)) {
        throw new Error("buyerUserId es obligatorio para crear Wallapop Meet desde chat.")
    }

    if (sellerUserId === buyerUserId) {
        throw new Error("sellerUserId y buyerUserId no pueden ser el mismo usuario.")
    }
}

export function createMeetupMachine({
    scheduledAt,
    chatContext,
}: CreateMeetupMachineInput): MeetupMachine {
    assertValidChatContext(chatContext)

    return {
        id: createMeetupId(),
        status: null,
        scheduledAt,
        chatContext,
    }
}

export function transitionMeetup(
    meetup: MeetupMachine,
    event: MeetupEvent
): TransitionResult {
    const canReproposeAfterCancellation =
        meetup.status === "CANCELLED" && event.type === "PROPOSE"

    if (isTerminalStatus(meetup.status) && !canReproposeAfterCancellation) {
        return fail(`No se permiten transiciones desde estado final ${meetup.status}.`)
    }

    switch (event.type) {
        case "PROPOSE": {
            if (event.actorRole !== "SELLER") {
                return fail("Solo el vendedor puede iniciar o reenviar propuesta.")
            }

            if (
                meetup.status !== null &&
                meetup.status !== "COUNTER_PROPOSED" &&
                meetup.status !== "CANCELLED"
            ) {
                return fail(
                    "PROPOSE solo es valido desde estado inicial, COUNTER_PROPOSED o CANCELLED."
                )
            }

            const isReproposalAfterCancellation = meetup.status === "CANCELLED"
            return success({
                ...meetup,
                status: "PROPOSED",
                proposedAt: nowFallback(event.occurredAt),
                cancelledAt: isReproposalAfterCancellation ? undefined : meetup.cancelledAt,
                cancelReason: isReproposalAfterCancellation ? undefined : meetup.cancelReason,
                confirmedAt: isReproposalAfterCancellation ? undefined : meetup.confirmedAt,
                arrivedAt: isReproposalAfterCancellation ? undefined : meetup.arrivedAt,
                completedAt: isReproposalAfterCancellation ? undefined : meetup.completedAt,
                walletHoldAmountEur: undefined,
                arrivalCheckins: isReproposalAfterCancellation
                    ? undefined
                    : meetup.arrivalCheckins,
                lateNotices: isReproposalAfterCancellation ? undefined : meetup.lateNotices,
                noShowReport: isReproposalAfterCancellation ? undefined : meetup.noShowReport,
            })
        }

        case "COUNTER_PROPOSE": {
            if (event.actorRole !== "BUYER") {
                return fail("Solo el comprador puede contraofertar.")
            }

            if (meetup.status !== "PROPOSED") {
                return fail("COUNTER_PROPOSED solo puede ocurrir desde PROPOSED.")
            }

            const nextOccurredAt = nowFallback(event.occurredAt)
            return success({
                ...meetup,
                id: createMeetupId(),
                status: "COUNTER_PROPOSED",
                proposedAt: nextOccurredAt,
                confirmedAt: undefined,
                arrivedAt: undefined,
                completedAt: undefined,
                cancelledAt: undefined,
                cancelReason: undefined,
                walletHoldAmountEur: undefined,
                arrivalCheckins: undefined,
                noShowReport: undefined,
                supersedesMeetupId: meetup.id,
            })
        }

        case "ACCEPT": {
            if (meetup.status === "PROPOSED" && event.actorRole !== "BUYER") {
                return fail("En PROPOSED solo el comprador puede aceptar.")
            }

            if (meetup.status === "COUNTER_PROPOSED" && event.actorRole !== "SELLER") {
                return fail("En COUNTER_PROPOSED solo el vendedor puede aceptar.")
            }

            if (meetup.status !== "PROPOSED" && meetup.status !== "COUNTER_PROPOSED") {
                return fail("ACCEPT solo es valido desde PROPOSED o COUNTER_PROPOSED.")
            }

            const price = meetup.finalPrice
            const paymentMethod = meetup.proposedPaymentMethod
            if (
                paymentMethod === "WALLET" &&
                typeof price === "number" &&
                price > 0
            ) {
                if (
                    typeof event.buyerWalletAvailableEur !== "number" ||
                    event.buyerWalletAvailableEur < price
                ) {
                    return fail(
                        "Saldo insuficiente en Wallapop Wallet para aceptar esta quedada. Recarga el monedero para continuar."
                    )
                }
                return success({
                    ...meetup,
                    status: "CONFIRMED",
                    confirmedAt: nowFallback(event.occurredAt),
                    walletHoldAmountEur: price,
                })
            }

            return success({
                ...meetup,
                status: "CONFIRMED",
                confirmedAt: nowFallback(event.occurredAt),
                walletHoldAmountEur: undefined,
            })
        }

        case "MARK_ARRIVED": {
            if (meetup.status !== "CONFIRMED" && meetup.status !== "ARRIVED") {
                return fail("MARK_ARRIVED solo es valido desde CONFIRMED o ARRIVED.")
            }

            if (!isWithinArrivalWindow(meetup.scheduledAt, event.occurredAt)) {
                return fail(
                    "La accion de llegada solo es valida entre 30 minutos antes y 2 horas despues."
                )
            }

            if (meetup.arrivalCheckins?.[event.actorRole]) {
                return fail("Este actor ya ha marcado llegada para esta quedada.")
            }

            const nextCheckins = {
                ...(meetup.arrivalCheckins ?? {}),
                [event.actorRole]: {
                    occurredAt: event.occurredAt,
                    distanceMeters: event.distanceMeters,
                    withinSafeRadius: event.withinSafeRadius,
                },
            } satisfies MeetupMachine["arrivalCheckins"]

            return success({
                ...meetup,
                status: "ARRIVED",
                arrivedAt: meetup.arrivedAt ?? event.occurredAt,
                arrivalCheckins: nextCheckins,
            })
        }

        case "LATE_NOTICE": {
            if (meetup.status !== "CONFIRMED" && meetup.status !== "ARRIVED") {
                return fail("LATE_NOTICE solo es valido desde CONFIRMED o ARRIVED.")
            }

            const occurredAt = nowFallback(event.occurredAt)
            return success({
                ...meetup,
                lateNotices: [
                    ...(meetup.lateNotices ?? []),
                    {
                        actorRole: event.actorRole,
                        etaMinutes: event.etaMinutes,
                        occurredAt,
                    },
                ],
            })
        }

        case "COMPLETE": {
            if (meetup.status !== "ARRIVED") {
                return fail("COMPLETE solo es valido desde ARRIVED.")
            }

            if (event.actorRole !== "SELLER") {
                return fail("Solo el vendedor puede confirmar la venta.")
            }

            return success({
                ...meetup,
                status: "COMPLETED",
                completedAt: nowFallback(event.occurredAt),
                walletHoldAmountEur: undefined,
            })
        }

        case "CANCEL": {
            if (meetup.status === null) {
                return fail("No existe una propuesta activa para cancelar.")
            }

            const cancelledAt = nowFallback(event.occurredAt)
            const cancelReason = event.reason ?? "MANUAL_CANCEL"
            const minutesBeforeScheduled = Math.floor(
                (meetup.scheduledAt.getTime() - cancelledAt.getTime()) / (60 * 1000)
            )
            const impactType =
                cancelReason === "COUNTER_REPLACED"
                    ? null
                    : resolveCancellationImpactType(minutesBeforeScheduled)

            return success({
                ...meetup,
                status: "CANCELLED",
                cancelledAt,
                cancelReason,
                walletHoldAmountEur: undefined,
                reliabilityImpacts: impactType
                    ? [
                          ...(meetup.reliabilityImpacts ?? []),
                          {
                              type: impactType,
                              actorRole: event.actorRole,
                              minutesBeforeScheduled,
                              occurredAt: cancelledAt,
                          },
                      ]
                    : meetup.reliabilityImpacts,
            })
        }

        case "REPORT_NO_SHOW": {
            if (event.actorRole !== "SELLER") {
                return fail("Solo el vendedor puede reportar no-show.")
            }

            if (meetup.status !== "ARRIVED") {
                return fail("REPORT_NO_SHOW solo es valido desde ARRIVED.")
            }

            if (!meetup.arrivalCheckins?.SELLER) {
                return fail(
                    "Para reportar no-show tienes que haber marcado tu propia llegada al punto de encuentro."
                )
            }

            const graceEndsAt = new Date(meetup.scheduledAt.getTime() + NO_SHOW_GRACE_MINUTES * 60 * 1000)
            if (event.occurredAt.getTime() < graceEndsAt.getTime()) {
                return fail("Debes esperar al menos 5 minutos de cortesia tras la hora de quedada.")
            }

            const buyerCheckin = meetup.arrivalCheckins?.BUYER
            const contradictionDetected = Boolean(
                buyerCheckin && (buyerCheckin.withinSafeRadius ?? false)
            )

            if (contradictionDetected) {
                return success({
                    ...meetup,
                    noShowReport: {
                        reportedBy: "SELLER",
                        reportedAt: event.occurredAt,
                        graceEndsAt,
                        contradictionDetected: true,
                        buyerWasMarkedArrived: true,
                    },
                })
            }

            return success({
                ...meetup,
                status: "CANCELLED",
                cancelledAt: event.occurredAt,
                cancelReason: "NO_SHOW_BUYER",
                walletHoldAmountEur: undefined,
                noShowReport: {
                    reportedBy: "SELLER",
                    reportedAt: event.occurredAt,
                    graceEndsAt,
                    contradictionDetected: false,
                    buyerWasMarkedArrived: false,
                },
            })
        }

        case "CONFIRM_NO_SHOW_FINAL": {
            if (event.actorRole !== "SELLER") {
                return fail("Solo el vendedor puede confirmar no-show final.")
            }

            if (meetup.status !== "ARRIVED") {
                return fail("CONFIRM_NO_SHOW_FINAL solo es valido desde ARRIVED.")
            }

            if (!meetup.noShowReport?.contradictionDetected) {
                return fail("No existe contradiccion activa para confirmar no-show final.")
            }

            return success({
                ...meetup,
                status: "CANCELLED",
                cancelledAt: event.occurredAt,
                cancelReason: "NO_SHOW_FINAL_CONTRADICTION",
                walletHoldAmountEur: undefined,
                noShowReport: {
                    ...meetup.noShowReport,
                    reportedAt: meetup.noShowReport.reportedAt,
                },
            })
        }

        case "EXPIRE": {
            if (meetup.status === null) {
                return fail("No existe una propuesta activa que pueda caducar.")
            }

            if (!isMeetupExpired(meetup, event.occurredAt)) {
                return fail("La quedada todavia puede avanzar: aun no ha caducado.")
            }

            const expiredAsProposal =
                meetup.status === "PROPOSED" || meetup.status === "COUNTER_PROPOSED"

            /*
             * Caducar no reparte culpa. Al cerrarse la ventana sin confirmacion no se
             * puede saber si nadie aparecio o si se vieron y olvidaron cerrar la venta,
             * asi que no se registra impacto de fiabilidad: para eso existe el no-show,
             * que es una accion explicita y contrastable.
             */
            return success({
                ...meetup,
                status: "CANCELLED",
                cancelledAt: event.occurredAt,
                cancelReason: expiredAsProposal ? "PROPOSAL_EXPIRED" : "MEETUP_EXPIRED",
                walletHoldAmountEur: undefined,
            })
        }

        default: {
            return fail("Evento no soportado.")
        }
    }
}
