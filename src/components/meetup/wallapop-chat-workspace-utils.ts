import { isMeetupExpired, transitionMeetup } from "@/meetup/state-machine"

import type { MeetupMachine } from "@/meetup/types"

type MapPoint = {
    lat: number
    lng: number
}

export type ExpiredMeetupTransition = {
    conversationId: string
    previous: MeetupMachine
    next: MeetupMachine
}

/**
 * Identidad de un vencimiento concreto. Sirve para no aplicarlo dos veces: React invoca
 * los efectos dos veces en StrictMode, y sin esta marca el saldo retenido se devolveria
 * por duplicado. Incluye `proposedAt` porque volver a proponer tras una cancelacion
 * reutiliza el mismo `id`, y ese vencimiento posterior si es uno nuevo.
 */
export function buildMeetupExpiryKey(conversationId: string, meetup: MeetupMachine): string {
    return [
        conversationId,
        meetup.id,
        meetup.status ?? "NONE",
        meetup.proposedAt?.getTime() ?? 0,
        meetup.scheduledAt.getTime(),
    ].join("|")
}

/**
 * Quedadas que ya no pueden avanzar y que el sistema debe cerrar. `EXPIRE` no lo dispara
 * ninguna de las dos partes: una propuesta caduca a su hora y una quedada confirmada al
 * cerrarse la ventana de llegada. Devuelve la transicion sin aplicarla para que quien
 * llama decida como escribirla en el estado.
 */
export function collectExpiredMeetups(
    meetupByConversation: Record<string, MeetupMachine[]>,
    now: Date
): ExpiredMeetupTransition[] {
    const expired: ExpiredMeetupTransition[] = []

    for (const [conversationId, history] of Object.entries(meetupByConversation)) {
        const current = history?.[history.length - 1]
        if (!current || !isMeetupExpired(current, now)) {
            continue
        }

        const result = transitionMeetup(current, { type: "EXPIRE", occurredAt: now })
        if (result.ok) {
            expired.push({ conversationId, previous: current, next: result.meetup })
        }
    }

    return expired
}

/** Saldo de Wallet que vuelve al comprador al cerrarse estas quedadas sin completarse. */
export function sumReleasedWalletHoldEur(transitions: ExpiredMeetupTransition[]): number {
    return transitions.reduce(
        (total, { previous }) =>
            total + (typeof previous.walletHoldAmountEur === "number" ? previous.walletHoldAmountEur : 0),
        0
    )
}

type ShouldApplyReverseGeocodeResultInput = {
    requestId: number
    latestRequestId: number
    requestedPoint: MapPoint
    currentPoint: MapPoint | null
    responseAddress: string | undefined
}

export function resolveProposalScheduledAtValue(meetup: MeetupMachine): string {
    const year = meetup.scheduledAt.getFullYear()
    const month = String(meetup.scheduledAt.getMonth() + 1).padStart(2, "0")
    const day = String(meetup.scheduledAt.getDate()).padStart(2, "0")
    const hours = String(meetup.scheduledAt.getHours()).padStart(2, "0")
    const minutes = String(meetup.scheduledAt.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

function roundDateToNearestQuarterHour(value: Date): Date {
    const rounded = new Date(value)
    rounded.setSeconds(0, 0)
    const minutes = rounded.getMinutes()
    const roundedMinutes = Math.round(minutes / 15) * 15
    if (roundedMinutes === 60) {
        rounded.setHours(rounded.getHours() + 1, 0, 0, 0)
        return rounded
    }
    rounded.setMinutes(roundedMinutes, 0, 0)
    return rounded
}

export function resolveInitialProposalDateTimeValue(meetup: MeetupMachine): string {
    if (meetup.status === null) {
        return ""
    }
    const roundedMeetup: MeetupMachine = {
        ...meetup,
        scheduledAt: roundDateToNearestQuarterHour(meetup.scheduledAt),
    }
    return resolveProposalScheduledAtValue(roundedMeetup)
}

/**
 * Clave con la que se guarda y se lee un hilo en Convex. Los identificadores de conversacion
 * del demo (`conv-a-arrival` y companyia) son constantes compartidas: usados tal cual, todo
 * el mundo escribia y leia el mismo hilo, asi que cualquier visitante veia lo que habian
 * tecleado los demas. Anteponer el identificador local del visitante da a cada uno su propio
 * espacio de nombres.
 */
export function buildConvexConversationKey(
    localChatUserId: string,
    conversationId: string
): string {
    return `${localChatUserId}/${conversationId}`
}

export function buildReverseGeocodeUrl(point: MapPoint): string {
    const lat = encodeURIComponent(String(point.lat))
    const lng = encodeURIComponent(String(point.lng))
    return `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
}

function arePointsEquivalent(first: MapPoint, second: MapPoint): boolean {
    const epsilon = 0.00001
    return (
        Math.abs(first.lat - second.lat) <= epsilon &&
        Math.abs(first.lng - second.lng) <= epsilon
    )
}

export function shouldApplyReverseGeocodeResult({
    requestId,
    latestRequestId,
    requestedPoint,
    currentPoint,
    responseAddress,
}: ShouldApplyReverseGeocodeResultInput): boolean {
    if (requestId !== latestRequestId) {
        return false
    }
    if (!currentPoint) {
        return false
    }
    if (!responseAddress || responseAddress.trim().length === 0) {
        return false
    }
    return arePointsEquivalent(requestedPoint, currentPoint)
}
