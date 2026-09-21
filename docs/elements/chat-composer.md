# Inventario de `Chat Composer` observado en Wallapop Chat

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-19
- Método: inspección con MCP Chrome DevTools + `getComputedStyle`
- Viewport de referencia: `1536x678` (`devicePixelRatio: 1.25`)
- Contexto: conversación abierta, foco alternado en caja de mensaje

## Validación móvil (responsive)
- Fecha de validación: 2026-02-19
- Viewport: `390x844` (`devicePixelRatio: 1`)
- `CurrentConversation__sendMessageWrapper`: `390.4x74.4px`, `padding: 12px 20px`
- `textarea-component`: `350.4x49.6px`, `padding: 4px 4px 4px 20px`, `border-radius: 24px`
- `textarea.textarea-element`: `284.8x28px`, `16px/24px`, `color: #000000`

## Estructura observada
- Wrapper principal: `.CurrentConversation__sendMessageWrapper`
- Control de entrada: `.textarea-component`
- Campo real: `textarea.textarea-element`

## Especificación visual del componente

### 1) Wrapper de envio
- Elemento/clase: `div.CurrentConversation__sendMessageWrapper`
- Dimensiones observadas: `640x74.4px`
- Padding: `12px 20px`
- Fondo: `#FFFFFF`

### 2) Caja del composer (`textarea-component`)
- Dimensiones observadas: `600x49.6px`
- Padding: `4px 4px 4px 20px`
- Radio: `24px`
- Sombra: `none`

Estados observados:
- `selected` (sin foco):
  - Clase: `textarea-component selected`
  - Borde: `0.8px solid #ECEFF1`
- `focus + selected`:
  - Clase: `textarea-component selected focus`
  - Borde: `0.8px solid #3DD2BA`

### 3) Textarea interno
- Elemento/clase: `textarea.textarea-element`
- Dimensiones observadas: `534.4x28px`
- Tipografía:
  - `16px/24px`, `400`, `Wallie, Helvetica`
- Color texto: `#000000`
- Fondo: `transparent`
- Borde: `none`
- Resize: `none`
- Placeholder:
  - Color: `#90A4AE`
  - `16px/24px`

### 4) Botón de envio
- Implementación observada en referencia: control icon-only (avion de papel) en extremo derecho.
- Comportamiento esperado:
  - `disabled`: fondo `action-disabled-bg`, borde del mismo tono y sin oscurecido adicional por opacidad global.
  - `enabled` (cuando hay texto): fondo y borde en color marca (`#3DD2BA`).
- Accesibilidad: incluir `aria-label` descriptivo del envio.

## Tokens candidatos
- `tokens.color.composer.background = #FFFFFF`
- `tokens.color.composer.border.default = #ECEFF1`
- `tokens.color.composer.border.focus = #3DD2BA`
- `tokens.color.composer.text = #000000`
- `tokens.color.composer.placeholder = #90A4AE`
- `tokens.radius.composer = 24px`
- `tokens.color.composer.submit.enabled = #3DD2BA`
- `tokens.color.composer.submit.disabled = action-disabled-bg`

## Notas de normalización DS
- El estado visual relevante esta en el contenedor (`textarea-component`), no en el `textarea`.
- Mantener `resize: none` para preservar layout fijo del footer de chat.
- El botón de envio debe depender del contenido no vacio (`trim().length > 0`).

## Implementación actual en el repositorio (2026-02-20)
- Componente: `src/components/ui/chat-composer.tsx`.
- Storybook: `Design System/Chat Composer`.
- Layout actual:
  - Wrapper: padding uniforme (`p-2` en móvil, `p-3` en desktop).
  - Caja interna del input: padding simétrico en los cuatro lados (`p-1.5`).
  - El botón de envio (`paper_plane`) se renderiza fuera de la caja del input, alineado a la derecha como acción primaria independiente.
- Acciones disponibles:
  - Acción primaria: botón circular de envio con icono `paper_plane` (externo al input).
  - Acción secundaria opcional: botón circular de meetup con icono `calendar`, dentro de la caja del input y situado a la derecha del textarea.
  - Alineación vertical: input y botones alineados al centro (`items-center`) para evitar desfase visual.
  - Ancho estable del textarea: cuando no existe acción secundaria se reserva el mismo hueco visual del botón (`11x11`/`10x10`) para evitar saltos de tamaño entre variantes.
  - Radio del contenedor del input: `rounded-full` para mantener cápsula completamente redonda en todos los estados.
- Props adicionales de integración meetup:
  - `secondaryActionLabel`
  - `secondaryActionAriaLabel`
  - `secondaryActionIconName`
  - `onSecondaryAction`
  - `secondaryActionDisabled`
- Referencia Living DS:
  - En `Conversation Block Pattern` la acción secundaria se documenta como `Proponer quedar` con icono `calendar`.
