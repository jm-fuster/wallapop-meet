import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { MeetupCard } from "@/components/meetup/meetup-card"
import { createMeetupMachine, transitionMeetup } from "@/meetup"
import type { ActorRole, MeetupChatContext, MeetupMachine } from "@/meetup/types"

const scheduledAt = new Date("2026-02-20T18:00:00.000Z")
const chatContext: MeetupChatContext = {
    conversationId: "conv-story-001",
    listingId: "listing-story-001",
    sellerUserId: "user-seller-story-001",
    buyerUserId: "user-buyer-story-001",
}

function buildProposedSellerMachine(): MeetupMachine {
    const draft: MeetupMachine = {
        ...createMeetupMachine({ scheduledAt, chatContext }),
        proposedLocation: "Estación de Sants - Acceso principal",
        proposedLocationLat: 41.37906,
        proposedLocationLng: 2.14006,
        finalPrice: 500,
        proposedPaymentMethod: "CASH",
    }
    const proposed = transitionMeetup(draft, {
        type: "PROPOSE",
        actorRole: "SELLER",
        occurredAt: new Date("2026-02-20T16:00:00.000Z"),
    })
    return proposed.ok ? proposed.meetup : draft
}

function buildConfirmedMachine(): MeetupMachine {
    const proposed = buildProposedSellerMachine()
    const confirmed = transitionMeetup(proposed, {
        type: "ACCEPT",
        actorRole: "BUYER",
        occurredAt: new Date("2026-02-20T17:00:00.000Z"),
    })
    return confirmed.ok ? confirmed.meetup : proposed
}

function buildConfirmedWalletMachine(): MeetupMachine {
    const draft: MeetupMachine = {
        ...createMeetupMachine({ scheduledAt, chatContext }),
        proposedLocation: "Estación de Sants - Acceso principal",
        proposedLocationLat: 41.37906,
        proposedLocationLng: 2.14006,
        finalPrice: 500,
        proposedPaymentMethod: "WALLET",
    }
    const proposed = transitionMeetup(draft, {
        type: "PROPOSE",
        actorRole: "SELLER",
        occurredAt: new Date("2026-02-20T16:00:00.000Z"),
    })
    if (!proposed.ok) {
        return draft
    }
    const confirmed = transitionMeetup(proposed.meetup, {
        type: "ACCEPT",
        actorRole: "BUYER",
        occurredAt: new Date("2026-02-20T17:00:00.000Z"),
    })
    return confirmed.ok ? confirmed.meetup : proposed.meetup
}

function buildArrivedWalletMachine(): MeetupMachine {
    const confirmed = buildConfirmedWalletMachine()
    const arrived = transitionMeetup(confirmed, {
        type: "MARK_ARRIVED",
        actorRole: "SELLER",
        occurredAt: new Date("2026-02-20T18:01:00.000Z"),
        withinSafeRadius: true,
    })
    return arrived.ok ? arrived.meetup : confirmed
}

/** Comprador y vendedor han marcado llegada: el comprador puede abrir el dialog del QR. */
function buildArrivedWalletBuyerCheckedInMachine(): MeetupMachine {
    const arrivedSeller = buildArrivedWalletMachine()
    const buyerArrived = transitionMeetup(arrivedSeller, {
        type: "MARK_ARRIVED",
        actorRole: "BUYER",
        occurredAt: new Date("2026-02-20T18:02:00.000Z"),
        withinSafeRadius: true,
    })
    return buyerArrived.ok ? buyerArrived.meetup : arrivedSeller
}

function buildCounterProposedMachine(): MeetupMachine {
    const proposed = buildProposedSellerMachine()
    const counter = transitionMeetup(proposed, {
        type: "COUNTER_PROPOSE",
        actorRole: "BUYER",
        occurredAt: new Date("2026-02-20T16:40:00.000Z"),
    })
    return counter.ok ? counter.meetup : proposed
}

function buildArrivedMachine(options?: { buyerArrived?: boolean }): MeetupMachine {
    const confirmed = buildConfirmedMachine()
    const sellerArrived = transitionMeetup(confirmed, {
        type: "MARK_ARRIVED",
        actorRole: "SELLER",
        occurredAt: new Date("2026-02-20T18:01:00.000Z"),
        withinSafeRadius: true,
    })
    if (!sellerArrived.ok) {
        return confirmed
    }
    if (!options?.buyerArrived) {
        return sellerArrived.meetup
    }
    const buyerArrived = transitionMeetup(sellerArrived.meetup, {
        type: "MARK_ARRIVED",
        actorRole: "BUYER",
        occurredAt: new Date("2026-02-20T18:02:00.000Z"),
        withinSafeRadius: true,
    })
    return buyerArrived.ok ? buyerArrived.meetup : sellerArrived.meetup
}

