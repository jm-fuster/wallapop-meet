import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"

export const MEET_RATING_PROMPT_COPY =
    "¿Cómo ha ido? Valora tu experiencia con este usuario, será útil para nuestra comunidad."

export const MEET_RATING_THANK_YOU_COPY =
    "¡Gracias! Otras personas apreciarán tu valoración."

type ChatMeetRatingPromptBubbleProps = {
    time: string
    completed?: boolean
    onValorar?: () => void
    className?: string
}

function ChatMeetRatingPromptBubble({
    time,
    completed = false,
    onValorar,
    className,
}: ChatMeetRatingPromptBubbleProps) {
    return (
        <div
            data-slot="chat-meet-rating-prompt-bubble"
            data-completed={completed ? "true" : "false"}
            className={cn(
                "inline-block max-w-[88%] rounded-[var(--wm-size-20)] bg-[color:var(--meet-rating-prompt-bg)] px-3 py-3 sm:max-w-[80%]",
                className
            )}
        >
            <div className="flex gap-3">
                <div
                    className="flex size-[var(--wm-size-34)] shrink-0 items-center justify-center rounded-full bg-[color:var(--meet-rating-prompt-icon-bg)] shadow-[var(--wm-shadow-100)]"
                    aria-hidden
                >
                    <WallapopIcon
                        name="bot"
                        size={22}
                        strokeWidth={1.5}
                        className="text-[color:var(--meet-rating-prompt-text)]"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-brand-text text-[length:var(--wm-size-16)] leading-5 text-[color:var(--meet-rating-prompt-text)]">
                        {MEET_RATING_PROMPT_COPY}
                    </p>
                    {completed ? (
                        <p
                            role="status"
                            className="mt-3 font-brand-strong text-[length:var(--wm-size-16)] leading-5 text-[color:var(--meet-rating-prompt-text)]"
                        >
                            <span aria-hidden className="mr-1">
                                ✓
                            </span>
                            {MEET_RATING_THANK_YOU_COPY}
                        </p>
                    ) : (
                        <div className="mt-3 flex justify-center">
                            <button
                                type="button"
                                aria-label="Valorar experiencia con este usuario"
                                onClick={() => onValorar?.()}
                                className="h-10 min-w-[var(--wm-size-200)] rounded-[var(--wm-size-999)] bg-[color:var(--meet-rating-prompt-cta)] px-6 font-brand-strong text-[length:var(--wm-size-16)] text-[color:var(--meet-rating-prompt-cta-text)] shadow-[var(--wm-shadow-inset-cta)] transition-colors hover:bg-[color:var(--meet-rating-prompt-cta-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--border-focus)] active:bg-[color:var(--meet-rating-prompt-cta-hover)]"
                            >
                                Valorar
                            </button>
                        </div>
                    )}
                    <p className="mt-2 text-right font-brand-text text-[length:var(--wm-size-14)] leading-[var(--wm-size-14)] text-[color:var(--meet-rating-prompt-meta)]">
                        {time}
                    </p>
                </div>
            </div>
        </div>
    )
}

const designSystemMeta = {
    id: "chat-meet-rating-prompt-bubble",
    entityType: "component",
    title: "Chat Meet Rating Prompt Bubble",
    description:
        "Mensaje de Wally tras venta completada en Wallapop Meet: invitacion a valorar con WallapopIcon bot.",
    status: "ready",
    states: ["default", "completed"],
    storybookTitle: "Design System/Chat Meet Rating Prompt Bubble",
    tokensUsed: [
        "tokens.color.meet_rating_prompt.background",
        "tokens.color.meet_rating_prompt.text",
        "tokens.color.meet_rating_prompt.cta_background",
        "tokens.color.meet_rating_prompt.cta_hover",
        "tokens.color.meet_rating_prompt.cta_text",
        "tokens.color.meet_rating_prompt.meta",
        "tokens.color.meet_rating_prompt.icon_background",
    ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { ChatMeetRatingPromptBubble, designSystemMeta }
