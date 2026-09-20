import { isWithinArrivalWindow } from "@/meetup/arrival-window"
import type { ActorRole, MeetupMachine } from "@/meetup/types"

/** Distancia maxima al punto de encuentro para habilitar "Estoy aqui" (mismo umbral que el mensaje de proximidad). */
export const MEETUP_ARRIVAL_NEAR_METERS = 100

export type ArrivalActionState = {
    enabled: boolean
    /** Cuando el actor ya marco llegada y el CTA queda bloqueado por ese motivo. */
    message: string
    /** Solo si aun no estas a menos de {@link MEETUP_ARRIVAL_NEAR_METERS} m (boton bloqueado). Vacio cuando el boton ya esta activo. */
    proximityRequiredMessage: string
}

type MeetupDayBannerVariant = "hidden" | "upcoming" | "in_window"
type MeetupCardCtaId =
    | "propose"
    | "edit"
    | "accept"
    | "counter"
    | "reject"
    | "accept-counter"
    | "repropose"
    | "arrived"
    | "calendar"
    | "complete"
    | "wallet-scan-sale"
    | "no-show"
    | "cancel"

export function resolveArrivalActionState(
    meetup: MeetupMachine,
    currentTime: Date,
    actorRole?: ActorRole,
    distanceToMeetupMeters?: number | null
): ArrivalActionState {
    if (meetup.status !== "CONFIRMED" && meetup.status !== "ARRIVED") {
        return {
            enabled: false,
            message: "La accion de llegada solo aplica a meetups confirmados o en curso.",
            proximityRequiredMessage: "",
        }
    }

    const inWindow = isWithinArrivalWindow(meetup.scheduledAt, currentTime)
    if (!inWindow) {
        return {
            enabled: false,
            message: "",
            proximityRequiredMessage: "",
        }
    }

    if (actorRole && meetup.arrivalCheckins?.[actorRole]) {
        return {
            enabled: false,
            message: "Ya has marcado que has llegado.",
            proximityRequiredMessage: "",
        }
    }

    const isFar =
        typeof distanceToMeetupMeters === "number" &&
        distanceToMeetupMeters > MEETUP_ARRIVAL_NEAR_METERS

    if (isFar) {
        return {
            enabled: false,
            message: "",
            proximityRequiredMessage:
                "Acercate a menos de 100 metros del punto de encuentro para indicar que has llegado.",
        }
    }

    return {
        enabled: true,
        message: "",
        proximityRequiredMessage: "",
    }
}

export function resolveMeetupDayBannerVariant(
    meetup: MeetupMachine,
    currentTime: Date
): MeetupDayBannerVariant {
    if (meetup.status !== "CONFIRMED" && meetup.status !== "ARRIVED") {
        return "hidden"
    }

    return isWithinArrivalWindow(meetup.scheduledAt, currentTime)
        ? "in_window"
        : "upcoming"
}

export function resolveMeetupCardCtaIds(params: {
    meetup: MeetupMachine
    currentTime: Date
    actorRole: ActorRole
    hasEditProposalAction: boolean
    distanceToMeetupMeters?: number | null
}): MeetupCardCtaId[] {
    const { meetup, currentTime, actorRole, hasEditProposalAction, distanceToMeetupMeters } =
        params
    const actionIds: MeetupCardCtaId[] = []
    const inArrivalWindow = isWithinArrivalWindow(meetup.scheduledAt, currentTime)
    const arrivalAction = resolveArrivalActionState(
        meetup,
        currentTime,
        actorRole,
        distanceToMeetupMeters
    )

    if (meetup.status === null && actorRole === "SELLER") {
        actionIds.push("propose")
    }

    if (meetup.status === "PROPOSED" && actorRole === "BUYER") {
        actionIds.push("accept", "counter", "reject")
    }

    if (meetup.status === "COUNTER_PROPOSED" && actorRole === "SELLER") {
        actionIds.push("accept-counter", "repropose")
    }

    if (meetup.status === "CONFIRMED") {
        actionIds.push(inArrivalWindow ? "arrived" : "calendar")
    }

    if (meetup.status === "ARRIVED") {
        if (arrivalAction.enabled) {
            actionIds.push("arrived")
        }
        if (actorRole === "SELLER") {
            /** Reportar no-show exige haber marcado tu propia llegada: misma regla que la maquina. */
            const canReportNoShow = Boolean(meetup.arrivalCheckins?.SELLER)
            actionIds.push(
                meetup.proposedPaymentMethod === "WALLET"
                    ? "wallet-scan-sale"
                    : "complete"
            )
            if (canReportNoShow) {
                actionIds.push("no-show")
            }
        }
    }

    /*
     * El vendedor que ya ha marcado llegada TAMBIEN puede cancelar. Ocultarselo dejaba el
     * no-show como su unica salida, asi que un vendedor que se marcha acababa acusando al
     * comprador de no aparecer. Cancelar despues de la hora ya le deja su propia marca.
     * En PROPOSED el comprador no ve "cancel" porque su version se llama "reject", que
     * dispara el mismo evento.
     */
    const canShowCancel =
        meetup.status !== "COMPLETED" &&
        meetup.status !== "CANCELLED" &&
        meetup.status !== null &&
        !(meetup.status === "PROPOSED" && actorRole === "BUYER")

    if (canShowCancel) {
        actionIds.push("cancel")
    }

    const canEditProposal =
        hasEditProposalAction &&
        actorRole === "SELLER" &&
        (meetup.status === "PROPOSED" || meetup.status === "COUNTER_PROPOSED")

    if (canEditProposal) {
        actionIds.unshift("edit")
    }

    return actionIds
}

export type { MeetupCardCtaId }
