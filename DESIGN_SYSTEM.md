# DESIGN SYSTEM - Wallapop Meet

## 1. Proposito y alcance

Este documento define la **Fuente de la Verdad** del sistema de diseño de Wallapop Meet para asegurar consistencia visual, escalabilidad y gobernanza técnica.

Alcance v1:
- Canon de tokens y reglas de consumo.
- Precedencia de fuentes cuando hay conflictos.
- Reglas estrictas para código nuevo.
- Patrones base de UI (sin duplicar documentación detallada ya existente).
- Reglas mínimas de accesibilidad.

Fuera de alcance v1:
- Redefinir componentes ya especificados en detalle en `docs/elements/*` y `plans/design-system/*`.
- Introducir nuevos tokens sin proceso de aprobación.

## 2. Fuente de verdad y precedencia

Orden oficial de precedencia:
1. `styles.json` (canon de tokens y contratos base de componentes).
2. `src/index.css` (capa runtime de variables CSS y aliases de tema).
3. `src/design-system/tokens.ts` (contrato tipado de consumo de tokens semánticos en TS/TSX).
4. Implementación de componentes en `src/components/*` (referencia de estado actual, no canon si contradice tokens).

Regla de conflicto:
- Si existe diferencia entre implementación y token, **prevalece el token**.
- Cualquier hardcode actual se registra como deuda de migración (sección 9).

## 3. Design Tokens (catalogo normativo)

Fuente canónica: `styles.json`.

### 3.1 Color

Namespaces oficiales:
- `tokens.color.palette.brand`: `50..900`
- `tokens.color.palette.neutral`: `50..900`
- `tokens.color.palette.reserve`: `50..900`
- `tokens.color.palette.sold`: `50..900`
- `tokens.color.palette.warning`: `50..900`
- `tokens.color.palette.error`: `50..900`
- `tokens.color.brand`: `primary`, `primary_hover`, `on_primary`
- `tokens.color.neutral`: `0`, `100`, `200`, `400`, `700`, `900`
- `tokens.color.semantic`:
  - `background.base`, `background.surface`, `background.accent_subtle`
  - `text.primary`, `text.secondary`, `text.inverse`, `text.on_action`, `text.on_dark`
  - `action.primary`, `action.primary_hover`, `action.primary_pressed`, `action.disabled_bg`, `action.disabled_text`
  - `border.divider`, `border.strong`, `border.focus`, `border.error`
  - `feedback.success`, `feedback.error`, `feedback.info`
  - `warning.base`, `error.base`
- `tokens.color.text`: `primary`, `secondary`, `inverse`, `disabled`
- `tokens.color.background`: `base`, `surface`, `accent`
- `tokens.color.border`: `default`, `focus`, `error`
- `tokens.color.input`: `text`, `label`, `placeholder_focus`, `ring.default`, `ring.hover`, `ring.error`, `ring.success`
- `tokens.color.overlay`: `scrim`
- Extensiones de dominio UI: `tokens.color.bottom_nav.*`, `tokens.color.list_item.*`, `tokens.color.card.action.*`
- Estados de labels en meetup card: `tokens.color.meetup_status.*` (`pending`, `confirmed`, `arrived`, `completed`, `expired`, `cancelled`) con `background`, `border`, `text`.

### 3.2 Tipografía

Namespaces oficiales:
- `tokens.typography.family.primary`
- `tokens.typography.weight`: `regular`, `medium`, `semibold`, `bold`
- `tokens.typography.size`: `100`, `200`, `300`, `400`, `500`
- `tokens.typography.line_height`: `100`, `200`, `300`
- `tokens.typography.letter_spacing.normal`

Runtime en `src/index.css`:
- `--font-wallie`, `--font-wallie-fit`, `--font-wallie-chunky`

### 3.3 Spacing

Escala oficial:
- `tokens.spacing.0`, `100`, `200`, `300`, `400`, `500`, `600`
- Correspondencia actual: `0, 4, 8, 12, 16, 24, 32 px`

Regla:
- Solo valores en multiplo de 4px.
- Priorizar spacing tokens por encima de valores ad-hoc.

### 3.4 Radius, border, shadow, opacity, motion

- Radius: `tokens.radius.100`, `200`, `300`, `pill`
- Border width: `tokens.border.width.none`, `thin`, `thick`
- Shadow: `tokens.shadow.100`, `200`
- Opacity: `tokens.opacity.disabled`, `input_disabled`, `overlay`
- Motion:
  - Duration: `fast`, `base`, `slow`
  - Easing: `standard`, `emphasized`

## 4. Reglas de arquitectura UI

### 4.0 Storybook como validación de fuente de verdad

- Las stories en `Design System/*` deben renderizar componentes que consuman tokens del canon (`styles.json` + aliases de `src/index.css`).
- Si hay conflicto visual entre una story y tokens, prevalece token y la story se actualiza.
- En componentes documentados en Storybook no se aceptan nuevos hex hardcodeados para color.

