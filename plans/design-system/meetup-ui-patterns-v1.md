# Patrones de UI v1 - Wallapop Meet

## Objetivo
Definir pantallas y patrones de interacción para cubrir el ciclo completo de un meetup desde propuesta hasta seguimiento.

Regla de sincronización DS:
- Todo pattern alcanzable desde `src/App.tsx` debe declarar `designSystemMeta`, tener story `Design System/*` y validarse con `npm run ds:check`.

## 0. Punto de entrada en producto
- Wallapop Meet se lanza desde el chat de Wallapop, dentro de una conversación activa entre vendedor y comprador.
- No se contempla acceso standalone a la creación del meetup fuera del contexto del chat.
- El contexto de chat (anuncio, participantes y acuerdo previo) alimenta la propuesta inicial.
- En implementación actual, la vista de buzón evita acción global de hamburguesa y delega acciones contextuales al header de cada conversación (icono de tres puntos verticales).
- El header de cada conversación incluye avatar circular del usuario comprador junto al icono de tres puntos para reforzar el contexto del interlocutor.
- El avatar de perfil en conversación abierta y sidebar puede ser persona o contenido no-personal (paisaje/objeto) para reflejar casuística real de Wallapop.
- En la cabecera abierta de conversación, la línea principal muestra el precio del artículo; el título del anuncio queda en la línea secundaria.

## 1. Propuesta inicial (vendedor)
Contenido:
- Fecha y hora propuestas.
- Punto de encuentro sugerido.
- Precio final acordado.
- Entrada desde composer de chat con CTA secundario circular (`Proponer quedar`) y icono `calendar`, ubicado a la derecha junto al botón de envio.
  - Esta CTA solo se muestra cuando el actor del chat es `SELLER` y no existe meetup activo, o cuando el estado previo quedo en `CANCELLED`.
  - Si el actor es `BUYER`, el composer muestra solo la acción de enviar mensaje.
- Overlay de configuración:
  - Desktop/tablet horizontal: centrado.
  - Móvil: aparece desde abajo.
- Wizard en 3 pasos:
  - Paso 1: fecha y hora.
  - Paso 2: selección de punto de encuentro en lista (2 opciones visibles) con entrada a mapa para elegir punto seguro o personalizado.
  - Paso 3: importe final y preferencia de pago.
  - En paso 1, usar componentes de DS reutilizables:
    - `CalendarPicker` para día.
    - `Select` para hora con `dropdownDirection="up"` dentro de overlay móvil.
    - `MeetupProposalHeader` para cabecera superior del wizard (paso actual + progreso + cierre).
    - `MeetupWizardStepHeading` para cabecera de pasos con navegación hacia atrás.
    - `MeetupProposalFooter` para contexto + CTA fijo en la parte inferior del wizard.
- Reglas de avance del wizard:
  - Los pasos futuros se bloquean hasta completar validaciones de pasos previos.
  - El feedback de error se renderiza dentro del overlay.
  - El mensaje global de validación es: `Faltan campos por rellenar`.
  - Cada campo/sección incompleta muestra mensaje inferior específico.
  - Los CTA de paso (`Siguiente` / `Enviar propuesta`) no se deshabilitan por falta de campos; validan al pulsar.
  - En paso 2 siempre hay 2 opciones seleccionables visibles.
  - La lista de paso 2 funciona como cola de las 2 últimas selecciones.
  - Al seleccionar un punto nuevo desde mapa, se inserta arriba y desplaza el anterior a segunda posición.
  - Al pulsar la opción inferior no desaparece la superior; solo cambia el estado seleccionado.
- CTA final de confirmación: `Enviar propuesta`.
- En el footer del wizard no se muestra botón `Cancelar`; el cierre se realiza con botón `X` en cabecera.
- En móvil, footer de wizard en una sola fila: contexto de artículo/comprador + CTA principal.

Estados:
- `PROPOSED` al enviar.
- Error de validación si faltan campos.
- En UI de chat, `PROPOSED` se muestra como label `pendiente`.

## 2. Revisión de propuesta (comprador)
Contenido:
- Resumen en tarjeta.
- CTAs:
  - `Aceptar` usando `Button.variant=primary`.
  - `Contraofertar` usando `Button.variant=inline_action`.

Estados:
- `CONFIRMED` al aceptar.
- `COUNTER_PROPOSED` al contraofertar.

