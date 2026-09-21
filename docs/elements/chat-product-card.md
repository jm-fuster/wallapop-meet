# Inventario de `Chat Product Card` observado en Wallapop Chat

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-21
- Método: inspección con MCP Chrome DevTools + `getComputedStyle`
- Viewport de referencia: `1536x678` (`devicePixelRatio: 1.25`)
- Contexto: panel derecho de conversación con card del item

## Especificación visual del componente (seller)

### 1) Contenedor `card`
- Elemento/clase: `a.card`
- Dimensiones observadas: `301.6x321.6px`
- Fondo: `#FFFFFF`
- Borde: `none`
- Radio: `10px`
- Sombra: `none`

### 2) Imagen
- Nodo: `img.card-img-top`
- Dimensiones: `301.6x180px`
- Borde: `4px solid #FFFFFF`
- Radio: `10px`

### 3) Bloque de acciones (solo seller)
- Nodo: `.actions-block`
- Altura observada: `39.6px`
- Padding: `12px 20px 0`

Botones embebidos:
- `.btn.btn-reserve`
  - `120.8x27.6px`
  - Padding: `4px 20px`
  - Fondo: `#86418A`
  - Texto: `#FFFFFF`
  - Borde: `0.8px solid transparent`
  - Radio: `25px`
  - Tipografía: `12px/18px`, `400`, `Wallie, Helvetica`
- `.btn.btn-sold`
  - `120.8x27.6px`
  - Padding: `4px 20px`
  - Fondo: `#D32069`
  - Texto: `#FFFFFF`
  - Borde: `0.8px solid transparent`
  - Radio: `25px`
  - Tipografía: `12px/18px`, `400`, `Wallie, Helvetica`

Reglas de estado en implementación (`src/components/ui/chat-product-card.tsx`):
- Si el anuncio esta `Vendido`, se ocultan las acciones de seller (`Reservar` y `Vendido`).
- Si el anuncio esta `Vendido`, también se oculta el botón `Editar` superpuesto y las métricas de visitas/likes.
- Si el anuncio esta `Reservado`, el botón izquierdo pasa a modo outline y texto `Anular reserva`.
- Si no hay estado comercial, se mantiene la variante original (`Reservar` relleno + `Vendido` relleno).
- El toggle de `Reservar`/`Anular reserva` actualiza de forma consistente:
  - indicador visual del listado (`leadingIndicator=bookmark`);
  - badge de estado en la card derecha (`Reservado`).
- Integración con meetup en `wallapop-chat-workspace`:
  - `CONFIRMED` y `ARRIVED` fuerzan estado `Reservado`;
  - `CANCELLED` limpia estado de reserva;
  - `Vendido` prevalece frente a cambios automáticos.

### 4) Botón de editar superpuesto (solo seller)
- Nodo: `a.btn.btn-edit`
- Dimensiones: `40x40px`
- Fondo: `#FFFFFF`
- Borde: `1.6px solid rgba(207, 216, 220, 0.5)`
- Radio: `8px`

### 5) Bloque de contenido
- Nodo: `.card-block`
- Padding: `12px`

Texto:
- `.card-title`
  - `16px/20px`, `700`, `Wallie, Helvetica`
  - Color: `#253238`
  - Margen inferior: `12px`
- `.price`
  - `16px/24px`, `400`, `Wallie, Helvetica`
  - Color: `#253238`
- `.stats`
  - `12px/26px`, `400`, `Wallie, Helvetica`
  - Color: `#607D8B`

## Variante comprador (buyer)
- No aparece botón de editar.
- No aparecen botones `Reservar` / `Vendido`.
- No aparecen métricas de visitas/likes junto al precio.
- Puede mostrarse badge de estado comercial (`Vendido`) sobre la imagen.

## Tokens candidatos
- `tokens.color.card.background = #FFFFFF`
- `tokens.color.card.title = #253238`
- `tokens.color.card.meta = #607D8B`
- `tokens.color.card.action.reserve = #86418A`
- `tokens.color.card.action.sold = #D32069`
- `tokens.radius.card.base = 10px`
- `tokens.radius.card.action_pill = 25px`

## Notas de normalización DS
- El componente debe exponer `viewerRole`:
  - `seller`: habilita acciones y métricas de publicación.
  - `buyer`: oculta acciones/métricas y mantiene vista informativa.
- Referencias de implementación:
  - `src/components/ui/chat-product-card.tsx`
  - `src/components/ui/chat-product-card.stories.tsx`
