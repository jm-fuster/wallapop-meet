# Inventario de Input observado en Wallapop Upload

## Fuente de análisis
- URL: `https://es.wallapop.com/app/catalog/upload/consumer-goods`
- Fecha de captura: 2026-02-18
- Método: inspección con MCP Chrome DevTools + `getComputedStyle` + lectura de reglas CSS runtime
- Viewport de referencia: `1536x678` (`devicePixelRatio: 1.25`)
- Contexto: sesión iniciada, flujo `Sube tu anuncio`, campo `Resumen del producto`

## Especificación visual del componente

### 1) `input.text` (walla-text-input)
- Ejemplo: `Resumen del producto`
- Elemento/clase:
  - Host: `walla-text-input`
  - Wrapper: `.inputWrapper.sc-walla-text-input`
  - Campo: `input#summary.sc-walla-text-input`
- Dimensiones observadas:
  - Caja visual wrapper: `666.4x64px`
  - Input interno: `610.4x24px`
- Layout base:
  - `border-radius: 8px`
  - `box-shadow: rgb(92, 122, 137) 0 0 0 1px inset`
  - `padding: 20px 16px`
  - `min-height: 24px`
  - `box-sizing: content-box`
- Tipografía (input):
  - Font family: `WallieFit`
  - Font size: `16px`
  - Font weight: `400`
  - Line-height: `24px`
- Color:
  - Texto: `rgb(41, 54, 61)` (`#29363D`)
  - Label/subtext/counter base: `rgb(92, 122, 137)` (`#5C7A89`)
  - Placeholder en foco: `rgb(163, 184, 193)` (`#A3B8C1`)
- Borde:
  - Sin `border` físico; se representa con `box-shadow` inset
- Cursor:
  - Base en input: `pointer` (según CSS del componente)

## Estados del Input (extraidos de reglas y validación en vivo)

### `default`
- Clase wrapper: `.inputWrapper.sc-walla-text-input`
- Estilo:
  - `box-shadow: rgb(92, 122, 137) 0 0 0 1px inset`
  - `padding: 20px 16px`
  - Label en `16px/24px`

### `hover`
- Regla: `.inputWrapper.sc-walla-text-input:hover:not(.inputWrapper--disabled, .inputWrapper--error.sc-walla-text-input, .inputWrapper--success).sc-walla-text-input`
- Estilo:
  - `box-shadow: rgb(41, 54, 61) 0 0 0 2px inset`
  - `cursor: pointer`

### `focused`
- Clase wrapper: `.inputWrapper--focused.sc-walla-text-input`
- Estilo:
  - `box-shadow: rgb(41, 54, 61) 0 0 0 2px inset`
  - `padding: 10px 16px`
  - `min-height: 44px`
  - Label reduce a `0.875rem/20px` y mantiene color `#5C7A89`

### `filled`
- Clase wrapper: `.inputWrapper--filled.sc-walla-text-input`
- Estilo:
  - `padding: 10px 16px`
  - `min-height: 44px`
  - Label en formato compacto (`0.875rem/20px`)

### `error`
- Clase wrapper: `.inputWrapper--error.sc-walla-text-input`
- Trigger observado: blur con valor vacio en campo requerido por flujo
- Estilo:
  - `box-shadow: rgb(206, 53, 40) 0 0 0 2px inset` (`#CE3528`)
  - Label en color `rgb(206, 53, 40)`
  - En hover mantiene el mismo borde rojo (sin cambio)
  - Referencia visual de producto: icono de exclamación rojo en la derecha del campo

### `success`
- Clase wrapper: `.inputWrapper--success.sc-walla-text-input`
- Estilo:
  - `box-shadow: rgb(34, 134, 24) 0 0 0 2px inset` (`#228618`)
  - `subText--success` en `rgb(34, 134, 24)`

### `disabled`
- Clase wrapper: `.inputWrapper--disabled.sc-walla-text-input`
- Estilo:
  - `opacity: 0.4`
  - `:hover` sin realce (`cursor: initial`)
  - Variantes auxiliares: `.charCounter--disabled`, `.subText--disabled` con `opacity: 0.4`
- Nota: no se observo un ejemplo disabled renderizado en este flujo, pero la variante esta definida en CSS runtime.

## Elementos auxiliares del componente
- `label.walla-text-input__label.sc-walla-text-input`
  - Base: `16px/24px`, `WallieFit`, color `#5C7A89`
  - En `filled/focused`: `14px/20px`
- `span.subText.sc-walla-text-input`
  - `12px/16px`, color `#5C7A89`, `padding-inline: 16px`
- `span.charCounter.sc-walla-text-input`
  - `12px/16px`, color `#5C7A89`, alineado a la derecha, `padding-inline: 16px`
- `right-section` (icono limpiar)
  - Se muestra en estado con contenido/foco; posición absoluta (`right: 16px; top: 2px; bottom: 2px`)
- `error-indicator` (implementación Wallapop Meet)
  - Indicador circular con `!` en blanco sobre fondo rojo
  - Posición: derecha del campo, centrado verticalmente
  - Objetivo: reforzar visibilidad de error en estado `error`

## Tokens candidatos (extraidos de Input)
- Colores:
  - `#29363D` (texto principal del input)
  - `#5C7A89` (label/subtext/counter base)
  - `#A3B8C1` (placeholder en foco)
  - `#CE3528` (error)
  - `#228618` (success)
- Borde/ring:
  - Neutral: `1px inset #5C7A89`
  - Hover/Focus: `2px inset #29363D`
  - Error: `2px inset #CE3528`
  - Success: `2px inset #228618`
- Radio:
  - `8px` (input container)
- Espaciado:
  - Base: `20px 16px`
  - Compacto (`filled/focused`): `10px 16px`

## Limitaciones de captura
- El estado `disabled` no se encontro activo en un nodo de este flujo; se documento desde reglas CSS cargadas en runtime.
- No se forzo simulación de `:active`/`focus-visible`; se documento `focused` real vía interacción.
