import { describe, expect, it } from "vitest"

import {
    buildMeetupExpiryKey,
    collectExpiredMeetups,
    sumReleasedWalletHoldEur,
} from "@/components/meetup/wallapop-chat-workspace-utils"
import { createMeetupMachine, transitionMeetup } from "@/meetup"
import type { MeetupChatContext, MeetupMachine } from "@/meetup/types"

const chatContext: MeetupChatContext = {
    conversationId: "conv-expiry-001",
    listingId: "listing-expiry-001",
    sellerUserId: "user-seller-expiry",
    buyerUserId: "user-buyer-expiry",
}

const SCHEDULED_AT = new Date("2026-02-20T18:00:00.000Z")

function buildProposed(): MeetupMachine {
    const base = createMeetupMachine({ scheduledAt: SCHEDULED_AT, chatContext })
    const result = transitionMeetup(base, {
        type: "PROPOSE",
        actorRole: "SELLER",
        occurredAt: new Date("2026-02-20T16:00:00.000Z"),
    })
    if (!result.ok) throw new Error(result.reason)
    return result.meetup
}

function buildConfirmedWithWalletHold(): MeetupMachine {
    const proposed: MeetupMachine = {
        ...buildProposed(),
        finalPrice: 240,
        proposedPaymentMethod: "WALLET",
    }
    const result = transitionMeetup(proposed, {
        type: "ACCEPT",
        actorRole: "BUYER",
        occurredAt: new Date("2026-02-20T16:30:00.000Z"),
        buyerWalletAvailableEur: 5000,
    })
    if (!result.ok) throw new Error(result.reason)
    return result.meetup
}

describe("cierre por tiempo de las quedadas", () => {
    it("no cierra nada mientras la propuesta sigue viva", () => {
        const expired = collectExpiredMeetups(
            { "conv-a": [buildProposed()] },
            new Date("2026-02-20T17:59:00.000Z")
        )

        expect(expired).toHaveLength(0)
    })

    it("caduca una propuesta sin responder al pasar su hora", () => {
        const expired = collectExpiredMeetups(
            { "conv-a": [buildProposed()] },
            new Date("2026-02-20T18:01:00.000Z")
        )

        expect(expired).toHaveLength(1)
        expect(expired[0].conversationId).toBe("conv-a")
        expect(expired[0].next.status).toBe("CANCELLED")
        expect(expired[0].next.cancelReason).toBe("PROPOSAL_EXPIRED")
    })

    it("una quedada confirmada aguanta hasta que cierra la ventana de llegada", () => {
        const confirmed = buildConfirmedWithWalletHold()

        // La hora acordada ya paso, pero la ventana sigue abierta hasta scheduledAt + 2 h.
        expect(
            collectExpiredMeetups({ "conv-a": [confirmed] }, new Date("2026-02-20T19:30:00.000Z"))
        ).toHaveLength(0)

        const cerrada = collectExpiredMeetups(
            { "conv-a": [confirmed] },
            new Date("2026-02-20T20:01:00.000Z")
        )
        expect(cerrada).toHaveLength(1)
        expect(cerrada[0].next.cancelReason).toBe("MEETUP_EXPIRED")
    })

    it("no toca las quedadas ya cerradas ni las que no tienen propuesta", () => {
        const sinPropuesta = createMeetupMachine({ scheduledAt: SCHEDULED_AT, chatContext })
        const cancelada = collectExpiredMeetups(
            { "conv-a": [buildProposed()] },
            new Date("2026-02-20T18:01:00.000Z")
        )[0].next

        const expired = collectExpiredMeetups(
            { "conv-a": [cancelada], "conv-b": [sinPropuesta] },
            new Date("2026-02-21T00:00:00.000Z")
        )

        expect(expired).toHaveLength(0)
    })

    it("solo mira la ultima entrada del historial de cada conversacion", () => {
        const proposed = buildProposed()
        const confirmed = buildConfirmedWithWalletHold()

        const expired = collectExpiredMeetups(
            { "conv-a": [proposed, confirmed] },
            new Date("2026-02-20T19:00:00.000Z")
        )

        // La propuesta antigua ya habria caducado, pero la vigente es la confirmada.
        expect(expired).toHaveLength(0)
    })

    it("devuelve el saldo retenido en Wallet al cerrarse sin completar", () => {
        const cerrada = collectExpiredMeetups(
            { "conv-a": [buildConfirmedWithWalletHold()] },
            new Date("2026-02-20T20:01:00.000Z")
        )

        expect(cerrada[0].previous.walletHoldAmountEur).toBe(240)
        expect(sumReleasedWalletHoldEur(cerrada)).toBe(240)
        expect(cerrada[0].next.walletHoldAmountEur).toBeUndefined()
    })

    it("no devuelve saldo cuando el pago era en efectivo", () => {
        const efectivo: MeetupMachine = { ...buildProposed(), finalPrice: 310, proposedPaymentMethod: "CASH" }
        const cerrada = collectExpiredMeetups(
            { "conv-a": [efectivo] },
            new Date("2026-02-20T18:01:00.000Z")
        )

        expect(sumReleasedWalletHoldEur(cerrada)).toBe(0)
    })
})

describe("clave de vencimiento", () => {
    it("es estable para el mismo vencimiento", () => {
        const meetup = buildProposed()

        expect(buildMeetupExpiryKey("conv-a", meetup)).toBe(buildMeetupExpiryKey("conv-a", meetup))
    })

    it("distingue conversaciones que comparten el meetup", () => {
        const meetup = buildProposed()

        expect(buildMeetupExpiryKey("conv-a", meetup)).not.toBe(
            buildMeetupExpiryKey("conv-b", meetup)
        )
    })

    it("cambia al volver a proponer tras una cancelacion, que reutiliza el mismo id", () => {
        const proposed = buildProposed()
        const cancelada = transitionMeetup(proposed, {
            type: "CANCEL",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T17:00:00.000Z"),
        })
        if (!cancelada.ok) throw new Error(cancelada.reason)

        const repropuesta = transitionMeetup(cancelada.meetup, {
            type: "PROPOSE",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T17:30:00.000Z"),
        })
        if (!repropuesta.ok) throw new Error(repropuesta.reason)

        expect(repropuesta.meetup.id).toBe(proposed.id)
        expect(buildMeetupExpiryKey("conv-a", repropuesta.meetup)).not.toBe(
            buildMeetupExpiryKey("conv-a", proposed)
        )
    })
})