function buildCancelledMachine(): MeetupMachine {
    const confirmed = buildConfirmedMachine()
    const cancelled = transitionMeetup(confirmed, {
        type: "CANCEL",
        actorRole: "SELLER",
        occurredAt: new Date("2026-02-20T17:30:00.000Z"),
        reason: "MANUAL_CANCEL",
    })
    return cancelled.ok ? cancelled.meetup : confirmed
}

function buildCompletedMachine(): MeetupMachine {
    const arrived = buildArrivedMachine({ buyerArrived: true })
    const completed = transitionMeetup(arrived, {
        type: "COMPLETE",
        actorRole: "SELLER",
        occurredAt: new Date("2026-02-20T18:10:00.000Z"),
    })
    return completed.ok ? completed.meetup : arrived
}

const meta = {
    title: "Design System/Meetup Card",
    component: MeetupCard,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-full min-w-[var(--wm-size-360)] max-w-[var(--wm-size-860)] bg-[color:var(--wm-color-background-surface)] p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MeetupCard>

export default meta
type Story = StoryObj<typeof meta>

function CardHarness({
    initialMeetup,
    actorRole,
    currentTime,
    counterpartName,
    buyerWalletAvailableEur = 5000,
}: {
    initialMeetup: MeetupMachine
    actorRole: ActorRole
    currentTime: Date
    counterpartName?: string
    buyerWalletAvailableEur?: number
}) {
    const [machine, setMachine] = React.useState(initialMeetup)
    const [error, setError] = React.useState("")

    return (
        <div className="space-y-3">
            <MeetupCard
                meetup={machine}
                actorRole={actorRole}
                currentTime={currentTime}
                onMeetupChange={setMachine}
                onError={setError}
                onEditProposal={() => undefined}
                counterpartName={counterpartName}
                buyerWalletAvailableEur={buyerWalletAvailableEur}
                onWalletTopUp={() => undefined}
            />
            {error ? (
                <p className="rounded-[var(--wm-size-8)] bg-[color:var(--bg-surface)] px-3 py-2 font-wallie-fit text-[length:var(--wm-size-13)] text-[color:var(--feedback-error)]">
                    {error}
                </p>
            ) : null}
        </div>
    )
}

export const Pending: Story = {
    args: {
        meetup: buildProposedSellerMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T16:05:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildProposedSellerMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T16:05:00.000Z")}
        />
    ),
}

export const Confirmed: Story = {
    args: {
        meetup: buildConfirmedMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T15:00:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildConfirmedMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T15:00:00.000Z")}
        />
    ),
}

export const CounterProposed: Story = {
    args: {
        meetup: buildCounterProposedMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T16:45:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildCounterProposedMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T16:45:00.000Z")}
        />
    ),
}

export const ThirtyMinutesBefore: Story = {
    args: {
        meetup: buildConfirmedMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T17:30:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildConfirmedMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T17:30:00.000Z")}
        />
    ),
}

export const Arrival: Story = {
    args: {
        meetup: buildArrivedMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T18:03:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildArrivedMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T18:03:00.000Z")}
        />
    ),
}

export const Cancelled: Story = {
    args: {
        meetup: buildCancelledMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T17:31:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildCancelledMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T17:31:00.000Z")}
        />
    ),
}

export const Completed: Story = {
    args: {
        meetup: buildCompletedMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T18:12:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildCompletedMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T18:12:00.000Z")}
        />
    ),
}

export const WithCounterpartName: Story = {
    args: {
        meetup: buildConfirmedMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T15:00:00.000Z"),
        counterpartName: "Marta",
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
}

export const WalletPaymentBuyerQr: Story = {
    args: {
        meetup: buildConfirmedWalletMachine(),
        actorRole: "BUYER",
        currentTime: new Date("2026-02-20T15:00:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildConfirmedWalletMachine()}
            actorRole="BUYER"
            currentTime={new Date("2026-02-20T15:00:00.000Z")}
        />
    ),
}

export const WalletPaymentBuyerShowQrDialog: Story = {
    args: {
        meetup: buildArrivedWalletBuyerCheckedInMachine(),
        actorRole: "BUYER",
        currentTime: new Date("2026-02-20T18:03:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
    },
    render: () => (
        <CardHarness
            initialMeetup={buildArrivedWalletBuyerCheckedInMachine()}
            actorRole="BUYER"
            currentTime={new Date("2026-02-20T18:03:00.000Z")}
        />
    ),
}

export const WalletPaymentSellerScan: Story = {
    args: {
        meetup: buildArrivedWalletMachine(),
        actorRole: "SELLER",
        currentTime: new Date("2026-02-20T18:03:00.000Z"),
        onMeetupChange: () => undefined,
        onError: () => undefined,
        counterpartName: "Laura M.",
    },
    render: () => (
        <CardHarness
            initialMeetup={buildArrivedWalletMachine()}
            actorRole="SELLER"
            currentTime={new Date("2026-02-20T18:03:00.000Z")}
            counterpartName="Laura M."
        />
    ),
}
