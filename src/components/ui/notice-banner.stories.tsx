import type { Meta, StoryObj } from "@storybook/react-vite"

import { NoticeBanner } from "@/components/ui/notice-banner"

const meta = {
    title: "Design System/Notice Banner",
    component: NoticeBanner,
    tags: ["autodocs"],
    args: {
        children: "Mensaje informativo para el usuario.",
    },
} satisfies Meta<typeof NoticeBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Warning: Story = {
    args: {
        tone: "warning",
        children: "Atención: revisa los datos antes de continuar.",
    },
}

export const Success: Story = {
    args: {
        tone: "success",
        children: "Operacion completada correctamente.",
    },
}