### 4.1 Semántica de color

- `semantic.error`: fallos bloqueantes, acciones destructivas, invalidaciones.
- `semantic.warning`: riesgo o atención requerida sin bloqueo.
- `success`: usar `brand` (Wallapop no usa familia de success separada).

### 4.2 Fondos y superficies

- `background.base`: lienzo principal y cards primarias.
- `background.surface`: planos secundarios, estados de apoyo, agrupaciones.
- `background.accent`: highlights de baja intensidad.

### 4.3 Estados obligatorios

Todo componente interactivo nuevo debe cubrir explicitamente:
- `disabled`
- `loading` (si aplica acción asincrona)
- `error` (si maneja validación o fallo)

### 4.4 Regla absoluta de hardcoding

En código nuevo esta prohibido:
- Colores hex directos (`#xxxxxx`)
- Espaciados/radios/tamaños no tokenizados (ej. `13px`, `22px`)
- Sombras y opacidades fuera del sistema

Excepciones:
- Solo en capa canónica de token (`styles.json`, `src/index.css`) y casos técnicos documentados.
- Cualquier excepción debe registrarse en baseline del auditor DS.

### 4.5 Guardrails automáticos (obligatorio)

- Script de auditoría: `scripts/audit-design-system.mjs`.
- Sincronización DS (inventario + metadata + stories + tokens): `scripts/sync-design-system.mjs`.
- Configuración de excepciones: `.design-system-audit.config.json`.
- Baseline versionado: `.design-system-audit-baseline.json`.
- Integración obligatoria en lint: `npm run lint` ejecuta auditoría DS antes de ESLint.
- Regla operativa: no se aceptan nuevas incidencias fuera del baseline.
- Regla operativa adicional: no se acepta componente/pattern alcanzable desde `App` sin `designSystemMeta` y story `Design System/*` sincronizada.

## 5. Patrones de componentes (resumen operacional)

Nota: la especificación detallada vive en `docs/elements/*` y `plans/design-system/*`.

### 5.1 Button

Anatomía mínima:
- Contenedor interactivo
- Label
- Slot de icono (leading/trailing/only)
- Estado `loading` con ancho estable

Regla:
- Si un flujo necesita CTA, se reutiliza `<Button />` base.
- Variantes de uso operativo:
  - `primary`: acción principal.
  - `secondary`: outline (ejemplo: `Anadir a Calendar`).
  - `ghost`: texto sin borde/fondo.
  - `link`: enlace textual contextual.

### 5.2 Card (incluye MeetupCard)

Anatomía recomendada:
- Header (título + chip de estado: `Label` con texto en minusculas e icono a la izquierda según mapeo de `components-spec-v1` sección 15)
- Bloque de contenido estructurado
- Stack de acciones (primaria/secundaria/destructiva)
- Metadata secundaria (ej. hora)

Regla:
- Mantener jerarquía de lectura y consistencia de spacing por escala.

### 5.3 Modal

Anatomía mínima:
- Scrim/overlay
- Contenedor
- Título + cuerpo
- Footer de acciones

Regla:
- Confirmaciones destructivas deben usar variante y copy explicito.

### 5.4 Formularios

Componentes base:
- `<Input />`
- `<Select />`
- `CalendarPicker`

Reglas:
- Label persistente (no depender de placeholder)
- Helper/error bajo campo
- `error` prevalece sobre `hint`

## 6. Accesibilidad mínima (a11y)

- Contraste mínimo AA para texto y CTAs.
- Focus visible en cualquier elemento interactivo.
- Área táctil mínima de `44x44` en controles accionables en móvil.
- Inputs con `aria-invalid` y `aria-describedby` cuando aplique.
- Contadores y feedback dinámico con `aria-live` cuando aplique.
- Estados no comunicados unicamente por color.
- Botones icon-only con nombre accesible (`aria-label` o `aria-labelledby`).

## 7. System Guidelines (reglas estrictas) + ejemplos Tailwind

### 7.1 Reglas obligatorias para código nuevo

- No hardcodear tokens visuales.
- Reusar componentes base antes de crear equivalentes nativos.
- Alinear layout y spacing a grid de 4px/8px.
- Mantener variantes y estados del DS en lugar de inventar variantes locales.

### 7.2 Ejemplos permitidos (stack actual)

Uso de componente base:

```tsx
<Button variant="primary" size="sm">Aceptar</Button>
```

Consumo tokenizado de color/radius:

```tsx
<div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-[var(--wm-radius-300)]" />
```

Consumo tokenizado en input:

```tsx
<input className="px-[var(--wm-input-padding-x)] text-[var(--wm-color-input-text)]" />
```

Consumo tokenizado de borde y ring:

```tsx
<div className="border border-[var(--wm-color-border-default)] focus-within:ring-2 focus-within:ring-[var(--wm-color-border-focus)]" />
```

