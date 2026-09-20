import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
const buttonVariants = cva(
  "relative inline-flex min-w-0 items-center justify-center whitespace-nowrap font-normal transition-[color,background-color,box-shadow,opacity] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-[var(--wm-size-100)] border-[color:var(--action-primary)] bg-[color:var(--action-primary)] font-wallie-chunky text-[length:var(--wm-size-16)] leading-6 text-[color:var(--text-on-action)] hover:border-[color:var(--action-primary-hover)] hover:bg-[color:var(--action-primary-hover)] active:border-[color:var(--action-primary-pressed)] active:bg-[color:var(--action-primary-pressed)] disabled:border-[color:var(--action-disabled-bg)] disabled:bg-[color:var(--action-disabled-bg)] disabled:text-[color:var(--action-disabled-text)] disabled:opacity-100",
        nav_expandable:
          "rounded-none border-transparent bg-transparent font-wallie-fit text-[length:var(--wm-size-16)] leading-6 text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface)] active:bg-[color:var(--bg-accent-subtle)]",
        tab: "rounded-[var(--wm-size-999)] border-transparent bg-transparent px-4 font-wallie-chunky text-[length:var(--wm-size-16)] leading-6 text-[color:var(--text-primary)] transition-[color,background-color] duration-150 ease-out hover:bg-[color:var(--bg-surface)] active:bg-[color:var(--bg-accent-subtle)] data-[selected=true]:bg-[color:var(--text-primary)] data-[selected=true]:text-[color:var(--bg-base)] aria-selected:bg-[color:var(--text-primary)] aria-selected:text-[color:var(--bg-base)] disabled:bg-transparent disabled:text-[color:var(--action-disabled-text)] disabled:opacity-100",
        inline_action:
          "rounded-[var(--wm-size-25)] border-transparent bg-[color:var(--action-primary)] font-wallie text-[length:var(--wm-size-14)] leading-[var(--wm-size-21)] text-[color:var(--text-on-action)] hover:bg-[color:var(--action-primary-hover)] active:bg-[color:var(--action-primary-pressed)]",
        status_reserve_solid:
          "rounded-[var(--wm-size-25)] border-[color:var(--status-reserved)] bg-[color:var(--status-reserved)] font-wallie-chunky text-[length:var(--wm-size-13)] text-[color:var(--text-inverse)] hover:border-[color:var(--status-reserved-hover)] hover:bg-[color:var(--status-reserved-hover)] active:border-[color:var(--status-reserved-pressed)] active:bg-[color:var(--status-reserved-pressed)]",
        status_reserve_outline:
          "rounded-[var(--wm-size-25)] border border-[color:var(--status-reserved)] bg-[color:var(--bg-base)] font-wallie-chunky text-[length:var(--wm-size-13)] text-[color:var(--status-reserved)] hover:bg-[color:var(--status-reserved-subtle)] active:bg-[color:var(--status-reserved-subtle-strong)]",
        status_sold_solid:
          "rounded-[var(--wm-size-25)] border-[color:var(--status-sold)] bg-[color:var(--status-sold)] font-wallie-chunky text-[length:var(--wm-size-13)] text-[color:var(--text-inverse)] hover:border-[color:var(--status-sold-hover)] hover:bg-[color:var(--status-sold-hover)] active:border-[color:var(--status-sold-pressed)] active:bg-[color:var(--status-sold-pressed)]",
        icon: "rounded-full border-transparent bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] shadow-[var(--wm-shadow-200)] hover:brightness-[0.98] active:brightness-95",
        menu_close:
          "rounded-[var(--wm-size-12)] border-transparent bg-[color:var(--bg-base)] font-wallie text-[length:var(--wm-size-16)] leading-6 text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface)] active:bg-[color:var(--border-divider)]",

        // Legacy aliases: mantener temporalmente para no romper usos existentes.
        outline:
          "rounded-[var(--wm-size-999)] border border-[color:var(--action-link)] bg-[color:var(--bg-base)] font-wallie-chunky text-[length:var(--wm-size-16)] text-[color:var(--action-link)] hover:bg-[color:var(--bg-surface)] active:bg-[color:var(--bg-accent-subtle)]",
        ghost:
          "border-none bg-transparent font-wallie-chunky text-[length:var(--wm-size-16)] text-[color:var(--text-secondary)] underline underline-offset-2 hover:bg-transparent hover:text-[color:var(--text-primary)] active:bg-transparent",
        critical:
          "rounded-[var(--wm-size-25)] border-transparent bg-[color:var(--feedback-error)] text-[color:var(--text-inverse)] hover:brightness-95",
        link:
          "border-none bg-transparent px-0 font-wallie-fit text-[length:var(--wm-size-14)] text-[color:var(--action-link)] underline underline-offset-2 hover:text-[color:var(--action-primary-pressed)] active:text-[color:var(--action-primary-pressed)]",
      },
      size: {
        sm: "h-9 px-3 text-[length:var(--wm-size-14)]",
        md: "h-10 px-6",
        lg: "h-[var(--wm-size-47)] px-2",
        tab: "h-10",
        icon: "size-11 p-0 sm:size-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText = "Cargando...",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  const isDisabled = disabled || loading
  const resolvedSize =
    size ??
    (variant === "icon"
      ? "icon"
      : variant === "tab"
        ? "tab"
        : "md")
  const isIconOnlyVariant = variant === "icon" || variant === "menu_close"

  if (
    import.meta.env.DEV &&
    isIconOnlyVariant &&
    !props["aria-label"] &&
    !props["aria-labelledby"]
  ) {
    // En variantes icon-only, forzamos documentación viva en runtime durante desarrollo.
    console.warn(
      "Button icon-only requiere aria-label o aria-labelledby para accesibilidad."
    )
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={resolvedSize}
      aria-busy={loading}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size: resolvedSize, className }))}
      {...props}
    >
      <span className={cn("inline-flex items-center", loading && "opacity-0")}>
        {children}
      </span>
      {loading ? (
        <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>{loadingText}</span>
        </span>
      ) : null}
    </Comp>
  )
}


const designSystemMeta = {
    id: "button",
    entityType: "component",
    title: "Button",
    description: "Button del design system de Wallapop Meet.",
    status: "ready",
    states: ["default","disabled","loading"],
    storybookTitle: "Design System/Button",
    tokensUsed: [
        "tokens.color.semantic.action.primary",
        "tokens.color.semantic.action.link",
        "tokens.color.semantic.text.on_action",
        "tokens.color.semantic.action.disabled_text",
    ],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { Button, designSystemMeta }
export type { ButtonProps }


