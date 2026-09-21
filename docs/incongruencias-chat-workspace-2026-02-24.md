# Incongruencias y desactualizaciones detectadas (2026-02-24)

## Alcance
- Modulos revisados: `wallapop-chat-workspace`, `chat-product-card`, stories y docs de componente.
- Objetivo: alinear UI y comportamiento con reglas funcionales actuales del chat.

## Hallazgos corregidos
- `ChatProductCard` no adaptaba acciones de seller al estado comercial:
  - Caso `Vendido`: seguian visibles botones `Reservar` y `Vendido`.
  - Caso `Reservado`: el boton de reserva no cambiaba a estado de anulacion.
  - Correccion aplicada: ocultar acciones en `Vendido`; en `Reservado` usar boton outline `Anular reserva`.

- Conversacion `conv-e-low-attendance` (Monitor LG 27 pulgadas 144Hz) sin `meetupContext`:
  - Impacto: no se resolvia `proposalActionState` y no aparecia `Proponer quedar`.
  - Correccion aplicada: se anadio `meetupContext` completo para habilitar la entrada de propuesta desde composer.

- Inconsistencia de codificacion en Storybook:
  - `src/components/ui/chat-product-card.stories.tsx` mostraba el simbolo de euro corrupto (mojibake).
  - Correccion aplicada: normalizado a `250 EUR` para evitar errores de encoding.

## Riesgos residuales
- La deteccion de estado comercial depende de texto (`statusLabel` contiene `reservad` o `vendid`).
- Recomendacion tecnica pendiente: introducir un enum explicito (`listingStatus: RESERVED | SOLD | AVAILABLE`) para evitar ambiguedades por copy o localizacion.

## Addendum (2026-02-24 tarde)
- Ajustes de localizacion/copy en acciones:
  - `I'm here` sustituido por `Estoy aqui` en card y banner.

- Alineacion visual de estados:
  - Label `COMPLETED` migrada a paleta azul Wallapop.

- Overlay de propuesta:
  - Footer contextual sin texto `Proponer quedada`.
  - Indicador de asistencia alineado con la misma logica cromatica de `ChatCounterpartCard`.
  - Para asistencia `<70%`, el copy es `Baja asistencia a quedadas`.

- Selector de mapa:
  - Iconos de titulo en card inferior (escudo/puntero) en negro.
  - Iconos de pines del mapa mantenidos en blanco.
  - Punto personalizado:
    - Titulo por direccion abreviada (prioriza `calle + numero`).
    - Fallback textual sin coordenadas (`Calle seleccionada`).
  - Mensajes contextuales de punto seguro/no seguro ajustados a contenido (`w-fit`).
