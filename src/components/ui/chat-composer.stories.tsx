import type { Meta, StoryObj } from "@storybook/react-vite"

import { ChatComposer } from "@/components/ui/chat-composer"

const meta = {
  title: "Design System/Chat Composer",
  component: ChatComposer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-[var(--wm-size-680)] bg-[color:var(--wm-color-background-surface)] p-3">
        <Story />
      </div>
    ),
  ],
  args: {
    defaultValue: "Te va bien quedar mañana?",
  },
} satisfies Meta<typeof ChatComposer>

export default meta
type Story = StoryObj<typeof meta>

export const Buyer: Story = {
  args: {
    defaultValue: "Te va bien quedar mañana?",
    secondaryActionLabel: undefined,
    onSecondaryAction: undefined,
  },
}

export const Seller: Story = {
  args: {
    defaultValue: "",
    secondaryActionLabel: "Proponer quedada",
    secondaryActionAriaLabel: "Proponer quedada",
    secondaryActionIconName: "calendar",
    onSecondaryAction: () => undefined,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    secondaryActionLabel: "Proponer quedada",
    secondaryActionAriaLabel: "Proponer quedada",
    secondaryActionIconName: "calendar",
    onSecondaryAction: () => undefined,
  },
}

