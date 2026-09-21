import type { Meta, StoryObj } from "@storybook/react-vite"

import { Toast } from "@/components/ui/toast"

const meta = {
    title: "Design System/Toast",
    component: Toast,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "inline-radio",
            options: ["success", "error", "info"],
        },
    },
    args: {
        variant: "info",
        title: "Punto de encuentro actualizado",
        description: "Te avisaremos cuando la otra persona confirme los cambios.",
    },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
    render: () => (
        <div className="w-[var(--wm-size-360)] space-y-3">
            <Toast
                variant="success"
                title="Has llegado al punto de encuentro"
                description="Comparte tu llegada para avisar a la otra persona."
            />
            <Toast
                variant="error"
                title="No se pudo confirmar la llegada"
                description="Comprueba la conexión y vuelve a intentarlo."
            />
            <Toast
                variant="info"
                title="Quedada confirmada para hoy"
                description="Recibiras un recordatorio 15 minutos antes."
            />
        </div>
    ),
}
