import type { Meta, StoryObj } from "@storybook/react-vite"

import { ChatListItem } from "@/components/ui/chat-list-item"

const meta = {
  title: "Design System/Chat List Item",
  component: ChatListItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-[var(--wm-size-360)] border border-[color:var(--wm-color-border-default)] bg-[color:var(--bg-base)]">
        <Story />
      </div>
    ),
  ],
  args: {
    userName: "Lorena",
    messageDate: "18:35",
    itemTitle: "Chaqueta de borrego",
    messagePreview: "Un saludo",
    unreadCount: 0,
    lastMessageDeliveryState: "read",
  },
} satisfies Meta<typeof ChatListItem>

export default meta
type Story = StoryObj<typeof meta>

export const UnselectedWithoutAlert: Story = {
  args: {
    selected: false,
    unreadCount: 0,
    leadingIndicator: undefined,
  },
}

export const UnselectedWithAlert: Story = {
  args: {
    selected: false,
    unreadCount: 2,
    leadingIndicator: "bookmark",
  },
}

export const SelectedWithoutAlert: Story = {
  args: {
    selected: true,
    unreadCount: 0,
    leadingIndicator: undefined,
  },
}

export const SelectedWithAlert: Story = {
  args: {
    selected: true,
    unreadCount: 3,
    leadingIndicator: "deal",
    lastMessageDeliveryState: "read",
  },
}

