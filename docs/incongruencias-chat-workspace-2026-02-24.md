# Incongruencias y desactualizaciones detectadas (2026-02-24)

## Alcance
- Modulos revisados: `wallapop-chat-workspace`, `chat-product-card`, stories y docs de componente.
- Objetivo: alinear UI y comportamiento con reglas funcionales actuales del chat.

## Hallazgos corregidos
- `ChatProductCard` no adaptaba acciones de seller al estado comercial:
  - Caso `Vendido`: seguian visibles botones `Reservar` y `Vendido`.
  - Caso `Reservado`: el botón de reserva no cambiaba a estado de anulación.
  - Corrección aplicada: ocultar acciones en `Vendido`; en `Reservado` usar botón outline `Anular reserva`.

- Conversación `conv-e-low-attendance` (Monitor LG 27 pulgadas 144Hz) sin `meetupContext`:
  - Impacto: no se resolvía `proposalActionState` y no aparecía `Proponer quedar`.
  - Corrección aplicada: se anadio `meetupContext` completo para habilitar la entrada de propuesta desde composer.

- Inconsistencia de codificación en Storybook:
  - `src/components/ui/chat-product-card.stories.tsx` mostraba el simbolo de euro corrupto (mojibake).
  - Corrección aplicada: normalizado a `250 EUR` para evitar errores de encoding.

## Riesgos residuales
- La detección de estado comercial depende de texto (`statusLabel` contiene `reservad` o `vendid`).
- Recomendación técnica pendiente: introducir un enum explicito (`listingStatus: RESERVED | SOLD | AVAILABLE`) para evitar ambiguedades por copy o localización.

## Addendum (2026-02-24 tarde)
- Ajustes de localización/copy en acciones:
  - `I'm here` sustituido por `Estoy aqui` en card y banner.

- Alineación visual de estados:
  - Label `COMPLETED` migrada a paleta azul Wallapop.

- Overlay de propuesta:
  - Footer contextual sin texto `Proponer quedada`.
  - Indicador de asistencia alineado con la misma lógica cromática de `ChatCounterpartCard`.
  - Para asistencia `<70%`, el copy es `Baja asistencia a quedadas`.

- Selector de mapa:
  - Iconos de título en card inferior (escudo/puntero) en negro.
  - Iconos de pines del mapa mantenidos en blanco.
  - Punto personalizado:
    - Título por dirección abreviada (prioriza `calle + numero`).
    - Fallback textual sin coordenadas (`Calle seleccionada`).
  - Mensajes contextuales de punto seguro/no seguro ajustados a contenido (`w-fit`).
