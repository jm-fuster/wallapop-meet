import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { WalletTopUpSheet } from "@/components/meetup/wallet-top-up-sheet"

const meta = {
    title: "Design System/Wallet Top Up Sheet",
    component: WalletTopUpSheet,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof WalletTopUpSheet>

export default meta
type Story = StoryObj<typeof meta>

function OpenSheetHarness({
    minSuggestedAmountEur,
    initiallyOpen = true,
}: {
    minSuggestedAmountEur: number
    initiallyOpen?: boolean
}) {
    const [open, setOpen] = React.useState(initiallyOpen)
    return (
        <div className="min-h-[100dvh] bg-[color:var(--bg-base)] p-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                Abrir recarga
            </Button>
            <WalletTopUpSheet
                open={open}
                onClose={() => setOpen(false)}
                minSuggestedAmountEur={minSuggestedAmountEur}
                onConfirmTopUp={() => setOpen(false)}
            />
        </div>
    )
}

export const Default: Story = {
    args: {
        open: true,
        onClose: () => undefined,
        minSuggestedAmountEur: 50,
        onConfirmTopUp: () => undefined,
    },
    render: () => <OpenSheetHarness minSuggestedAmountEur={50} />,
}
