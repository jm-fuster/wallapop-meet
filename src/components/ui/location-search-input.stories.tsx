import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { LocationSearchInput } from "@/components/ui/location-search-input"

const meta = {
    title: "Design System/Location Search Input",
    component: LocationSearchInput,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-full max-w-[var(--wm-size-460)] bg-[color:var(--bg-base)] p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof LocationSearchInput>

export default meta
type Story = StoryObj<typeof meta>

function ControlledSearchInput(args: React.ComponentProps<typeof LocationSearchInput>) {
    const [value, setValue] = React.useState(args.value)
    return <LocationSearchInput {...args} value={value} onValueChange={setValue} />
}

export const Playground: Story = {
    render: ControlledSearchInput,
    args: {
        value: "",
        onValueChange: () => undefined,
        placeholder: "¿Donde?",
    },
}
