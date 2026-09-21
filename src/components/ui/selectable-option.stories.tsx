import type { Meta, StoryObj } from "@storybook/react-vite"

import { SelectableOption } from "@/components/ui/selectable-option"
import { WallapopIcon } from "@/components/ui/wallapop-icon"

const meta = {
    title: "Design System/Selectable Option",
    component: SelectableOption,
    tags: ["autodocs"],
} satisfies Meta<typeof SelectableOption>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        selected: false,
        title: "Punto de encuentro personalizado",
        subtitle: "Calle Gran Via, 15 · Madrid",
        leftIcon: <WallapopIcon name="deal" size={16} />,
    },
}

export const Selected: Story = {
    args: {
        selected: true,
        title: "Punto seguro seleccionado",
        subtitle: "Centro Comercial Sol · 124 ventas",
        leftIcon: <WallapopIcon name="shield" size={16} />,
        children: (
            <span className="rounded-full bg-[color:var(--bg-accent-subtle)] px-2 py-0.5 font-brand-text text-[length:var(--wm-size-12)] text-[color:var(--action-primary-pressed)]">
                Punto seguro
            </span>
        ),
    },
}

export const Disabled: Story = {
    args: {
        selected: false,
        disabled: true,
        title: "Metodo alternativo",
        subtitle: "Temporalmente no disponible para esta operacion",
        leftIcon: <WallapopIcon name="mail" size={16} />,
    },
}
