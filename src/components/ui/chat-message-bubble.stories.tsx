import type { Meta, StoryObj } from "@storybook/react-vite"

import { ChatMessageBubble } from "@/components/ui/chat-message-bubble"

const meta = {
  title: "Design System/Chat Message Bubble",
  component: ChatMessageBubble,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Perfecto, nos vemos en la estación.",
    variant: "received",
    time: "14:52",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["sent", "received"],
    },
    deliveryState: {
      control: "inline-radio",
      options: ["sent", "read"],
    },
  },
} satisfies Meta<typeof ChatMessageBubble>

export default meta
type Story = StoryObj<typeof meta>

export const Sent: Story = {
  args: {
    variant: "sent",
    deliveryState: "sent",
    children: "Si, confirmo en Glories.",
    time: "15:16",
  },
}

export const Received: Story = {
  args: {
    variant: "received",
    children: "Te va bien manana a las 18:30?",
    time: "14:52",
  },
}

export const Read: Story = {
  args: {
    variant: "sent",
    deliveryState: "read",
    children: "Perfecto",
    time: "15:18",
  },
}
