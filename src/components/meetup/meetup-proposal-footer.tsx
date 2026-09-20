import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
type MeetupProposalFooterProps = {
  listingImageSrc?: string
  itemTitle: string
  userName: string
  attendanceRate?: number
  attendanceMeetups?: number
  actionLabel: string
  onAction: () => void
  actionDisabled?: boolean
}

function MeetupProposalFooter({
  listingImageSrc,
  itemTitle,
  userName,
  attendanceRate,
  attendanceMeetups,
  actionLabel,
  onAction,
  actionDisabled = false,
}: MeetupProposalFooterProps) {
  const hasAttendance =
    typeof attendanceRate === "number" &&
    Number.isFinite(attendanceRate) &&
    typeof attendanceMeetups === "number" &&
    attendanceMeetups > 0
  const resolvedAttendanceRate = hasAttendance
    ? Math.max(0, Math.min(100, Math.round(attendanceRate)))
    : null
  const attendanceColorClass =
    resolvedAttendanceRate === null
      ? "text-[color:var(--text-secondary)]"
      : resolvedAttendanceRate > 90
        ? "text-[color:var(--feedback-success-strong)]"
        : resolvedAttendanceRate >= 70
          ? "text-[color:var(--feedback-warning-strong)]"
          : "text-[color:var(--feedback-error-strong)]"
  const attendanceLabel = hasAttendance
    ? resolvedAttendanceRate !== null && resolvedAttendanceRate < 70
      ? "Baja asistencia a quedadas"
      : `${resolvedAttendanceRate}% de asistencia (${attendanceMeetups})`
    : null

  return (
    <div className="mt-3 border-t border-[color:var(--border-divider)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={listingImageSrc}
              alt={itemTitle}
              className="h-[var(--wm-size-42)] w-[var(--wm-size-42)] shrink-0 rounded-[var(--wm-size-12)] object-cover"
            />
            <div className="min-w-0">
              <p className="truncate font-wallie-chunky text-[length:var(--wm-size-15)] leading-tight text-[color:var(--text-primary)]">
                {userName}
              </p>
              {attendanceLabel ? (
                <p className={`truncate font-wallie-fit text-[length:var(--wm-size-12)] leading-tight ${attendanceColorClass}`}>
                  {attendanceLabel}
                </p>
              ) : null}
              <p className="truncate font-wallie-fit text-[length:var(--wm-size-12)] leading-tight text-[color:var(--text-secondary)]">
                {itemTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 font-wallie-chunky text-[length:var(--wm-size-14)] ${
              actionDisabled
                ? "cursor-not-allowed border border-[color:var(--border-strong)] bg-[color:var(--action-disabled-bg)] text-[color:var(--action-disabled-text)] shadow-none"
                : "bg-[color:var(--action-primary)] text-[color:var(--text-on-action)]"
            }`}
            onClick={onAction}
            disabled={actionDisabled}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}


const designSystemMeta = {
    id: "meetup-proposal-footer",
    entityType: "component",
    title: "Meetup Proposal Footer",
    description: "Meetup Proposal Footer del design system de Wallapop Meet.",
    status: "ready",
    states: ["enabled","disabled"],
    storybookTitle: "Design System/Meetup Proposal Footer",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { MeetupProposalFooter, designSystemMeta }
export type { MeetupProposalFooterProps }


