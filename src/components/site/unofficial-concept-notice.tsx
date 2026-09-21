/**
 * Aviso de concepto no oficial, fijo en la parte superior de la demo.
 *
 * El README lleva el descargo desde el primer dia, pero el README no viaja con el
 * deploy: quien entra por la URL se encuentra una interfaz de alta fidelidad con el
 * nombre y el copy de una marca real, y hasta ahora lo unico que decia "no oficial"
 * era el <title> de la pestana — invisible en una captura de pantalla.
 *
 * Dos decisiones deliberadas:
 *
 * - **Vive fuera del producto simulado.** Usa tokens del sistema, pero no la forma
 *   de ningun componente del catalogo (nada de NoticeBanner): si pareciera UI de
 *   Wallapop, se leeria como si lo dijera Wallapop.
 * - **No se puede cerrar.** Un aviso descartable desaparece justo en el momento en
 *   que alguien comparte la pantalla, que es cuando mas falta hace.
 *
 * El alto vive en `--wm-disclaimer-h` (src/index.css) porque las dos pantallas lo
 * descuentan de su alto de viewport.
 */
const REPO_README_URL = "https://github.com/jm-fuster/wallapop-meet#readme"

function UnofficialConceptNotice() {
    return (
        <aside
            aria-label="Aviso sobre este proyecto"
            className="fixed inset-x-0 top-0 z-50 flex h-[var(--wm-disclaimer-h)] items-center justify-center gap-2 border-b border-[color:var(--border-strong)] bg-[color:var(--bg-surface)] px-3 font-brand-text text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]"
        >
            <p className="min-w-0 truncate">
                <span className="font-brand-strong text-[color:var(--text-primary)]">
                    Concepto no oficial
                </span>
                <span className="hidden sm:inline">
                    {" · ejercicio de diseño sin afiliación con Wallapop S.L."}
                </span>
                <span className="sm:hidden">{" · sin relación con Wallapop S.L."}</span>
            </p>
            <a
                href={REPO_README_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-[var(--wm-size-4)] underline underline-offset-2 transition-colors hover:text-[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--border-focus)]"
            >
                Qué es esto
            </a>
        </aside>
    )
}

export { UnofficialConceptNotice }
