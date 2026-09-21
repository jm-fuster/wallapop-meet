import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChevronDown, ChevronLeft, X } from "lucide-react"

import { Button } from "@/components/ui/button"

const meta = {
  title: "Design System/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "inline-radio",
      options: [
        "primary",
        "outline",
        "link",
        "critical",
        "nav_expandable",
        "tab",
        "inline_action",
        "icon",
        "menu_close",
      ],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg", "tab", "icon"],
    },
  },
  args: {
    children: "Enviar propuesta",
    variant: "primary",
    size: "md",
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="link">Link</Button>
      <Button variant="critical">Critical</Button>
      <Button variant="nav_expandable">
        Todas las categorias
        <ChevronDown className="ml-2 size-4" aria-hidden="true" />
      </Button>
      <Button variant="tab" data-selected="true">
        Mensajes
      </Button>
      <Button variant="tab">Notificaciones</Button>
      <Button variant="inline_action">Ver</Button>
      <Button variant="icon" aria-label="Colapsar sidebar">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <Button variant="menu_close" aria-label="Cerrar menú">
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  ),
}

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="icon" aria-label="Colapsar sidebar">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <Button variant="menu_close" aria-label="Cerrar menú">
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  ),
}

export const Tabs: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button variant="tab" data-selected="true" role="tab" aria-selected="true">
        Mensajes
      </Button>
      <Button variant="tab" role="tab" aria-selected="false">
        Notificaciones
      </Button>
      <Button variant="tab" disabled>
        Deshabilitado
      </Button>
    </div>
  ),
}

export const Loading: Story = {
  args: {
    loading: true,
    loadingText: "Enviando...",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}
