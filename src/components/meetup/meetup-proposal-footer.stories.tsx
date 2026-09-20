import type { Meta, StoryObj } from "@storybook/react-vite"

import { MeetupProposalFooter } from "@/components/meetup/meetup-proposal-footer"

const meta = {
  title: "Design System/Meetup Proposal Footer",
  component: MeetupProposalFooter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[var(--wm-size-380)] overflow-hidden rounded-[var(--wm-size-20)] border border-[color:var(--border-divider)] bg-[color:var(--bg-base)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MeetupProposalFooter>

export default meta
type Story = StoryObj<typeof meta>

const baseArgs = {
  listingImageSrc:
    "https://images.pexels.com/photos/6993182/pexels-photo-6993182.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400",
  itemTitle: "Nintendo Switch OLED + dock",
  userName: "Laura M.",
  onAction: () => undefined,
}

export const Enabled: Story = {
  args: {
    ...baseArgs,
    actionLabel: "Siguiente",
    actionDisabled: false,
  },
}

export const Disabled: Story = {
  args: {
    ...baseArgs,
    actionLabel: "Siguiente",
    actionDisabled: true,
  },
}

