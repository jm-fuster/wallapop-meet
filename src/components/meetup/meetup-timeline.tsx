import type { MeetupStatus } from "@/meetup/types"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"

const FLOW_STATUSES: MeetupStatus[] = [
    "PROPOSED",
    "COUNTER_PROPOSED",
    "CONFIRMED",
    "ARRIVED",
]

// COMPLETED y CANCELLED son terminales mutuamente excluyentes (ver state-machine.ts):
// el timeline solo muestra el terminal que aplica a la quedada actual.
const STEP_LABELS: Record<MeetupStatus, string> = {
    PROPOSED: "propuesta",
    COUNTER_PROPOSED: "contrapropuesta",
    CONFIRMED: "confirmada",
    ARRIVED: "has llegado",
    COMPLETED: "completada",
    CANCELLED: "cancelada",
}

type MeetupTimelineProps = {
    currentStatus: MeetupStatus | null
}

function getVisibleSteps(currentStatus: MeetupStatus | null): MeetupStatus[] {
    return [...FLOW_STATUSES, currentStatus === "CANCELLED" ? "CANCELLED" : "COMPLETED"]
}

function getStepAppearance(
    step: MeetupStatus,
    currentStatus: MeetupStatus | null
): "pending" | "active" | "done" | "terminal" | "terminalSuccess" {
    if (!currentStatus) {
        return "pending"
    }

    // Con la quedada cancelada no se puede afirmar hasta donde llego el flujo
    // solo con el estado actual: los pasos intermedios quedan neutros.
    if (currentStatus === "CANCELLED") {
        return step === "CANCELLED" ? "terminal" : "pending"
    }

    if (step === currentStatus) {
        if (step === "COMPLETED") {
            return "terminalSuccess"
        }
        return "active"
    }

    const order: MeetupStatus[] = [...FLOW_STATUSES, "COMPLETED"]
    const stepIndex = order.indexOf(step)
    const currentIndex = order.indexOf(currentStatus)

    if (stepIndex >= 0 && currentIndex >= 0 && stepIndex < currentIndex) {
        return "done"
    }

    return "pending"
}

const stepClassName: Record<
    ReturnType<typeof getStepAppearance>,
    { dot: string; text: string }
> = {
    pending: {
        dot: "bg-[color:var(--border-strong)]",
        text: "text-[color:var(--text-secondary)]",
    },
    active: {
        dot: "bg-[color:var(--action-primary)]",
        text: "text-[color:var(--text-primary)]",
    },
    done: {
        dot: "bg-[color:var(--text-primary)]",
        text: "text-[color:var(--text-primary)]",
    },
    terminal: {
        dot: "bg-[color:var(--feedback-error)]",
        text: "text-[color:var(--text-primary)]",
    },
    terminalSuccess: {
        dot: "bg-[color:var(--feedback-success)]",
        text: "text-[color:var(--text-primary)]",
    },
}

function MeetupTimeline({ currentStatus }: MeetupTimelineProps) {
    return (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Estado de la quedada">
            {getVisibleSteps(currentStatus).map((step) => {
                const appearance = getStepAppearance(step, currentStatus)
                const styles = stepClassName[appearance]
                return (
                    <li key={step} className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className={`inline-block size-2.5 rounded-full ${styles.dot}`}
                        />
                        <span className={`font-brand-text text-[length:var(--wm-size-13)] leading-5 ${styles.text}`}>
                            {STEP_LABELS[step]}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}

const designSystemMeta = {
    id: "meetup-timeline",
    entityType: "component",
    title: "Meetup Timeline",
    description: "Meetup Timeline del design system de Wallapop Meet.",
    status: "ready",
    states: ["PROPOSED", "COUNTER_PROPOSED", "CONFIRMED", "ARRIVED", "COMPLETED", "CANCELLED"],
    storybookTitle: "Design System/Meetup Timeline",
    tokensUsed: [
        "tokens.color.semantic.border.strong",
        "tokens.color.semantic.action.primary",
        "tokens.color.semantic.text.primary",
        "tokens.color.semantic.text.secondary",
        "tokens.color.semantic.feedback.error",
        "tokens.color.semantic.feedback.success",
    ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { MeetupTimeline, designSystemMeta }
