import type { Meta, StoryObj } from "@storybook/react-vite"

import { MeetupWizardStepHeading } from "@/components/meetup/meetup-wizard-step-heading"

const meta = {
  title: "Design System/Meetup Wizard Step Heading",
  component: MeetupWizardStepHeading,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[var(--wm-size-360)] rounded-[var(--wm-size-20)] border border-[color:var(--border-divider)] bg-[color:var(--bg-base)] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MeetupWizardStepHeading>

export default meta
type Story = StoryObj<typeof meta>

export const WithTitle: Story = {
  parameters: {
    dsState: "with_title",
  },
  args: {
    caption: "Paso anterior",
    title: "Seleccionar dia y hora",
    onBack: () => undefined,
  },
}

export const CaptionOnly: Story = {
  parameters: {
    dsState: "caption_only",
  },
  args: {
    caption: "Define el pago final y la preferencia de pago.",
    onBack: () => undefined,
  },
}

