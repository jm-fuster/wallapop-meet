# Tokens de diseño v1 - Wallapop Meet

## Objetivo
Definir una base de tokens consistente, escalable y lista para implementación técnica de Wallapop Meet.

## Estructura propuesta

```text
brand
  name
  system
  typography

tokens
  color
    palette.brand (50..900)
    palette.neutral (50..900)
    palette.reserve (50..900)
    palette.sold (50..900)
    brand
    neutral
    semantic
    text
    background
    border
    overlay
  typography
    family
    weight
    size
    line_height
    letter_spacing
  spacing
  radius
  border
  shadow
  opacity
  motion

components
  button
  card
  banner
  toast
  modal
  input
  badge
  bottom_nav
```

## Convenciones de naming
- Usar jerarquía semántica: `group.category.item.state`.
- Evitar nombres ambiguos como `primary`/`secondary` cuando no expresen intención.
- Ejemplos correctos:
  - `color.text.primary`
  - `color.background.surface`
  - `color.brand.primary`

## Reglas de diseño
- Todos los componentes consumen tokens; no usar hex, px o ms hardcodeados.
- Los tokens semánticos representan intención (`success`, `warning`, `error`, `info`).
- `spacing` y `radius` se consumen por escala (`100`, `200`, ...).
- `motion` define duración + easing reutilizable para transiciones y feedback.

## Capa semántica y aliases cortos (2026-02-26)
- Añadida capa semántica explícita en `tokens.color.semantic` para uso de implementación:
  - `background.base`, `background.surface`, `background.accent_subtle`
  - `text.primary`, `text.secondary`, `text.inverse`, `text.on_action`, `text.on_dark`
  - `action.primary`, `action.primary_hover`, `action.primary_pressed`, `action.disabled_bg`, `action.disabled_text`
  - `border.divider`, `border.strong`, `border.focus`, `border.error`
  - `feedback.success`, `feedback.error`, `feedback.info`
- Alias cortos publicados en CSS global para consumo directo en React/Tailwind:
  - Variables: `--bg-surface`, `--text-primary`, `--action-primary`, `--action-primary-pressed`, `--border-focus`, etc.
  - Convención Tailwind (v4 `@theme`): `text-/bg-/border-<raiz>` (ejemplo: `text-/bg-/border-action-primary`).

## Token `border.bubble` (2026-09-09)
- Añadido `color/border/bubble` en Figma (Semantic): Light `neutral/300` `#d3dee2`, Dark `neutral/700` `#4a5a63`. Alias corto `--border-bubble`.
- Mismo valor que `border.strong` en ambos modos, pero es un token propio: comparte mando único la card de quedada (`MeetupCard`) y la variante `received` de `ChatMessageBubble`, sin arrastrar a los otros 11 componentes que usan `border.divider`/`border.strong` como separador.
- La variante `sent` de `ChatMessageBubble` no lo usa: su trazo coincide con su relleno y no debe verse.

## Mapeo base de botones extraidos de web (2026-02-18)

### Paletas oficiales (50-900)
- `tokens.color.palette.brand`: escala principal Wallapop (`500 = #13C1AC`).
- `tokens.color.palette.neutral`: escala de neutros de interfaz (`50..900`).
- `tokens.color.palette.reserve`: morado comercial de reservado (`500 = #86418A`).
- `tokens.color.palette.sold`: rosa comercial de vendido (`500 = #D32069`).

### Color (`tokens.color.button`)
- `primary.background`: `#3DD2BA`
- `primary.text`: `#29363D`
- `nav.background`: `transparent`
- `nav.text`: `#29363D`
- `tab.background`: `transparent`
- `tab.text`: `#000000`
- `inline_action.background`: `#3DAABF`
- `inline_action.text`: `#FFFFFF`
- `icon.background`: `#ECEFF1`
- `icon.foreground`: `#000000`
- `menu_close.background`: `#FFFFFF`
- `menu_close.foreground`: `#000000`

### Radius (`tokens.radius.button`)
- `pill`: `100px` (`primary`)
- `inline_pill`: `25px` (`inline_action`)
- `menu_close`: `12px`
- `circular`: `50%` (`icon`)

### Border (`tokens.border.button`)
- `primary.width`: `1.6px`
- `primary.color`: `#3DD2BA`
- `inline_action.width`: `0.8px`
- `inline_action.color`: `transparent`