Patrón adicional (edición pre-confirmación por vendedor):
- Si la propuesta esta en `PROPOSED`, vendedor puede usar `Editar` para corregir datos sin cambiar de estado.
- Si esta en `COUNTER_PROPOSED`, vendedor puede editar y reenviar propuesta.
- Una vez `CONFIRMED`, no se permite editar desde card.

## 3. Línea temporal de estado
Estados soportados:
- `PROPOSED`
- `COUNTER_PROPOSED`
- `CONFIRMED`
- `ARRIVED`
- `COMPLETED`
- `CANCELLED`

Etiquetas visibles en UI (español, minusculas):
- `pendiente`
- `confirmada`
- `has llegado` (estado `ARRIVED` en `MeetupCard`)
- `completada`
- `cancelada`

Iconos en chip de estado de `MeetupCard` (izquierda del texto, alineados con el significado; ver `components-spec-v1` sección 15).

Reglas visuales:
- Estado actual resaltado.
- Estados finales (`COMPLETED`, `CANCELLED`) bloquean acciones incompatibles.
- Debe existir una referencia navegable en Storybook: `Design System/Meetup Timeline`.

## 4. Check-in "Estoy aquí"
Regla de negocio:
- Habilitado entre 30 minutos antes y 2 horas después de la hora pactada.

Comportamiento:
- CTA principal visible en tarjeta usando `Button.variant=primary`.
- Fuera de ventana: botón deshabilitado + mensaje explicativo.
- Al confirmar: transición a `ARRIVED`.
- Debe poder validarse en entorno de simulación con hora controlada (`Design System/Meetup Simulator`).
- Referencia de implementación en tarjeta: `src/components/meetup/meetup-card.tsx`.

## 5. Notificación interactiva
Contenido:
- Título contextual según estado.
- Acción directa: `Estoy aqui`.

Reglas:
- La acción en pantalla bloqueada debe reflejarse en estado interno sin reabrir flujo completo.
- Fallback: abrir app en vista de meetup si no hay acción directa disponible.

## 6. Seguimiento post-venta y valoración
Contenido inmediato en chat (tras `COMPLETED`):
- Componente `ChatMeetRatingPromptBubble`: mensaje alineado como recibido (asistente), copy de invitación a valorar, icono `Bot` (Lucide) en cápsula clara, CTA `Valorar`, hora en esquina inferior.
- Tokens: `tokens.color.meet_rating_prompt.*` (ver `design-tokens-v1.md`).

Seguimiento 24-48h (producto):
- Pregunta: "¿Se completó la venta?"
- Respuestas: `Sí, completada` / `No, cancelada`.

Estados:
- `COMPLETED` si se confirma la venta.
- `CANCELLED` si no se realizó.
- `CANCELLED` con motivo de no-show cuando no hay respuesta tras la ventana definida por producto.

## 7. Estados empty, loading y error
Patrones mínimos:
- Empty: no hay meetup activo.
- Loading: skeleton en tarjeta de timeline y botones.
- Error: acción de reintento y mensaje claro.

## 8. Mapeo de botones por patrón
- Navegación superior de categorías o secciones: `Button.variant=nav_expandable`.
- Cambio entre secciones tipo pestaña: `Button.variant=tab`.
- Acciones secundarias contextuales dentro de timeline: `Button.variant=inline_action`.
- Control lateral colapsable: `Button.variant=icon`.
- Cierre de panel contextual: `Button.variant=menu_close`.

## Criterio de completitud
- Todos los estados de negocio tienen UI y CTA asociada.
- Se cubren happy path y rutas de error/expiración.

## Guardrails de implementación (vigente)

- No introducir nuevos hardcodes visuales en `src`.
- Auditoría obligatoria en CI/local con `npm run audit:design-system`.
- Baseline versionado en `.design-system-audit-baseline.json`; solo se admite reducción o estabilidad, nunca regresión.

## Referencias implementadas (2026-02-21)
- Workspace de chat con entrada de propuesta desde composer + overlay: `src/components/meetup/wallapop-chat-workspace.tsx`.
- Mapa interactivo de selección de ubicación: `src/components/meetup/meetup-location-map.tsx`.
- Simulador interactivo de flujo: `src/components/meetup/meetup-simulator.tsx`.
- Timeline reusable de estados: `src/components/meetup/meetup-timeline.tsx`.
- Tarjeta contextual de acciones: `src/components/meetup/meetup-card.tsx`.
- Sidebar derecho desktop con contexto de contraparte + producto:
  - `src/components/ui/chat-counterpart-card.tsx`
  - `src/components/ui/chat-product-card.tsx`
  - `src/components/meetup/wallapop-chat-workspace.tsx`
