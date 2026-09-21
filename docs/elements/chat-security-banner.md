# Inventario de `Security Banner` observado en Wallapop Chat

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-19
- Método: inspección con MCP Chrome DevTools + `getComputedStyle`
- Viewport de referencia: `1536x678` (`devicePixelRatio: 1.25`)
- Contexto: conversación abierta (banner de seguridad visible)

## Validación móvil (responsive)
- Fecha de validación: 2026-02-19
- Viewport: `390x844` (`devicePixelRatio: 1`)
- `ChatSecurityNotification`: `390.4x78px`
- Padding: `16px 16px 8px`
- El texto y enlace mantienen la misma jerarquía tipográfica.

## Especificación visual del componente

### 1) `banner.security`
- Elemento/clase: `div.ChatSecurityNotification.ChatSecurityNotification__variant`
- Dimensiones observadas: `548x60px`
- Padding: `16px 16px 8px`
- Fondo: `#FFFFFF`
- Borde: `none`
- Radio: `0`

### 2) Texto principal
- Nodo: `span.me-1`
- Tipografía:
  - `12px/18px`, `400`, `Wallie, Helvetica`
- Color: `#212529`
- Ejemplo: `Quedate en Wallapop. Mas facil, mas seguro...`

### 3) Enlace secundario
- Nodo: enlace interno del banner
- Texto: `Preguntas? Habla con nuestro chatbot`
- Tipografía:
  - `12px/16px`, `400`, `WallieFit`
- Color: `#038673`
- Decoración: `underline`

### 4) Icono de seguridad
- Nodo: `walla-icon.ChatSecurityNotification__shieldIconWrapper`
- Tamaño contenedor: `24x24px`
- Background contenedor: `#F0F3F5`
- Radio: `8px`
- Iconografía: web component `walla-icon` (icono de escudo)
- Color del glyph observado: `#13C1AC`

## Tokens candidatos
- `tokens.color.banner.security.background = #FFFFFF`
- `tokens.color.banner.security.text = #212529`
- `tokens.color.banner.security.link = #038673`
- `tokens.typography.banner.security.body = 12/18`
- `tokens.typography.banner.security.link = 12/16`

## Notas de normalización DS
- En Wallapop chat este banner funciona como aviso persistente contextual (no toast).
- Para Meetup conviene mapearlo a `Banner` no descartable mientras la condición de seguridad siga activa.
- Alineación vertical recomendada: icono y bloque de texto centrados sobre el eje Y (`align-items: center`).

## Implementación actual en el repositorio (2026-02-20)
- Componente: `src/components/ui/chat-security-banner.tsx`.
- Storybook: `Design System/Chat Security Banner`.
- Integración en chat workspace:
  - Se renderiza fijo justo encima del composer en `src/components/meetup/wallapop-chat-workspace.tsx`.
  - Variante compacta para no ocupar demasiado alto en footer:
    - Wrapper externo: `px-3 pt-1` (móvil) / `sm:px-4`.
    - Banner: `className="px-0 pt-1 pb-1"`.