### 7.3 No permitido vs permitido

No permitido:

```tsx
<div className="bg-[#4CAF50] px-[13px] rounded-[7px]" />
```

Permitido:

```tsx
<div className="bg-[var(--action-primary)] px-[var(--wm-input-padding-x)] rounded-[var(--wm-radius-300)]" />
```

No permitido:

```tsx
<button className="h-[39px]">Aceptar</button>
```

Permitido:

```tsx
<Button variant="primary" size="sm">Aceptar</Button>
```

## 8. Mapa de documentación existente (enlaces, sin duplicación)

### 8.1 Especificaciones de sistema

- `plans/design-system/design-system-wallapop-meet-plan.md`
- `plans/design-system/design-tokens-v1.md`
- `plans/design-system/components-spec-v1.md`
- `plans/design-system/meetup-ui-patterns-v1.md`
- `plans/design-system/accessibility-qa-checklist.md`

### 8.2 Inventario de componentes y elementos

- `docs/elements/buttons.md`
- `docs/elements/Input.md`
- `docs/elements/badge.md`
- `docs/elements/chat-product-card.md`
- `docs/elements/chat-counterpart-card.md`
- `docs/elements/chat-composer.md`
- `docs/elements/chat-list-item.md`
- `docs/elements/chat-message-bubble.md`
- `docs/elements/chat-security-banner.md`
- `docs/elements/icons.md`
- `docs/elements/inbox-bottom-nav.md`
- `docs/elements/meetup-proposal-overlay.md`

## 9. Deuda de migración y checklist

### 9.1 Deuda de migración detectada (inicial)

| Archivo | Situación actual | Token/contrato objetivo | Prioridad |
| --- | --- | --- | --- |
| `src/components/ui/button.tsx` | Migrado a aliases semánticos en variantes principales (`primary`, `secondary`, `ghost`, `critical`, `link`) | Completar migración de variantes de nicho restantes y normalizar tamaños/radios | Media |
| `src/components/ui/badge.tsx` | Migrado a aliases semánticos (`feedback.*`, `text.inverse`) y dominio (`status-sold`) | Mantener sincronizado con `styles.json` si cambia semántica de estados | Baja |
| `src/components/ui/chat-product-card.tsx` | Migrado a aliases semánticos para fondos, bordes, texto y estados de listing | Sustituir colores de dominio por tokens de componente si se formalizan en `styles.json` | Media |
| `src/components/meetup/meetup-card.tsx` | Migrado a aliases semánticos en superficies, texto, estados y acciones; quedan sombras inline puntuales | Completar extracción de sombras a tokens/component contracts | Media |
| `src/components/meetup/meetup-timeline.tsx` | Migrado a aliases semánticos en puntos y texto | Sin acciones pendientes de color | Baja |
| `src/components/meetup/meetup-proposal-header.tsx` | Migrado a aliases semánticos en texto y progreso | Sin acciones pendientes de color | Baja |
| `src/components/meetup/meetup-proposal-footer.tsx` | Migrado a aliases semánticos en estados, textos y CTA | Revisar token específico para warning surface si diseño lo exige | Baja |
| `src/components/meetup/meetup-wizard-step-heading.tsx` | Migrado a aliases semánticos en icon-button y tipografía | Sin acciones pendientes de color | Baja |
| `src/components/meetup/meetup-location-map.tsx` | Migrado a colores resueltos desde aliases semánticos para marcadores y bordes | Mantener fallback hex solo como respaldo runtime | Baja |
| `src/components/ui/input.tsx` | Usa tokens para color/ring, pero mezcla tamaños tipográficos y espaciados literales | Completar tokenización de tamaños/spacing tipográfico | Media |
| `src/index.css` | Capa de aliases semánticos ampliada (action/text/border/feedback + estados de dominio de listing) | Mantener cobertura completa cuando se añadan tokens nuevos | Baja |

### 9.2 Checklist obligatorio para PRs UI

- [ ] No hay hex/px/ms hardcodeados para estilos de producto.
- [ ] `npm run audit:design-system` sin incidencias nuevas.
- [ ] Se reutilizan componentes base (`Button`, `Input`, etc.).
- [ ] Se cubren estados `disabled`, `loading`, `error`.
- [ ] Contraste y foco cumplen reglas mínimas de a11y.
- [ ] Área táctil mínima `44x44` en acciones móviles.
- [ ] Layout alineado a grid 4px/8px.
- [ ] Stories ubicadas en `Design System/*` cuando aplique.
- [ ] Se verifica `npx convex dev` antes de cerrar la tarea.

---

## Contratos operativos (vigentes desde este documento)

- `styles.json` queda fijado como canon del DS.
- `DESIGN_SYSTEM.md` es documento maestro de gobernanza.
- La especificación detallada por componente permanece en su documentación actual enlazada en la sección 8.