- Stories de validación visual:
  - `src/components/meetup/meetup-simulator.stories.tsx`
  - `src/components/meetup/meetup-timeline.stories.tsx`
  - `src/components/meetup/meetup-card.stories.tsx`
  - `src/components/meetup/meetup-location-map.stories.tsx`
  - `src/components/ui/chat-counterpart-card.stories.tsx`
  - `src/components/ui/chat-product-card.stories.tsx`
- Living DS (`src/pages/design-system-page.tsx`) actualizado con patrones compuestos adicionales:
  - `Counterpart Context Pattern` con `ChatCounterpartCard` (card de usuario con calificación y asistencia).
  - `Inbox Conversation Preview Pattern` con `ChatListItem` (vista previa de conversación en buzón).
  - `Conversation Block Pattern` alineado con `ChatMessageBubble`, `ChatSecurityBanner` y `ChatComposer`.
  - Bloques de overlay de propuesta: `MeetupProposalHeader`, `MeetupWizardStepHeading`, `MeetupProposalFooter`.
  - `Proposal Step 1 Pattern`: `CalendarPicker` + `Select` de hora (default y error).
  - `Proposal Step 2 Pattern`: `MeetupLocationMap` + cards de selector de punto (seguro/personalizado/elige un punto).
  - `Proposal Step 3 Pattern`: `Input` de importe + preferencia de pago (`Efectivo`, `Wallapop Wallet`).

Notas de UI del workspace (2026-02-21):
- Header de `InboxPane`: sin botón `burguer_menu`.
- Header de `ConversationPane`: avatar circular del comprador + botón `ellipsis_horizontal` alineado a la derecha (placeholder sin acción funcional por ahora).
- Indicador de entrega en `ChatMessageBubble` y `ChatListItem` unificado con `WallapopIcon.name=double_check`.
- Contenedor principal del workspace en desktop con ancho fluido completo (sin `max-w`), para ocupar todo el viewport horizontal y eliminar márgenes laterales.
- En desktop `lg+` el chat usa 3 columnas: inbox, conversación y sidebar contextual.
- El sidebar contextual agrupa 2 cards verticales:
  - Card de contraparte (nombre, rating, distancia, ubicación, avatar).
  - Card de producto con variante por rol (`seller`/`buyer`).
- Regla por rol en card de producto:
  - `seller`: lapiz, `Reservar`, `Vendido`, métricas de visitas/likes.
  - `buyer`: sin lapiz, sin CTAs comerciales y sin métricas.
- Estado comercial en items del buzón reutilizando componentes documentados:
  - `Chat List Item With Bookmark` para reservado (`leadingIndicator="bookmark"`).
  - `Chat List Item With Deal` para vendido (`leadingIndicator="deal"`).
  - Colores oficiales de icono/acento por estado:
    - `Reservado`: `#86418A`.
    - `Vendido`: `#D32069`.
- Mock del buzón extendido con conversaciones realistas e imagen de artículo por cada chat.
- En `InboxPane`, la miniatura de cada fila corresponde al artículo (`listingImageSrc`), no al avatar de perfil.
- Overlay de propuesta (actualizado 2026-02-21):
  - Paso 1 con 2 cards visibles (seguras y/o personalizadas) y truncado defensivo de textos largos.
  - Punto personalizado representado con icono `deal` (manos) dentro del pin; punto seguro con icono de escudo.
  - Todos los pines usan estilo Wallapop tipo cápsula con mini triangulo unido al cuerpo.
  - Cards seleccionables de paso 1 y paso 3 con indicador visual `selected/unselected` en el lateral derecho:
    - `unselected`: aro fino con centro blanco.
    - `selected`: aro oscuro grueso tipo donut con centro blanco reducido.
  - Vista de mapa con buscador visual (icono lupa + placeholder), selección por marcador y por tap libre.
  - Bottom sheet de mapa siempre en una línea para distancia (`m/km`) y con prioridad de capa sobre teselas.
  - Controles `+/-` de zoom ocultos en mapa del wizard (zoom por gesto).
  - Paso 2 actualizado (2026-02-22):
    - Label `Dia` en la parte superior del calendario para consistencia con `Hora`.
    - Calendario compacto y reutilizable (`src/components/ui/calendar-picker.tsx`).
    - Día seleccionado con mayor contraste en verde Wallapop.
    - Selector de hora con panel de altura fija y scroll interno para no forzar scroll de pantalla, con franjas de 15 minutos.
    - Error visual/tokenizado consistente con `Input` (`tokens.color.input.ring.error`, 2px).
  - Paso 3 actualizado (2026-02-22):
    - Importe final con `Input`.
    - Moneda mostrada en UI con simbolo `€`.
    - Validación de importe con límite máximo `99999 €` y hasta `2` decimales.
    - Si el importe supera `2000 €`, se muestra alerta destacada (estilo warning) sobre DAC7 + link `Más información` a ayuda Wallapop.
    - Métodos de pago en cards seleccionables con iconografía.
    - En error de método, cada card se marca en rojo de forma independiente (sin borde global envolvente).

