import * as React from "react"
import { createPortal } from "react-dom"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"

type WalletTopUpSheetProps = {
    open: boolean
    onClose: () => void
    /** Importe minimo sugerido (p. ej. lo que falta para aceptar la quedada). */
    minSuggestedAmountEur: number
    onConfirmTopUp: (amountEur: number) => void
}

function WalletTopUpSheet({ open, onClose, minSuggestedAmountEur, onConfirmTopUp }: WalletTopUpSheetProps) {
    const [rawAmount, setRawAmount] = React.useState(() =>
        String(Math.max(0, Math.ceil(minSuggestedAmountEur)))
    )

    React.useEffect(() => {
        if (open) {
            setRawAmount(String(Math.max(0, Math.ceil(minSuggestedAmountEur))))
        }
    }, [open, minSuggestedAmountEur])

    const parsed = parseFloat(rawAmount.replace(",", "."))
    const amountValid = Number.isFinite(parsed) && parsed > 0
    const amountEur = amountValid ? parsed : 0

    const handleSubmit = () => {
        if (!amountValid) {
            return
        }
        onConfirmTopUp(amountEur)
        onClose()
    }

    if (!open || typeof document === "undefined") {
        return null
    }

    return createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col bg-[color:var(--bg-base)]">
            <header className="flex shrink-0 items-center gap-2 border-b border-[color:var(--border-divider)] px-3 py-3">
                <IconButton
                    label="Cerrar recarga del monedero"
                    icon={<ArrowLeft size={22} />}
                    variant="menu_close"
                    className="h-10 w-10 rounded-full bg-transparent p-0 text-[color:var(--text-primary)]"
                    onClick={onClose}
                />
                <h1 className="min-w-0 flex-1 text-center font-brand-strong text-[length:var(--wm-size-18)] text-[color:var(--text-primary)]">
                    Recarga el monedero
                </h1>
                <a
                    href="https://ayuda.wallapop.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-brand-text text-[length:var(--wm-size-14)] text-[color:var(--action-link)]"
                >
                    ¿Dudas?
                </a>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                <p className="font-brand-strong text-[length:var(--wm-size-18)] leading-tight text-[color:var(--text-primary)]">
                    ¿Cuanto dinero quieres recargar?
                </p>

                <div className="mt-4 rounded-[var(--wm-size-16)] border border-[color:var(--border-divider)] bg-[color:var(--bg-base)] p-4 shadow-[var(--wm-shadow-200)]">
                    <div className="flex items-baseline justify-center gap-1">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={rawAmount}
                            onChange={(e) => setRawAmount(e.target.value)}
                            className="w-full max-w-[var(--wm-size-280)] border-0 bg-transparent p-0 text-center font-brand-strong text-[length:var(--wm-size-34)] leading-none text-[color:var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-focus)] focus-visible:ring-offset-2"
                            aria-label="Importe a recargar en euros"
                        />
                        <span className="font-brand-strong text-[length:var(--wm-size-28)] text-[color:var(--text-primary)]">
                            €
                        </span>
                    </div>
                    <div className="mt-3 border-t border-[color:var(--border-divider)] pt-3">
                        <p className="text-center font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--action-link)]">
                            Tarifa segun el importe de la recarga.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="primary"
                        className="mt-4 h-11 w-full rounded-[var(--wm-size-12)] font-brand-strong text-[length:var(--wm-size-16)]"
                        disabled={!amountValid}
                        onClick={handleSubmit}
                    >
                        Recargar monedero
                    </Button>
                </div>

                <div className="mt-8">
                    <p className="font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-tertiary)]">
                        Metodo de pago
                    </p>
                    <div className="mt-2 border-t border-[color:var(--border-divider)] pt-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-brand-text text-[length:var(--wm-size-15)] text-[color:var(--text-primary)]">
                                    Tarjeta bancaria
                                </p>
                                <p className="mt-0.5 font-brand-text text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]">
                                    Tarjeta terminada en 4242
                                </p>
                            </div>
                            <button
                                type="button"
                                className="shrink-0 font-brand-text text-[length:var(--wm-size-14)] text-[color:var(--action-link)]"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

const designSystemMeta = {
    id: "wallet-top-up-sheet",
    entityType: "component",
    title: "Wallet Top Up Sheet",
    description:
        "Pantalla completa (portal) para recargar Wallapop Wallet cuando el comprador acepta una quedada con pago Wallet y falta saldo. Cabecera con volver, titulo y enlace de ayuda; importe editable; CTA Recargar; bloque metodo de pago de referencia.",
    status: "ready",
    states: ["default", "invalid_amount"],
    storybookTitle: "Design System/Wallet Top Up Sheet",
    tokensUsed: [
        "tokens.color.semantic.action.primary",
        "tokens.color.semantic.text.primary",
        "tokens.color.semantic.border.divider",
    ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { WalletTopUpSheet, designSystemMeta }
