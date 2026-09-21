import { WallapopIcon } from "@/components/ui/wallapop-icon"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type MeetupWizardStepHeadingProps = {
  caption: string
  title?: string
  onBack: () => void
}

function MeetupWizardStepHeading({
  caption,
  title,
  onBack,
}: MeetupWizardStepHeadingProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver al paso anterior"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]"
          onClick={onBack}
        >
          <WallapopIcon name="arrow_left" size="small" />
        </button>
        <span className="font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-secondary)]">{caption}</span>
      </div>
      {title ? (
        <h3 className="font-brand-strong text-[length:var(--wm-size-20)] leading-[1.12] text-[color:var(--text-primary)] md:text-[length:var(--wm-size-22)]">
          {title}
        </h3>
      ) : null}
    </div>
  )
}


const designSystemMeta = {
    id: "meetup-wizard-step-heading",
    entityType: "component",
    title: "Meetup Wizard Step Heading",
    description: "Meetup Wizard Step Heading del design system de Wallapop Meet.",
    status: "ready",
    states: ["with_title","caption_only"],
    storybookTitle: "Design System/Meetup Wizard Step Heading",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { MeetupWizardStepHeading, designSystemMeta }
export type { MeetupWizardStepHeadingProps }


