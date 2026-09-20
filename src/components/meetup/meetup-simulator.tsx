import * as React from "react"

import { MeetupCard } from "@/components/meetup/meetup-card"
import { Button } from "@/components/ui/button"
import { createMeetupMachine } from "@/meetup/state-machine"
import type { ActorRole, MeetupChatContext, MeetupMachine } from "@/meetup/types"

const HALF_HOUR_MS = 30 * 60 * 1000
const TEN_MINUTES_MS = 10 * 60 * 1000
const THREE_HOURS_MS = 3 * 60 * 60 * 1000

function MeetupSimulator() {
    const scheduledAt = React.useMemo(() => {
        const now = new Date()
        return new Date(now.getTime() + HALF_HOUR_MS)
    }, [])
    const chatContext = React.useMemo<MeetupChatContext>(
        () => ({
            conversationId: "conv-simulator-001",
            listingId: "listing-simulator-001",
            sellerUserId: "user-seller-simulator-001",
            buyerUserId: "user-buyer-simulator-001",
        }),
        []
    )
    const [machine, setMachine] = React.useState<MeetupMachine>(() =>
        createMeetupMachine({ scheduledAt, chatContext })
    )
    const [actorRole, setActorRole] = React.useState<ActorRole>("SELLER")
    const [currentTime, setCurrentTime] = React.useState<Date>(() => new Date())
    const [lastError, setLastError] = React.useState<string>("")
    const [buyerWalletAvailableEur, setBuyerWalletAvailableEur] = React.useState(10_000)

    const handleMeetupChange = (next: MeetupMachine) => {
        setMachine((prev) => {
            if (
                prev.status !== "CONFIRMED" &&
                next.status === "CONFIRMED" &&
                next.proposedPaymentMethod === "WALLET" &&
                typeof next.finalPrice === "number"
            ) {
                setBuyerWalletAvailableEur((balance) => Math.max(0, balance - next.finalPrice!))
            }
            if (
                prev.status !== "CANCELLED" &&
                next.status === "CANCELLED" &&
                typeof prev.walletHoldAmountEur === "number"
            ) {
                setBuyerWalletAvailableEur((balance) => balance + prev.walletHoldAmountEur!)
            }
            return next
        })
    }

    return (
        <section className="w-full rounded-[var(--wm-size-16)] border border-[color:var(--wm-color-border-default)] bg-[color:var(--bg-base)] p-5 shadow-[var(--wm-shadow-100)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-wallie-fit text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]">
                        Wallapop Meet Demo
                    </p>
                    <h1 className="font-wallie-chunky text-[length:var(--wm-size-24)] leading-8 text-[color:var(--text-primary)]">
                        Flujo de meetup
                    </h1>
                </div>
                <div className="flex items-center gap-2" role="tablist" aria-label="Rol actor">
                    <Button
                        variant="tab"
                        role="tab"
                        aria-selected={actorRole === "SELLER"}
                        data-selected={actorRole === "SELLER"}
                        onClick={() => setActorRole("SELLER")}
                    >
                        Seller
                    </Button>
                    <Button
                        variant="tab"
                        role="tab"
                        aria-selected={actorRole === "BUYER"}
                        data-selected={actorRole === "BUYER"}
                        onClick={() => setActorRole("BUYER")}
                    >
                        Buyer
                    </Button>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Button
                    variant="inline_action"
                    size="sm"
                    onClick={() =>
                        setCurrentTime(new Date(machine.scheduledAt.getTime() - TEN_MINUTES_MS))
                    }
                >
                    Simular -10m
                </Button>
                <Button
                    variant="inline_action"
                    size="sm"
                    onClick={() => setCurrentTime(new Date(machine.scheduledAt))}
                >
                    Simular hora exacta
                </Button>
                <Button
                    variant="inline_action"
                    size="sm"
                    onClick={() =>
                        setCurrentTime(new Date(machine.scheduledAt.getTime() + THREE_HOURS_MS))
                    }
                >
                    Simular +3h
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setMachine(createMeetupMachine({ scheduledAt, chatContext }))
                        setCurrentTime(new Date())
                        setLastError("")
                        setBuyerWalletAvailableEur(10_000)
                    }}
                >
                    Reiniciar
                </Button>
            </div>

            <p className="mt-3 font-wallie-fit text-[length:var(--wm-size-13)] text-[color:var(--text-secondary)]">
                Hora simulada: {currentTime.toLocaleString()}
            </p>

            <div className="mt-4">
                <MeetupCard
                    meetup={machine}
                    actorRole={actorRole}
                    currentTime={currentTime}
                    onMeetupChange={handleMeetupChange}
                    onError={setLastError}
                    buyerWalletAvailableEur={buyerWalletAvailableEur}
                    onWalletTopUp={(amountEur) =>
                        setBuyerWalletAvailableEur((balance) => balance + amountEur)
                    }
                />
            </div>

            {lastError ? (
                <p className="mt-3 rounded-[var(--wm-size-8)] bg-[color:var(--bg-surface)] px-3 py-2 font-wallie-fit text-[length:var(--wm-size-13)] text-[color:var(--feedback-error)]">
                    {lastError}
                </p>
            ) : null}
        </section>
    )
}

export { MeetupSimulator }