Notas de UI del workspace (actualizado 2026-02-23):
- `MeetupCard` con patrón de mensaje de sistema y título fijo `Quedada con <nombre contraparte>`.
- En hilo de chat con actor `SELLER`, la card se alinea a la derecha.
- Card sin sombra y con fondo blanco en ambos sentidos del chat.
- Estado mostrado en label traducida (minusculas) con color semántico por estado.
- Bloque de datos en 3 filas con iconos: calendario, ubicación y billete.
- Formato de contenido en filas:
  - Calendario: `dia \u00B7 hora`.
  - Pago: `metodo \u00B7 precio`.
- Tipología de acciones en card:
  - `principal`: acción prioritaria del estado.
  - `outline`: acción secundaria (`Editar`, `Proponer cambios`, `Anadir a Calendar`, `Reenviar propuesta`).
  - `texto`: acción de salida/descarte (`Cancelar quedada`, `Rechazar quedada`).
- Tipografía de acciones en card: `16px` en los 3 tipos.
- Al pulsar `Cancelar quedada` o `Rechazar quedada`, se abre modal de confirmación con:
  - CTA principal `Si`.
  - CTA secundaria outline `No`.
- Hora de envio:
  - Fija en esquina inferior derecha.
  - Alineada verticalmente con el último elemento visible de la card.
  - Sin reservar bloque de espacio inferior adicional.
- Miniatura superior con render real de mapa y sin texto superpuesto.
- La miniatura oculta controles de zoom `+/-`.

Notas de UI del workspace (actualizado 2026-02-27):
- `ChatConversationHeader`: en móvil, botones de flecha y menu con densidad compacta (menor padding visual) manteniendo margen lateral consistente.
- `ChatConversationHeader`: cuando el estado comercial es `Vendido`, el icono `deal` se renderiza con token de vendido (`--status-sold`) de forma consistente.
- `ChatListItem`: la preview del último mensaje debe truncar con elipsis (`...`) en textos largos, sin cortes abruptos y sin desplazar badge/estado de entrega.
- Tap en miniatura abre modal de mapa en grande, solo lectura:
  - Sin buscador.
  - Sin selección de punto.
  - Con botón `X` de cierre.

---

## Anexo v2 (2026-02-23) - Contrato de flujo por rol y matriz de CTAs

Este anexo cierra el flujo completo comprador/vendedor.
Si hay conflicto con reglas anteriores del documento, prevalece este anexo v2.

### A. Matriz de CTAs por estado y rol