### Typography (`tokens.typography.button`)
- `primary.family`: `WallieChunky`
- `primary.size`: `16px`
- `primary.line_height`: `24px`
- `nav.family`: `WallieFit`
- `nav.size`: `16px`
- `nav.line_height`: `24px`
- `tab.family`: `Wallie, Helvetica`
- `tab.size`: `16px`
- `tab.line_height`: `24px`
- `inline_action.family`: `Wallie, Helvetica`
- `inline_action.size`: `14px`
- `inline_action.line_height`: `21px`

### Shadow (`tokens.shadow.button`)
- `icon`: `0 4px 4px 0 rgba(37, 50, 56, 0.15)`

## Mapeo base de input extraido de web (2026-02-18)

### Color (`tokens.color.input`)
- `text`: `#29363D`
- `label`: `#5C7A89`
- `placeholder_focus`: `#A3B8C1`
- `ring.default`: `#5C7A89`
- `ring.hover`: `#29363D`
- `ring.error`: `#CE3528`
- `ring.success`: `#228618`

### Radius (`tokens.radius.input`)
- `container`: `8px`

### Spacing (`components.input`)
- `padding_y_default`: `20px`
- `padding_y_compact`: `10px`
- `padding_x`: `16px`

### Opacity (`tokens.opacity.input_disabled`)
- `disabled`: `0.4`

## Mapeo mínimo para Wallapop Meet
- Línea de estados del meetup:
  - Estado activo: `color.brand.primary`
  - Estado completado: `color.brand.primary`
  - Estado cancelado: `color.semantic.error.base`
- Acción "Estoy aqui":
  - Botón principal: `components.button.primary`
  - Estado deshabilitado fuera de ventana: `components.button.primary.disabled`
- Chips/labels de estado en `MeetupCard` (fuente de verdad):
  - `tokens.color.meetup_status.pending.{background,border,text}`
  - `tokens.color.meetup_status.confirmed.{background,border,text}`
  - `tokens.color.meetup_status.arrived.{background,border,text}`
  - `tokens.color.meetup_status.completed.{background,border,text}`
  - `tokens.color.meetup_status.cancelled.{background,border,text}`
- El chip usa componente `Label` y, en `MeetupCard`, icono Lucide a la izquierda; tamaño de icono `var(--wm-size-12)` (ver `components-spec-v1.md` seccion 15).
- Mensaje de valoracion post-venta (`ChatMeetRatingPromptBubble`):
  - `tokens.color.meet_rating_prompt.{background,text,cta_background,cta_hover,cta_text,meta,icon_background}`
- Campos de formulario de meetup:
  - Input base: `components.input`
  - Estado error: `components.input.ring_color_error`
  - Estado success: `components.input.ring_color_success`
- Botones de acciones criticas en card:
  - `components.button.critical` debe usar radio tipo pill alineado con `components.button.inline_action`.

## Mapeo de inbox movil (2026-02-19)

### Color (`tokens.color.bottom_nav`)
- `background`: `#FFFFFF`
- `border`: `#D3DEE2`
- `icon_default`: `#6E8792`
- `icon_active`: `#253238`
- `label_default`: `#6E8792`
- `label_active`: `#253238`

### Size & typography (`tokens.bottom_nav`)
- `icon_size`: `20px`
- `label.size`: `11px`
- `label.line_height`: `14px`

### Color (`tokens.color.list_item`)
- `leading_indicator.reserved`: `#86418A`
- `leading_indicator.sold`: `#D32069`
- `delivery.sent`: `#C2CDD3`
- `delivery.read`: `#13C1AC`

### Color (`tokens.color.card.action`)
- `reserve`: `#86418A`
- `sold`: `#D32069`

## Checklist de aceptación v1
- Estructura documentada y aplicada en `styles.json`.
- Cobertura de tokens para color, tipografía, spacing, radius, border, shadow, opacity y motion.
- Componentes críticos (`button`, `card`, `banner`, `toast`, `modal`, `input`, `badge`) definidos por referencia a tokens.
- Preparado para exportación futura a web/app sin romper naming.

## Contrato tipado de consumo (implementado)

- Archivo: `src/design-system/tokens.ts`.
- Objetivo: exponer nombres de token semantico tipados para evitar strings sueltos en componentes.
- API base:
  - `TokenName`: union de keys semanticas soportadas.
  - `tokenVar(token)`: retorna `var(--alias)`.
  - `tokenVarArbitrary(token)`: retorna formato Tailwind arbitrario `[var(--alias)]`.

## Decisiones abiertas (para validar con diseño oficial)
1. Nombre exacto y fallback de familia tipográfica oficial.
2. Escala final de grises neutros.
3. Duraciones finales de motion en iOS y Android.
4. Reglas de elevación por plataforma (si divergen).





