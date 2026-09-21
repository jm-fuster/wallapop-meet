# Inventario de navegación inferior observado en Wallapop Chat (móvil)

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-19
- Método: inspección visual sobre captura compartida + calibración con componentes existentes
- Viewport de referencia: `390x844`
- Contexto: bandeja de conversaciones (`Buzon`) activa

## Estructura observada
- Barra fija en la parte inferior con:
  - Borde superior fino (`#D3DEE2` aprox.)
  - Fondo blanco
  - 5 acciones primarias distribuidas en ancho completo:
    - `Inicio`
    - `Favoritos`
    - `Vender`
    - `Buzon` (activo en captura)
    - `Tu`

## Especificación visual del componente

### 1) Contenedor (`inbox_bottom_nav`)
- Alto visual aproximado: `68-74px` según safe area
- Borde superior: `1px`, neutral claro
- Fondo: `#FFFFFF`
- Layout: `display:flex` con 5 columnas equivalentes

### 2) Item de navegación (`inbox_bottom_nav.item`)
- Estructura vertical:
  - Icono (`20px`)
  - Label (`11px/14px`)
- Estado `default`:
  - Icono/label: `#6E8792` aprox.
- Estado `active`:
  - Icono/label: `#253238`
  - Label con mayor peso visual
- Foco teclado:
  - Ring visible con `tokens.color.border.focus`

### 3) CTA central (`Vender`)
- Sin tratamiento especial respecto al resto de items
- Mantiene exactamente la misma grilla (ancho, alto y separación) para preservar equilibrio visual

### 4) Badge opcional por item
- Burbuja circular en esquina superior del item
- Fondo: `#D32069`
- Texto: blanco
- Uso: contador de actividad pendiente (ejemplo: favoritos o buzón)

## Tokens candidatos
- `tokens.color.bottom_nav.background = #FFFFFF`
- `tokens.color.bottom_nav.border = #D3DEE2`
- `tokens.color.bottom_nav.icon.default = #6E8792`
- `tokens.color.bottom_nav.icon.active = #253238`
- `tokens.color.bottom_nav.label.default = #6E8792`
- `tokens.color.bottom_nav.label.active = #253238`
- `tokens.size.bottom_nav.icon = 20px`
- `tokens.typography.bottom_nav.label.size = 11px`
- `tokens.typography.bottom_nav.label.line_height = 14px`

## Decisión de implementación en Wallapop Meet
- Componente: `src/components/ui/inbox-bottom-nav.tsx`
- Storybook: `Design System/Inbox Bottom Nav`
- API:
  - `items`
  - `activeItemId`
  - `onItemSelect`
  - `badgeCount` por item
