# Inventario de `Badge` observado en Wallapop Chat

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-19
- Método: inspección con MCP Chrome DevTools + `getComputedStyle`
- Viewport de referencia: `1536x678` (`devicePixelRatio: 1.25`)
- Contexto: bandeja de conversaciones y tabs de chat

## Especificación visual observada

### 1) `badge.unread.conversation`
- Elemento/clase: `div.InboxConversation__badge.InboxConversation__badge--rounded`
- Tipografía base:
  - `12px/18px`, `400`, `Wallie, Helvetica`
- Color texto: `#FFFFFF`
- Fondo: `#D32069`
- Forma: circular (`border-radius: 50%`)

Estado en captura:
- `hidden` (`display: none`, ancho/alto `0`) cuando el contador vale `0`.

### 2) `badge.notification.host` (host de web component)
- Elemento: `walla-notification-badge.hydrated`
- Dimensiones observadas según contexto:
  - `32x32px` (acciones de navbar superior)
  - `24x24px` (algunas entradas de menu lateral)
- Nota: el visual final se pinta internamente en el web component.

## Tokens candidatos
- `tokens.color.badge.unread.background = #D32069`
- `tokens.color.badge.unread.text = #FFFFFF`
- `tokens.typography.badge.unread = 12/18`
- `tokens.radius.badge.round = 50%`

## Limitaciones de captura
- No había contador visible (`>0`) en las conversaciones en esta sesión.
- En `walla-notification-badge` no se extrajo el detalle interno del Shadow DOM en esta pasada; se documenta host y dimensiones de uso.
