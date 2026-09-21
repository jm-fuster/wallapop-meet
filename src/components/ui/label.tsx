import * as React from "react"

import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"

type LabelTone = "pending" | "confirmed" | "arrived" | "completed" | "cancelled"

type LabelProps = React.ComponentProps<"span"> & {
    tone?: LabelTone
}

const toneClassMap: Record<LabelTone, string> = {
    pending:
        "border-[color:var(--label-pending-border)] bg-[color:var(--label-pending-bg)] text-[color:var(--label-pending-text)]",
    confirmed:
        "border-[color:var(--label-confirmed-border)] bg-[color:var(--label-confirmed-bg)] text-[color:var(--label-confirmed-text)]",
    arrived:
        "border-[color:var(--label-arrived-border)] bg-[color:var(--label-arrived-bg)] text-[color:var(--label-arrived-text)]",
    completed:
        "border-[color:var(--label-completed-border)] bg-[color:var(--label-completed-bg)] text-[color:var(--label-completed-text)]",
    cancelled:
        "border-[color:var(--label-cancelled-border)] bg-[color:var(--label-cancelled-bg)] text-[color:var(--label-cancelled-text)]",
}

function Label({ tone = "pending", className, children, ...props }: LabelProps) {
    return (
        <span
            data-slot="label"
            data-tone={tone}
            className={cn(
                "inline-flex rounded-full border px-2.5 py-1 font-brand-text text-[length:var(--wm-size-11)] leading-[1]",
                toneClassMap[tone],
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}

const designSystemMeta = {
    id: "label",
    entityType: "component",
    title: "Label",
    description:
        "Chip de estado (pill) para meetup: tonos de `meetup_status` y texto en minusculas. En `MeetupCard` se compone con icono Lucide a la izquierda (`items-center gap-1`, icono `size-[var(--wm-size-12)]`, decorativo con `aria-hidden`); mapeo texto/icono en `components-spec-v1` seccion 15.",
    status: "ready",
    states: ["pending", "confirmed", "arrived", "completed", "cancelled"],
    storybookTitle: "Design System/Label",
    tokensUsed: [
                "tokens.color.meetup_status.pending.background",
                "tokens.color.meetup_status.pending.border",
                "tokens.color.meetup_status.pending.text",
                "tokens.color.meetup_status.confirmed.background",
                "tokens.color.meetup_status.confirmed.border",
                "tokens.color.meetup_status.confirmed.text",
                "tokens.color.meetup_status.arrived.background",
                "tokens.color.meetup_status.arrived.border",
                "tokens.color.meetup_status.arrived.text",
                "tokens.color.meetup_status.completed.background",
                "tokens.color.meetup_status.completed.border",
                "tokens.color.meetup_status.completed.text",
                "tokens.color.meetup_status.cancelled.background",
                "tokens.color.meetup_status.cancelled.border",
                "tokens.color.meetup_status.cancelled.text",
            ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { Label, designSystemMeta }
export type { LabelProps, LabelTone }
