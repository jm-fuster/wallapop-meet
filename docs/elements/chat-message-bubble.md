# Inventario de `Message Bubble` observado en Wallapop Chat

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-19
- Método: inspección con MCP Chrome DevTools + `getComputedStyle`
- Viewport de referencia: `1536x678` (`devicePixelRatio: 1.25`)
- Contexto: conversación abierta en bandeja

## Validación móvil (responsive)
- Fecha de validación: 2026-02-19
- Viewport: `390x844` (`devicePixelRatio: 1`)
- `message_bubble.sent`: `131.4x37.6px`
- `message_bubble.received`: `119.1x37.6px`
- Se conservan paddings por variante:
  - `sent`: `8px 32px 8px 12px`
  - `received`: `8px 12px`

## Especificación visual del componente

### 1) `message_bubble.received`
- Elemento/clase: `.CurrentConversation__notMessageOwner .message-cloud`
- Dimensiones observadas: `119.05x37.6px`
- Padding: `8px 12px`
- Fondo: `transparent`
- Borde: `0.8px solid #ECEFF1`
- Radio: `20px`
- Tipografía del texto:
  - `16px/20px`, `400`, `Wallie, Helvetica`
  - Color: `#253238`

### 2) `message_bubble.sent`
- Elemento/clase: `.CurrentConversation__messageOwner .message-cloud`
- Dimensiones observadas: `144.99x37.6px`
- Padding: `8px 32px 8px 12px`
- Fondo: `#ECEFF1`
- Borde: `0.8px solid #ECEFF1`
- Radio: `20px`
- Tipografía del texto:
  - `16px/20px`, `400`, `Wallie, Helvetica`
  - Color: `#253238`

## Tokens candidatos
- `tokens.color.chat.bubble.sent.background = #ECEFF1`
- `tokens.color.chat.bubble.received.background = transparent`
- `tokens.color.chat.bubble.border = #ECEFF1`
- `tokens.color.chat.bubble.text = #253238`
- `tokens.radius.chat.bubble = 20px`
- `tokens.spacing.chat.bubble.received.padding = 8 12`
- `tokens.spacing.chat.bubble.sent.padding = 8 32 8 12`
- `tokens.color.chat.bubble.meta.time = #8BA4B2`
- `tokens.color.chat.bubble.meta.delivery.sent = #C2CDD3`
- `tokens.color.chat.bubble.meta.delivery.read = #13C1AC`

## Notas de normalización DS
- Mantener variantes separadas `sent` y `received` por diferencia de relleno y fondo.
- En Wallapop Meet se permite metadato inline dentro del bubble para `time` y estado de entrega.
- En variante `sent`, mostrar doble check en la esquina inferior derecha con `WallapopIcon(name="double_check")`:
  - `deliveryState = sent`: checks en gris.
  - `deliveryState = read`: checks en verde.
- Ajuste de implementación Wallapop Meet (2026-02-20):
  - `message_bubble.sent` usa padding horizontal simétrico (`px-3`) para evitar hueco visual excesivo a la derecha.