| Estado | SELLER | BUYER | Comentarios |
| --- | --- | --- | --- |
| `null` | `Proponer quedar` | Sin CTA de propuesta | Entrada exclusiva de vendedor |
| `PROPOSED` | `Editar` (outline), `Cancelar quedada` (texto) | `Aceptar` (principal), `Proponer cambios` (outline), `Rechazar quedada` (texto) | Comprador decide sobre propuesta inicial |
| `COUNTER_PROPOSED` | `Editar` (outline), `Aceptar contraoferta` (principal), `Reenviar propuesta` (outline), `Cancelar quedada` (texto) | Espera respuesta | Vendedor retoma control |
| `CONFIRMED` | `Estoy aqui` (principal) o `Anadir a Calendar` (outline), `Cancelar quedada` (texto) | `Estoy aqui` (principal) o `Anadir a Calendar` (outline), `Cancelar quedada` (texto) | `REPORT_NO_SHOW no visible como acción de comprador |
| `ARRIVED` | `Confirmar venta` (principal), `Cancelar quedada` (texto) | `Estoy aqui` (principal, si aun no marco), `Cancelar quedada` (texto) | `COMPLETE` solo vendedor |
| `COMPLETED` | Sin CTA de transición | Sin CTA de transición | Estado final |
| `CANCELLED` | `Proponer quedar` (desde composer) | Sin CTA de propuesta | Se permite reiniciar con nueva propuesta del vendedor |

### B. Política de cancelación y zona roja

- Se permite cancelar en cualquier momento pre-terminal.
- La acción de cancelar/rechazar siempre pide confirmación explicita (`Si` / `No`).
- En los últimos `30 min` antes de `scheduledAt` (zona roja):
  - Mostrar aviso adicional de impacto en fiabilidad dentro del modal.
  - Al confirmar cancelación, generar notificación prioritaria a contraparte.

### C. Patrón de no-show basado en evidencia de check-in

- El botón `Estoy aqui` es la fuente principal de evidencia de asistencia.
- Regla de evidencia:
  - Si ambos usuarios marcan llegada y geovalidan proximidad (`<=100m`), se considera encuentro validado.
  - Si solo una parte marca llegada valida y la otra no comparece, se habilita flujo de no-show atribuible.
- Resultado de no-show:
  - Resolución vía `CANCELLED` con `cancelReason` al vencer la ventana temporal de no-show.
  - Debe quedar trazabilidad de actor presente/ausente en metadata (para siguiente fase de implementación).

### D. Check-in y expiración

- Ventana de `Estoy aqui`: `-30 min` a `+2 h` respecto a `scheduledAt`.
- No existe estado `EXPIRED`; el cierre no-show usa `CANCELLED` con `cancelReason`:
  - No existe botón manual `Expirar meetup`.
  - No se muestra CTA equivalente en tarjeta, timeline ni banner.

### E. Seguimiento post-encuentro

- Primer prompt de confirmación/valoración: entre `+1 h` y `+2 h` tras la hora pactada.
- Default v2: `+2 h`.
- Se prioriza feedback cercano al evento (se descarta esperar 24-48h como primer contacto).

---

## Anexo v3 (2026-02-23) - Estado implementado real

Si hay conflicto con anexo v2 o secciones previas, prevalece v3.

### A. Matriz de CTAs actual en `CONFIRMED`

| Rango temporal | CTAs visibles |
| --- | --- |
| Dentro de `-30 min` a `+2 h` | `Estoy aqui`, `Cancelar quedada` |
| Fuera de ese rango | `Anadir a Calendar`, `Cancelar quedada` |

Reglas:
- No existe CTA `Expirar meetup`.
- No existen CTAs `Llego en 10 min` / `Llego en 20 min` en la UI actual.
- El aviso informativo de llegada solo se muestra dentro de la ventana `-30/+2h`.

### B. Proponer cambios (comprador)

- En `PROPOSED` con actor `BUYER`, `Proponer cambios` abre el overlay editable con los parametros existentes.
- Al enviar cambios, se persiste la nueva propuesta y la maquina transiciona a `COUNTER_PROPOSED`.
- La label visual para `COUNTER_PROPOSED` es `pendiente`.

### C. Título de card de meetup

- En todos los estados:
  - `Quedada con <nombre contraparte>`.

### D. Sidebar desktop de contraparte

- Se sustituye el texto de ubicación genérico por métrica de asistencia.
- Formato visible:
  - `X% de asistencia (N)` cuando `X >= 70`.
  - `Baja asistencia a quedadas` cuando `X < 70`.
- Semaforo:
  - `>90`: success.
  - `70-89`: warning.
  - `<70`: error, sin porcentaje.
- El bloque de rating muestra `(<numero valoraciones>)` a la derecha de estrellas.

### E. Ajustes visuales recientes de mapa y cabecera móvil

- Cabecera de conversación móvil:
  - Botón de volver como icono `arrow_left` sin contenedor circular.
- Selector de mapa (wizard):
  - Punto seguro: pin cápsula turquesa + `shield` + mini triangulo unido.
  - Punto seguro seleccionado: misma forma en tono verde mas oscuro.
  - Punto personalizado: pin cápsula en verde con icono `deal` (manos) + mini triangulo unido.
  - Label de punto seguro en cards/lista: `Punto seguro · <N> ventas completadas`.
  - Bloque `N ventas completadas` en punto seguro con mismo patrón visual del aviso de no verificado, en variante verde Wallapop.
- Mini mapa de `MeetupCard`:
  - Reutiliza pin tipo cápsula con mini triangulo unido.
- CTA `Confirmar venta` en `ARRIVED` usa color `sold` (rosa), no `reserve` (morado).
- Banner superior de venta pendiente usa fondo y acción en color de marca (`action.primary`).

---

## Anexo v4 (2026-04-06) - Wallapop Wallet, proximidad y mock del workspace

Si hay conflicto con anexos v2 o v3, prevalece v4.

### A. Métodos de pago en propuesta

- Paso 3 del wizard: `Efectivo` y `Wallapop Wallet` como únicas opciones seleccionables (no Bizum).
- Iconografía y copy alineados a `components-spec-v1.md` sección 15 y addendum v4.

### B. Revisión de propuesta (comprador) con Wallet

- Resumen en `MeetupCard` con `pendiente` en chip.
- `Aceptar` siempre habilitado; si el saldo del monedero es inferior al precio acordado, al pulsar se abre `WalletTopUpSheet` para recarga (no bloqueo agresivo del botón principal).
- Texto educativo (`NoticeBanner` verde / `tone=success`) solo en `PROPOSED` o `COUNTER_PROPOSED`; no se muestra tras confirmar la quedada.
- No hay banner en card por importe apartado en monedero (el hold sigue en dominio).

### C. Confirmación y venta (`CONFIRMED` / `ARRIVED`)

- Hold de importe en dominio al aceptar con Wallet (`walletHoldAmountEur`); liberación al completar o cancelar según maquina de estados (sin mensaje dedicado en la tarjeta).
- Ventana de `Estoy aqui`: `-30 min` a `+2 h` respecto a `scheduledAt`.
- Proximidad `~100 m` al punto: aviso para acercarse solo mientras el botón de llegada sigue bloqueado por distancia; si ya esta habilitado por proximidad, no se muestra el aviso redundante.
- En `ARRIVED` con Wallet, vendedor: CTA principal `Escanear codigo QR de <nombre>` (rosa vendido); con Efectivo: `Confirmar venta`.
- En `ARRIVED` con Wallet, comprador que ya marco llegada: CTA `Mostrar codigo QR` abre dialog con QR de pago y código de 6 digitos de verificación (ver anexo v5).

### D. Mock de demo `WallapopChatWorkspace`

- Conversación por defecto al cargar: `conv-c-buyer-incoming` (Marta P.), con meetup en estado `PROPOSED` y método `WALLAPOP`, para mostrar la solicitud de quedada pendiente sin confirmar.
- Vista móvil inicial: `conversation` (no `inbox`) para abrir directamente el hilo con la tarjeta visible.
- Saldo demo del comprador en workspace: `5000` EUR menos holds derivados de otros chats sembrados en `buildInitialMeetupState` (ver `wallapop-chat-workspace.tsx`).

### E. Referencias

- Patrones de UI: este documento (anexo v4).
- Contrato de componente: `plans/design-system/components-spec-v1.md` (sección 15, addendum v4 y v5).
- `src/components/meetup/wallapop-chat-workspace.tsx`, `src/components/meetup/meetup-card.tsx`, `src/components/meetup/wallet-top-up-sheet.tsx`, `src/meetup/wallet-payment-qr.ts`
- Reglas de proximidad: `src/meetup/meetup-ui-rules.ts`

---

## Anexo v5 (2026-04-06) - Dialog QR Wallet (comprador)

Si hay conflicto con el anexo v4, prevalece v5.

### A. Objetivo

- El comprador no muestra el QR de pago en la card una vez confirmada la quedada; tras indicar que ha llegado (`ARRIVED` con `arrivalCheckins.BUYER`), accede al QR mediante un botón dedicado.

### B. Botón `Mostrar codigo QR`

- Misma familia visual que la CTA del vendedor de escaneo: `Button` con `variant` de estado vendido (`status_sold_solid`), icono `QrCode`, texto `Mostrar codigo QR`, ancho completo, pildora.
- `aria-label` alineado al texto visible.

### C. Dialog

- Modal centrado sobre scrim (`overlay-scrim`), panel con sombra, `role=dialog`, `aria-modal=true`, título accesible.
- Contenido: título `Pago con Wallapop Wallet`, texto de ayuda, `WalletInPersonQr` (payload deep link `wallapop://wallet-inperson-pay?...`), número de 6 digitos bajo el QR (`deriveWalletDisplayCode`), etiqueta `Código de verificación`, botón `Cerrar`; tap en scrim cierra.
- Implementación: `src/components/meetup/meetup-card.tsx` (portal a `document.body`).

### D. Stories

- `Design System/Meetup Card` -> `Wallet Payment Buyer Show Qr Dialog` (comprador con llegada marcada).
- `Wallet Payment Seller Scan` (vendedor escaneo) sigue documentando el lado cobro.

### E. Contrato

- Detalle normativo: `plans/design-system/components-spec-v1.md` addendum v5.


