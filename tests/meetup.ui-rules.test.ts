import { describe, expect, it } from "vitest"

import {
    resolveArrivalActionState,
    resolveMeetupCardCtaIds,
    resolveMeetupDayBannerVariant,
} from "@/components/meetup/meetup-ui-rules"
import { createMeetupMachine, transitionMeetup } from "@/meetup"
import type { MeetupChatContext } from "@/meetup/types"

describe("meetup ui rules", () => {
    const scheduledAt = new Date("2026-02-20T18:00:00.000Z")
    const chatContext: MeetupChatContext = {
        conversationId: "conv-001",
        listingId: "listing-001",
        sellerUserId: "user-seller-001",
        buyerUserId: "user-buyer-001",
    }

    function buildConfirmedMeetup() {
        const proposed = transitionMeetup(createMeetupMachine({ scheduledAt, chatContext }), {
            type: "PROPOSE",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T16:00:00.000Z"),
        })
        if (!proposed.ok) {
            throw new Error("Se esperaba meetup propuesto para la prueba.")
        }

        const confirmed = transitionMeetup(proposed.meetup, {
            type: "ACCEPT",
            actorRole: "BUYER",
            occurredAt: new Date("2026-02-20T16:30:00.000Z"),
        })
        if (!confirmed.ok) {
            throw new Error("Se esperaba meetup confirmado para la prueba.")
        }

        return confirmed.meetup
    }

    function buildProposedMeetup() {
        const proposed = transitionMeetup(createMeetupMachine({ scheduledAt, chatContext }), {
            type: "PROPOSE",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T16:00:00.000Z"),
        })
        if (!proposed.ok) {
            throw new Error("Se esperaba meetup PROPOSED para la prueba.")
        }

        return proposed.meetup
    }

    it("habilita accion de llegada en ventana valida", () => {
        const meetup = buildConfirmedMeetup()
        const state = resolveArrivalActionState(
            meetup,
            new Date("2026-02-20T17:50:00.000Z")
        )

        expect(state.enabled).toBe(true)
        expect(state.proximityRequiredMessage).toBe("")
    })

    it("deshabilita accion de llegada fuera de ventana", () => {
        const meetup = buildConfirmedMeetup()
        const state = resolveArrivalActionState(
            meetup,
            new Date("2026-02-20T21:30:00.000Z")
        )

        expect(state.enabled).toBe(false)
        expect(state.proximityRequiredMessage).toBe("")
    })

    it("deshabilita llegada y muestra aviso de proximidad si la distancia es mayor a 100 m", () => {
        const meetup = buildConfirmedMeetup()
        const state = resolveArrivalActionState(
            meetup,
            new Date("2026-02-20T17:50:00.000Z"),
            "BUYER",
            180
        )

        expect(state.enabled).toBe(false)
        expect(state.proximityRequiredMessage).toContain("100 metros")
    })

    it("resuelve variante de banner en ventana activa", () => {
        const meetup = buildConfirmedMeetup()
        const variant = resolveMeetupDayBannerVariant(
            meetup,
            new Date("2026-02-20T17:45:00.000Z")
        )

        expect(variant).toBe("in_window")
    })

    it("deshabilita llegada si el actor ya marco ARRIVED", () => {
        const confirmed = buildConfirmedMeetup()
        const arrivedResult = transitionMeetup(confirmed, {
            type: "MARK_ARRIVED",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T17:45:00.000Z"),
            withinSafeRadius: true,
        })
        if (!arrivedResult.ok) {
            throw new Error("Se esperaba meetup ARRIVED para la prueba.")
        }

        const state = resolveArrivalActionState(
            arrivedResult.meetup,
            new Date("2026-02-20T17:50:00.000Z"),
            "SELLER"
        )

        expect(state.enabled).toBe(false)
        expect(state.message).toBe("Ya has marcado que has llegado.")
        expect(state.proximityRequiredMessage).toBe("")
    })

    it("muestra banner upcoming fuera de ventana en meetup confirmado", () => {
        const meetup = buildConfirmedMeetup()
        const variant = resolveMeetupDayBannerVariant(
            meetup,
            new Date("2026-02-20T16:00:00.000Z")
        )

        expect(variant).toBe("upcoming")
    })

    it("resuelve CTAs de BUYER en PROPOSED", () => {
        const meetup = buildProposedMeetup()
        const ctas = resolveMeetupCardCtaIds({
            meetup,
            currentTime: new Date("2026-02-20T16:05:00.000Z"),
            actorRole: "BUYER",
            hasEditProposalAction: true,
        })

        expect(ctas).toEqual(["accept", "counter", "reject"])
    })

    it("resuelve CTA inicial solo para SELLER cuando no hay meetup activo", () => {
        const draft = createMeetupMachine({ scheduledAt, chatContext })
        const sellerCtas = resolveMeetupCardCtaIds({
            meetup: draft,
            currentTime: new Date("2026-02-20T15:00:00.000Z"),
            actorRole: "SELLER",
            hasEditProposalAction: false,
        })
        const buyerCtas = resolveMeetupCardCtaIds({
            meetup: draft,
            currentTime: new Date("2026-02-20T15:00:00.000Z"),
            actorRole: "BUYER",
            hasEditProposalAction: false,
        })

        expect(sellerCtas).toEqual(["propose"])
        expect(buyerCtas).toEqual([])
    })

    it("resuelve CTAs de SELLER en COUNTER_PROPOSED", () => {
        const proposed = buildProposedMeetup()
        const counter = transitionMeetup(proposed, {
            type: "COUNTER_PROPOSE",
            actorRole: "BUYER",
            occurredAt: new Date("2026-02-20T16:30:00.000Z"),
        })
        if (!counter.ok) {
            throw new Error("Se esperaba meetup COUNTER_PROPOSED para la prueba.")
        }

        const ctas = resolveMeetupCardCtaIds({
            meetup: counter.meetup,
            currentTime: new Date("2026-02-20T16:35:00.000Z"),
            actorRole: "SELLER",
            hasEditProposalAction: true,
        })

        expect(ctas).toEqual(["edit", "accept-counter", "repropose", "cancel"])
    })

    it("resuelve CTAs de CONFIRMED dentro de ventana", () => {
        const meetup = buildConfirmedMeetup()
        const ctas = resolveMeetupCardCtaIds({
            meetup,
            currentTime: new Date("2026-02-20T17:45:00.000Z"),
            actorRole: "BUYER",
            hasEditProposalAction: false,
        })

        expect(ctas).toEqual(["arrived", "cancel"])
    })

    it("resuelve CTAs de CONFIRMED fuera de ventana", () => {
        const meetup = buildConfirmedMeetup()
        const ctas = resolveMeetupCardCtaIds({
            meetup,
            currentTime: new Date("2026-02-20T15:00:00.000Z"),
            actorRole: "BUYER",
            hasEditProposalAction: false,
        })

        expect(ctas).toEqual(["calendar", "cancel"])
    })

    it("resuelve CTAs de ARRIVED para SELLER y BUYER", () => {
        const confirmed = buildConfirmedMeetup()
        const sellerArrived = transitionMeetup(confirmed, {
            type: "MARK_ARRIVED",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T17:45:00.000Z"),
            withinSafeRadius: true,
        })
        if (!sellerArrived.ok) {
            throw new Error("Se esperaba meetup ARRIVED para la prueba.")
        }

        const sellerCtas = resolveMeetupCardCtaIds({
            meetup: sellerArrived.meetup,
            currentTime: new Date("2026-02-20T17:50:00.000Z"),
            actorRole: "SELLER",
            hasEditProposalAction: false,
        })
        const buyerCtas = resolveMeetupCardCtaIds({
            meetup: sellerArrived.meetup,
            currentTime: new Date("2026-02-20T17:50:00.000Z"),
            actorRole: "BUYER",
            hasEditProposalAction: false,
        })

        expect(sellerCtas).toEqual(["complete", "no-show", "cancel"])
        expect(buyerCtas).toEqual(["arrived", "cancel"])
    })

    it("oculta el no-show al vendedor que no ha marcado su llegada", () => {
        const buyerArrived = transitionMeetup(buildConfirmedMeetup(), {
            type: "MARK_ARRIVED",
            actorRole: "BUYER",
            occurredAt: new Date("2026-02-20T17:45:00.000Z"),
            withinSafeRadius: true,
        })
        if (!buyerArrived.ok) {
            throw new Error("Se esperaba meetup ARRIVED para la prueba.")
        }

        const sellerCtas = resolveMeetupCardCtaIds({
            meetup: buyerArrived.meetup,
            currentTime: new Date("2026-02-20T17:50:00.000Z"),
            actorRole: "SELLER",
            hasEditProposalAction: false,
        })

        expect(sellerCtas).toEqual(["arrived", "complete", "cancel"])
    })

    it("sustituye confirmar venta por escaneo Wallet para vendedor en ARRIVED", () => {
        const confirmed = buildConfirmedMeetup()
        const withWallet: typeof confirmed = {
            ...confirmed,
            proposedPaymentMethod: "WALLET",
        }
        const sellerArrived = transitionMeetup(withWallet, {
            type: "MARK_ARRIVED",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T17:45:00.000Z"),
            withinSafeRadius: true,
        })
        if (!sellerArrived.ok) {
            throw new Error("Se esperaba meetup ARRIVED para la prueba.")
        }

        const sellerCtas = resolveMeetupCardCtaIds({
            meetup: sellerArrived.meetup,
            currentTime: new Date("2026-02-20T17:50:00.000Z"),
            actorRole: "SELLER",
            hasEditProposalAction: false,
        })

        expect(sellerCtas).toEqual(["wallet-scan-sale", "no-show", "cancel"])
    })

    it("oculta CTA de llegada para BUYER en ARRIVED cuando ya marco llegada", () => {
        const confirmed = buildConfirmedMeetup()
        const sellerArrived = transitionMeetup(confirmed, {
            type: "MARK_ARRIVED",
            actorRole: "SELLER",
            occurredAt: new Date("2026-02-20T17:45:00.000Z"),
            withinSafeRadius: true,
        })
        if (!sellerArrived.ok) {
            throw new Error("Se esperaba meetup ARRIVED para la prueba.")
        }

        const buyerArrived = transitionMeetup(sellerArrived.meetup, {
            type: "MARK_ARRIVED",
            actorRole: "BUYER",
            occurredAt: new Date("2026-02-20T17:46:00.000Z"),
            withinSafeRadius: true,
        })
        if (!buyerArrived.ok) {
            throw new Error("Se esperaba check-in del comprador para la prueba.")
        }

        const buyerCtas = resolveMeetupCardCtaIds({
            meetup: buyerArrived.meetup,
            currentTime: new Date("2026-02-20T17:50:00.000Z"),
            actorRole: "BUYER",
            hasEditProposalAction: false,
        })

        expect(buyerCtas).toEqual(["cancel"])
    })
})
