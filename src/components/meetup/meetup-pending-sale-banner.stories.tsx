import type { Meta, StoryObj } from "@storybook/react-vite"
import { MeetupPendingSaleBanner } from "@/components/meetup/meetup-pending-sale-banner"

const meta = {
    title: "Design System/Meetup Pending Sale Banner",
    component: MeetupPendingSaleBanner,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="mx-auto w-full max-w-[var(--wm-size-860)] bg-[color:var(--bg-base)]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MeetupPendingSaleBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        scheduledAt: new Date(Date.now() + 75 * 60 * 1000),
        onJumpToMeetup: () => undefined,
    },
}
