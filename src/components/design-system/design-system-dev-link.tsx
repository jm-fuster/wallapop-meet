import { navigateTo } from "@/lib/navigation"

function DesignSystemDevLink() {
    if (window.location.pathname === "/design-system") {
        return null
    }

    return (
        <button
            type="button"
            className="fixed right-4 bottom-4 z-50 block rounded-[var(--wm-size-999)] border border-[color:var(--border-divider)] bg-[color:var(--bg-base)] px-3 py-2 font-brand-text text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)] shadow-[var(--wm-shadow-100)] transition-colors hover:bg-[color:var(--bg-accent-subtle)] hover:text-[color:var(--text-primary)]"
            onClick={() => navigateTo("/design-system")}
        >
            Design System
        </button>
    )
}

export { DesignSystemDevLink }

