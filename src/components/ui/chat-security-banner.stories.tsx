import type { Meta, StoryObj } from "@storybook/react-vite"

import { ChatSecurityBanner } from "@/components/ui/chat-security-banner"

const meta = {
  title: "Design System/Chat Security Banner",
  component: ChatSecurityBanner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-[var(--wm-size-560)] border border-[color:var(--wm-color-border-default)] bg-[color:var(--bg-base)]">
        <Story />
      </div>
    ),
  ],
  args: {
    message: "Quédate en Wallapop. Más fácil, más seguro.",
    linkText: "Preguntas? Habla con nuestro chatbot",
  },
} satisfies Meta<typeof ChatSecurityBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const CompactFooter: Story = {
  args: {
    className: "px-0 pt-1 pb-1",
    linkText: "Más información",
  },
}

