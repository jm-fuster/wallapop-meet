import type { Meta, StoryObj } from "@storybook/react-vite"

import { MeetupProposalHeader } from "@/components/meetup/meetup-proposal-header"

const meta = {
  title: "Design System/Meetup Proposal Header",
  component: MeetupProposalHeader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[var(--wm-size-380)] overflow-hidden rounded-[var(--wm-size-20)] border border-[color:var(--border-divider)] bg-[color:var(--bg-base)] pb-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MeetupProposalHeader>

export default meta
type Story = StoryObj<typeof meta>

const baseSteps = [
  { id: 1, label: "Punto de encuentro" },
  { id: 2, label: "Dia y hora" },
  { id: 3, label: "Preferencia de pago" },
]

export const StepOne: Story = {
  parameters: {
    dsState: "step_one",
  },
  args: {
    currentStep: 1,
    totalSteps: 3,
    steps: baseSteps,
    onClose: () => undefined,
    onStepChange: () => undefined,
  },
}

export const StepTwo: Story = {
  parameters: {
    dsState: "step_two",
  },
  args: {
    currentStep: 2,
    totalSteps: 3,
    steps: [
      { id: 1, label: "Punto de encuentro" },
      { id: 2, label: "Dia y hora" },
      { id: 3, label: "Preferencia de pago", disabled: true },
    ],
    onClose: () => undefined,
    onStepChange: () => undefined,
  },
}

export const StepThree: Story = {
  parameters: {
    dsState: "step_three",
  },
  args: {
    currentStep: 3,
    totalSteps: 3,
    steps: baseSteps,
    onClose: () => undefined,
    onStepChange: () => undefined,
  },
}

