import * as React from "react"
import { createPortal } from "react-dom"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"

const REVIEW_MAX_LENGTH = 150

export type MeetTransactionRatingPayload = {
    stars: number
    salePrice: string
    review: string
}

type MeetTransactionRatingModalProps = {
    open: boolean
    counterpartName: string
    defaultSalePrice: string
    onClose: () => void
    onPublish: (payload: MeetTransactionRatingPayload) => void
}

function listingPriceDigits(raw: string): string {
    return raw.replace(/\D/g, "")
}

function MeetTransactionRatingModal({
    open,
    counterpartName,
    defaultSalePrice,
    onClose,
    onPublish,
}: MeetTransactionRatingModalProps) {
    const titleId = React.useId()
    const [stars, setStars] = React.useState(0)
    const [salePrice, setSalePrice] = React.useState("")
    const [review, setReview] = React.useState("")

    React.useEffect(() => {
        if (!open) {
            return
        }
        setStars(0)
        setSalePrice(listingPriceDigits(defaultSalePrice))
        setReview("")
    }, [open, defaultSalePrice])

    const handlePublish = () => {
        if (stars < 1) {
            return
        }
        onPublish({
            stars,
            salePrice: salePrice.trim(),
            review: review.trim(),
        })
        onClose()
    }

    if (!open || typeof document === "undefined") {
        return null
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[color:var(--overlay-scrim)] p-4"
            role="presentation"
            onClick={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-[var(--wm-size-420)] rounded-[var(--wm-size-20)] bg-[color:var(--bg-base)] p-5 shadow-[var(--wm-shadow-300)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="absolute top-3 right-3">
                    <IconButton
                        label="Cerrar valoración"
                        icon={<WallapopIcon name="cross" size="small" />}
                        variant="menu_close"
                        onClick={onClose}
                        className="h-9 w-9 rounded-full bg-[color:var(--bg-surface)] p-0 text-[color:var(--text-primary)]"
                    />
                </div>
                <h2
                    id={titleId}
                    className="pr-10 font-brand-strong text-[length:var(--wm-size-18)] leading-6 text-[color:var(--text-primary)]"
                >
                    Valora tu experiencia con {counterpartName}
                </h2>
                <p className="mt-2 font-brand-text text-[length:var(--wm-size-14)] leading-5 text-[color:var(--text-secondary)]">
                    Cuántas más estrellas, mejor ha sido tu experiencia.
                </p>

                <div
                    className="mt-5 flex justify-center gap-2"
                    role="group"
                    aria-label="Puntuación de 1 a 5 estrellas"
                >
                    {[1, 2, 3, 4, 5].map((value) => {
                        const filled = value <= stars
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setStars(value)}
                                className="rounded-[var(--wm-size-8)] p-1 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--border-focus)]"
                                aria-label={`${value} de 5 estrellas`}
                                aria-pressed={filled}
                            >
                                <Star
                                    className={cn(
                                        "size-[var(--wm-size-48)]",
                                        filled
                                            ? "fill-[color:var(--meet-rating-prompt-cta)] text-[color:var(--meet-rating-prompt-cta)]"
                                            : "fill-none stroke-[color:var(--meet-rating-prompt-cta)] stroke-[1.75]"
                                    )}
                                />
                            </button>
                        )
                    })}
                </div>

                <div className="mt-6">
                    <Input
                        label="Precio de venta (€)"
                        value={salePrice}
                        onChange={(event) => setSalePrice(event.target.value)}
                        inputMode="decimal"
                        autoComplete="off"
                        showCharCounter={false}
                    />
                </div>

                <div className="mt-4">
                    <div
                        data-slot="rating-review-field"
                        className="relative min-h-[var(--wm-size-110)] rounded-[var(--wm-radius-300)] px-[var(--wm-input-padding-x)] pt-[var(--wm-input-padding-y-default)] pb-[var(--wm-input-padding-y-default)] shadow-[inset_0_0_0_1px_var(--wm-color-input-ring-default)] transition-shadow duration-200 ease-out focus-within:shadow-[inset_0_0_0_2px_var(--wm-color-input-ring-hover)]"
                    >
                        <textarea
                            id="meet-rating-review"
                            name="meet-rating-review"
                            value={review}
                            maxLength={REVIEW_MAX_LENGTH}
                            onChange={(event) => setReview(event.target.value)}
                            placeholder="Escribir valoración (opcional)"
                            rows={4}
                            className="min-h-[var(--wm-size-88)] w-full resize-none border-none bg-transparent p-0 font-brand-text text-[length:var(--wm-size-16)] leading-6 text-[color:var(--wm-color-input-text)] outline-none placeholder:text-[color:var(--wm-color-input-placeholder-focus)]"
                        />
                    </div>
                    <div className="flex justify-end pt-1">
                        <span
                            aria-live="polite"
                            className="font-brand-text text-[length:var(--wm-size-12)] leading-4 text-[color:var(--wm-color-input-label)]"
                        >
                            {review.length}/{REVIEW_MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <Button
                        type="button"
                        size="lg"
                        className="h-[var(--wm-size-47)] w-full rounded-[var(--wm-size-999)] border-[color:var(--meet-rating-prompt-cta)] bg-[color:var(--meet-rating-prompt-cta)] font-brand-strong text-[length:var(--wm-size-16)] text-[color:var(--meet-rating-prompt-cta-text)] hover:border-[color:var(--meet-rating-prompt-cta-hover)] hover:bg-[color:var(--meet-rating-prompt-cta-hover)] active:border-[color:var(--meet-rating-prompt-cta-hover)] active:bg-[color:var(--meet-rating-prompt-cta-hover)] disabled:border-[color:var(--action-disabled-bg)] disabled:bg-[color:var(--action-disabled-bg)] disabled:text-[color:var(--action-disabled-text)]"
                        disabled={stars < 1}
                        onClick={handlePublish}
                    >
                        Publícalo
                    </Button>
                </div>
            </section>
        </div>,
        document.body
    )
}

const designSystemMeta = {
    id: "meet-transaction-rating-modal",
    entityType: "component",
    title: "Meet Transaction Rating Modal",
    description:
        "Modal para valorar la experiencia tras una venta completada: estrellas, precio de venta y comentario opcional.",
    status: "ready",
    states: ["default"],
    storybookTitle: "Design System/Meet Transaction Rating Modal",
    tokensUsed: [
        "tokens.color.meet_rating_prompt.cta_background",
        "tokens.color.meet_rating_prompt.cta_hover",
        "tokens.color.meet_rating_prompt.cta_text",
        "tokens.color.overlay.scrim",
    ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { MeetTransactionRatingModal, designSystemMeta, REVIEW_MAX_LENGTH }
