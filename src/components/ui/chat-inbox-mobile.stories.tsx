import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@/components/ui/button"
import { ChatListItem } from "@/components/ui/chat-list-item"
import { InboxBottomNav } from "@/components/ui/inbox-bottom-nav"

const meta = {
  title: "Design System/Chat Inbox Mobile",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const conversations = [
  {
    userName: "Lorena",
    messageDate: "18:35",
    itemTitle: "Chaqueta de borrego",
    messagePreview: "Un saludo",
    lastMessageDeliveryState: "read" as const,
  },
  {
    userName: "Daniel",
    messageDate: "17:24",
    itemTitle: "Figura Pickett Animales Fan...",
    messagePreview: "Ya voy",
    leadingIndicator: "deal" as const,
    lastMessageDeliveryState: "read" as const,
  },
  {
    userName: "Samuel",
    messageDate: "15:07",
    itemTitle: "Silent Hill f PS5 Juego",
    messagePreview: "El paquete ha llegado al punto ...",
    leadingIndicator: "bookmark" as const,
  },
  {
    userName: "Sira",
    messageDate: "12 feb",
    itemTitle: "Silent Hill f PS5 Juego",
    messagePreview: "Sira ha rechazado tu oferta.",
    leadingIndicator: "bookmark" as const,
    showDivider: false,
  },
]

export const MobileInboxReference: Story = {
  render: () => (
    <div className="w-full max-w-[var(--wm-size-390)] overflow-hidden rounded-[var(--wm-size-20)] border border-[color:var(--border-strong)] bg-[color:var(--bg-base)]">
      <div className="px-4 pt-4 pb-3">
        <div role="tablist" aria-label="Secciones de inbox" className="flex items-center gap-2">
          <Button variant="tab" role="tab" aria-selected="true" data-selected="true">
            Mensajes
          </Button>
          <Button variant="tab" role="tab" aria-selected="false">
            Notificaciones
          </Button>
        </div>
      </div>

      <div>
        {conversations.map((conversation) => (
          <ChatListItem key={`${conversation.userName}-${conversation.messageDate}`} {...conversation} />
        ))}
      </div>

      <InboxBottomNav activeItemId="inbox" />
    </div>
  ),
}

