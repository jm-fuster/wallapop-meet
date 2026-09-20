import type { Meta, StoryObj } from "@storybook/react-vite"

import { MeetupTimeline } from "@/components/meetup/meetup-timeline"
import type { MeetupStatus } from "@/meetup/types"

const meta = {
    title: "Design System/Meetup Timeline",
    component: MeetupTimeline,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-full min-w-[var(--wm-size-320)] max-w-[var(--wm-size-560)] rounded-[var(--wm-size-12)] border border-[color:var(--border-strong)] bg-[color:var(--bg-base)] p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MeetupTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
    args: {
        currentStatus: null,
    },
}

const flowStatuses: MeetupStatus[] = [
    "PROPOSED",
    "COUNTER_PROPOSED",
    "CONFIRMED",
    "ARRIVED",
    "COMPLETED",
    "CANCELLED",
]

export const ByStatus: Story = {
    args: {
        currentStatus: null,
    },
    render: () => (
        <div className="space-y-3">
            {flowStatuses.map((status) => (
                <div key={status} className="rounded-[var(--wm-size-8)] border border-[color:var(--border-divider)] p-3">
                    <p className="mb-2 font-wallie-fit text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]">
                        Estado: {status}
                    </p>
                    <MeetupTimeline currentStatus={status} />
                </div>
            ))}
        </div>
    ),
}


