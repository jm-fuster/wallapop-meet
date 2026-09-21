# Inventario de `List Item` observado en Wallapop Chat

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-19
- Método: inspección con MCP Chrome DevTools + `getComputedStyle`
- Viewport de referencia: `1536x678` (`devicePixelRatio: 1.25`)
- Contexto: sesión iniciada, bandeja de conversaciones visible

## Validación móvil (responsive)
- Fecha de validación: 2026-02-19
- Viewport: `390x844` (`devicePixelRatio: 1`)
- `InboxConversation`: `384x100px`
- Padding: `20px 12px 20px 20px`
- Se mantiene altura de fila `100px` con contenido truncado en una línea para `itemTitle` y `messagePreview`.

## Especificación visual del componente

### 1) `list_item.conversation` (`InboxConversation`)
- Elemento/clase: `div.InboxConversation`
- Dimensiones: `333.6x100px`
- Padding: `20px 12px 20px 20px`
- Fondo: `transparent`
- Radio: `0`
- Cursor: `pointer`

### 2) Partes internas
- `InboxConversation__userName`
  - `12px/18px`, `400`, `Wallie, Helvetica`
  - Color: `#90A4AE`
- `InboxConversation__messageDate`
  - `12px/18px`, `400`, `Wallie, Helvetica`
  - Color: `#90A4AE`
- `InboxConversation__itemTitle`
  - `16px/16px`, `700`, `Wallie, Helvetica`
  - Color: `#253238`
- `InboxConversation__message`
  - `14px/14px`, `400`, `Wallie, Helvetica`
  - Color: `#90A4AE`

## Badge de no leidos (en la fila)
- Elemento/clase: `div.InboxConversation__badge.InboxConversation__badge--rounded`
- Color texto: `#FFFFFF`
- Fondo: `#D32069`
- Radio: `50%`
- Estado observado en la captura: oculto (`display: none`, contador `0`)

## Elementos adicionales observados en móvil
- Indicador sobre miniatura (esquina superior izquierda):
  - Variante `deal` (icono de trato/handshake)
  - Variante `bookmark` (icono de guardado)
  - Contenedor circular blanco con borde suave y acento por estado:
    - `bookmark` (reservado): `#86418A`
    - `deal` (vendido): `#D32069`
- Estado de entrega en preview:
  - Doble check al inicio del texto (`messagePreview`) cuando el último mensaje es del usuario
  - En Wallapop Meet se renderiza con `WallapopIcon(name="double_check")` para mantener consistencia con burbuja de mensaje
  - Color:
    - `read`: verde/turquesa (`#13C1AC`)
    - `sent`: gris claro (`#C2CDD3`)
- Acción de tres puntos:
  - En Wallapop Meet no se renderiza en cada fila de preview.
  - Se muestra en el header de la conversación abierta (`ConversationPane`), alineada a la derecha.

## Tokens candidatos
- `tokens.color.list_item.title = #253238`
- `tokens.color.list_item.meta = #90A4AE`
- `tokens.color.badge.unread.background = #D32069`
- `tokens.color.badge.unread.text = #FFFFFF`
- `tokens.color.list_item.leading_indicator.reserved = #86418A`
- `tokens.color.list_item.leading_indicator.sold = #D32069`
- `tokens.color.list_item.delivery.sent = #C2CDD3`
- `tokens.color.list_item.delivery.read = #13C1AC`
- `tokens.size.list_item.conversation.height = 100px`
- `tokens.space.list_item.conversation.padding = 20 12 20 20`

## Limitaciones de captura
- No se detecto en pantalla una fila con badge visible (`>0`), pero se extrajeron sus estilos base desde el nodo runtime.

## Implementación actual en el repositorio (2026-02-21)
- Componente: `src/components/ui/chat-list-item.tsx`.
- Storybook: `Design System/Chat List Item`.
- En `InboxPane`, `avatarSrc` se alimenta con `listingImageSrc` para mantener la miniatura del artículo en cada conversación.
- Separador entre filas:
  - Se aplica `border-b` por defecto (`showDivider = true`) con color `var(--wm-color-border-default)` para replicar el stroke de inbox entre items.
  - La base del botón usa `border-0` (en lugar de `border-none`) para permitir que el borde inferior sea visible.
- Estado visual `selected` en inbox:
  - Desktop: mantiene resaltado del item seleccionado para conservar el contexto de conversación abierta.
  - Móvil: al volver desde una conversación a la bandeja (`mobileView = "inbox"`), el item deja de mostrarse como pulsado para volver al estado inicial de lista.
