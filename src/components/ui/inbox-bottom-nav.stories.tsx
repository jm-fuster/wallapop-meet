import type { Meta, StoryObj } from "@storybook/react-vite"

import { InboxBottomNav } from "@/components/ui/inbox-bottom-nav"

const meta = {
  title: "Design System/Inbox Bottom Nav",
  component: InboxBottomNav,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-[var(--wm-size-390)] overflow-hidden rounded-[var(--wm-size-20)] border border-[color:var(--wm-color-border-default)] bg-[color:var(--bg-surface)]">
        <div className="h-[var(--wm-size-520)]" />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InboxBottomNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithBadge: Story = {
  args: {
    activeItemId: "home",
    items: [
      { id: "home", label: "Inicio", icon: "home" },
      { id: "favorites", label: "Favoritos", icon: "heart", badgeCount: 2 },
      { id: "sell", label: "Vender", icon: "plus" },
      { id: "inbox", label: "Buzón", icon: "mail" },
      { id: "profile", label: "Tu", icon: "user" },
    ],
  },
}

