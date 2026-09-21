La funcionalidad se llama **Wallapop Meet**, un sistema para formalizar encuentros presenciales de compraventa dentro de Wallapop.

### Resumen de la funcionalidad

Wallapop Meet transforma acuerdos informales de chat en un "evento de encuentro" estructurado dentro de la app.
El flujo se inicia siempre desde una conversación de chat entre vendedor y comprador dentro de Wallapop (no existe entrada independiente fuera del chat).
Objetivos:

- Reducir errores logísticos, olvidos y "ghosting" al formalizar fecha, hora, lugar y precio.
- Permitir que el vendedor inicie la propuesta de encuentro.
- Permitir que el comprador acepte o envie una contraoferta.
- Ofrecer notificaciones push interactivas con botón de acción en pantalla bloqueada ("Ya estoy aquí").
- Mostrar un banner o aviso persistente en inicio el día del encuentro.
- El banner superior de venta pendiente en chat usa color de marca Wallapop (verde) en fondo y acción.
- Exportar los detalles del encuentro a calendario (`.ics`).
- Preguntar después del evento si la venta se completo para impulsar valoraciones.

---

### Reglas de negocio esperadas

- El punto de entrada de Wallapop Meet es el chat con comprador asociado al anuncio; todas las acciones de propuesta/aceptación nacen en ese contexto.
- Solo el vendedor puede iniciar una propuesta de encuentro.
- El comprador puede aceptar o contraofertar.
- El evento sigue una maquina de estados clara:
  `PROPOSED -> COUNTER_PROPOSED -> CONFIRMED -> ARRIVED -> COMPLETED/CANCELLED`.
- Las notificaciones push deben ser interactivas y funcionar desde la pantalla bloqueada en iOS y Android.
- La lógica de llegada debe respetar una ventana temporal: 30 minutos antes y hasta 2 horas después de la hora programada.
- La integración con mapas debe sugerir puntos de encuentro seguros en lugares públicos (por ejemplo, estaciones, centros comerciales o comisarias), permitiendo también selección personalizada con advertencia de seguridad.
- Debe existir seguimiento posterior para confirmar el estado de la venta entre 24 y 48 horas después.

---

### Estado de implementación actual (2026-02-22)

- Entrada desde chat integrada en `wallapop-chat-workspace`.
- CTA secundario circular en `ChatComposer` para iniciar propuesta (`Proponer quedar`) con icono calendario, ubicado a la derecha (junto al botón enviar), visible solo para el vendedor cuando no hay meetup activo o cuando la propuesta anterior quedo en `CANCELLED`.
- Overlay de propuesta responsive:
  - Centrado en desktop/tablet horizontal.
  - Entrada desde abajo en móvil.
- Overlay en 3 pasos:
  - Paso 1: fecha y hora.
  - Paso 2: selector de punto de encuentro con 2 opciones visibles y acceso a mapa para elegir otro punto seguro o personalizado.
  - Paso 3: precio final y preferencia de pago (`CASH`, `WALLET`).
  - Los pasos posteriores no son navegables si el paso actual no esta completo.
  - Las validaciones del wizard se muestran dentro del overlay (no como error en el hilo de chat).
- Reglas actuales del paso 1 (fecha/hora):
  - El paso arranca sin valor precargado al abrir propuesta, obligando a selección manual de día y hora.
  - El calendario muestra label superior `Dia`, alineado con el patrón visual del selector `Hora`.
  - El calendario es interactivo y reutilizable (`CalendarPicker`), con día seleccionado reforzado en tonos verdes Wallapop.
  - El selector de hora usa `Select` reutilizable con panel de altura fija y scroll interno.
  - El selector de hora ofrece franjas de 15 minutos (`HH:00`, `HH:15`, `HH:30`, `HH:45`) durante todo el día.
  - En móvil, el dropdown de hora se despliega hacia arriba para evitar recorte por viewport.
  - El botón `Siguiente` no se deshabilita; al pulsar sin completar, muestra error global y marca en error los campos faltantes.
- Reglas actuales del paso 3 (importe y pago):
  - El importe usa el componente `Input` del design system.
  - El copy de moneda en UI usa simbolo `€` (no `EUR`).
  - El importe admite formato decimal (`hasta 2 decimales`) y limita la entrada a un máximo de `99999 €`.
  - Si el usuario supera `2000 €`, se muestra una alerta destacada de normativa DAC7 con enlace externo de ayuda (`Mas informacion`).
  - Los métodos de pago usan cards seleccionables con iconografía contextual (`CASH`, `WALLET`).
  - En método de pago, los iconos se muestran sin circunferencia/cápsula de fondo.
  - El CTA final usa el texto `Enviar propuesta`.
  - El CTA no se deshabilita; al pulsar sin completar, muestra error global y marca en error los campos faltantes.
  - Se permite importe `0` como valor valido.
- Reglas actuales de validación visual:
  - Mensaje global unificado: `Faltan campos por rellenar`.
  - Cada sección incompleta muestra mensaje inferior específico.
  - El color y grosor de error se unifican con la línea de `Input` (`tokens.color.input.ring.error`, 2px).
  - En paso 3, si falta método de pago, cada card se marca en error por separado (no con borde envolvente único).
- Header y footer del wizard componentizados:
  - Cabecera superior del overlay extraida a `MeetupProposalHeader` (paso actual, cierre y barra de progreso).
  - Cabecera interna de pasos extraida a `MeetupWizardStepHeading`.
  - Footer contextual con CTA extraido a `MeetupProposalFooter`.
- Reglas actuales del paso 2 (selector de ubicación):
  - Siempre hay exactamente 2 puntos seleccionables visibles.
  - El sistema mantiene una cola de las 2 últimas selecciones.
  - Si se selecciona un punto nuevo desde mapa, entra en primera posición y desplaza el anterior a segunda.
  - Si se selecciona la opción inferior en lista, no desaparece la superior; solo cambia el punto activo.
  - Cada card muestra indicador visual `selected` / `unselected` a la derecha:
    - `unselected`: aro fino con centro blanco.
    - `selected`: aro oscuro grueso con centro blanco reducido.
  - Los puntos seguros muestran un único label: `Punto seguro · N ventas completadas`.
  - Los puntos personalizados no muestran label `Personalizado` en la card de opción.
- Mapa en selector de punto:
  - Implementado sobre OpenStreetMap (`react-leaflet`).
  - Permite seleccionar puntos seguros y también cualquier punto personalizado pulsando sobre el mapa.
  - Al seleccionar punto personalizado se muestra dirección (reverse geocoding con fallback) y distancia.
  - El título del punto personalizado usa dirección abreviada (priorizando `calle + numero`) y evita mostrar valores numéricos aislados.
  - Fallback de dirección en UI: `Calle seleccionada` (sin coordenadas).
  - La card inferior del mapa usa icono delante del título:
    - Seguro: escudo negro.
    - Personalizado: puntero negro.
  - Los iconos de los pines del mapa (cápsula/marker) se mantienen en blanco.
  - Mensajes de la card inferior:
    - Seguro: `<N> ventas completadas en este punto seguro.` con `<N> ventas completadas` en negrita y ancho ajustado al texto (`w-fit`).
    - Personalizado: sin aviso de no seguro en la card inferior.
  - El panel inferior de selección en mapa se superpone por encima del mapa con prioridad visual.
  - En flujo móvil no se muestran controles de zoom `+/-` (zoom por gesto táctil).
- `ChatSecurityBanner` fijado sobre el composer en formato compacto.
- `MeetupCard` mostrando datos de propuesta (lugar, precio final y método de pago) una vez creado el meetup.
- En `ARRIVED`, la acción `Confirmar venta` usa color de vendido (`sold`, rosa), no color de reservado (`reserve`, morado).
- `MeetupCard` adaptada al estilo de mensaje de sistema de Wallapop:
  - Título visible fijo: `Quedada con <nombre contraparte>`.
  - Cuando el actor del chat es `SELLER`, la card se renderiza en el lado derecho de la conversación.
  - Variante inversa en propuesta recibida (`BUYER` + `PROPOSED`):
    - Acciones visibles: `Aceptar` (principal), `Proponer cambios` (outline), `Rechazar quedada` (texto).
    - La card se renderiza en el lado izquierdo de la conversación.
- Estado visible en chip de estado (`Label`) junto al título, texto en minusculas (`pendiente`, `confirmada`, `has llegado`, `completada`, `cancelada`).
  - Cada chip lleva un icono a la izquierda (Lucide) alineado con el significado: `Clock` pendiente; `CheckCircle2` confirmada; `MapPin` `has llegado`; `Handshake` completada (misma semántica de venta cerrada que `WallapopIcon` `deal`); `XCircle` cancelada; `CircleDashed` si no hay propuesta.
  - `COMPLETED` usa semántica visual azul Wallapop.
  - `COUNTER_PROPOSED` se representa como `pendiente` (no `contraoferta`).
  - Fondo de card en blanco y sin sombra, tanto en envio propio como en recepción.
  - Resumen de datos en 3 filas con icono a la izquierda:
    - Calendario: día y hora.
    - Mapa: dirección.
    - Billete: método de pago + precio.
  - Formato visual del tiempo en card:
    - `dia \u00B7 hora` en la fila de calendario.
    - `metodo \u00B7 precio` en la fila de pago.
  - Botón `Editar` (outline) disponible para vendedor mientras la propuesta no este confirmada (`PROPOSED`, `COUNTER_PROPOSED`).
  - Acción crítica en card: `Cancelar quedada`.
  - Tipografía unificada en acciones de card (principal, outline y texto): `16px`.
  - Hora de envio fija en esquina inferior derecha, alineada con el último elemento visible de la card, sin crear bloque de espacio extra al final.
  - `Editar` abre el overlay de propuesta reutilizando los datos ya cargados.
- Mapa en card de propuesta:
  - Miniatura superior con render real de mapa (sin controles `+/-`).
  - Sin texto superpuesto sobre la miniatura para evitar crecimiento vertical por direcciones largas.
  - Tap en miniatura abre una previsualización en grande, solo lectura, con cierre por `X`.
  - La previsualización en grande no incluye buscador ni acciones de selección.
  - El pin de miniatura usa estilo Wallapop (cápsula turquesa + mini triangulo unido).
- Robustez de datos de ubicación:
  - La propuesta guarda latitud/longitud (`proposedLocationLat`, `proposedLocationLng`) junto a `proposedLocation`.
  - Se evita depender de geocodificación en tiempo de render para dibujar mapa en card.
- `WallapopChatWorkspace` en ancho fluido completo (`w-full`) sin `max-width` en desktop, para evitar márgenes laterales blancos y adaptarse al ancho de cada dispositivo.
- Layout mobile del workspace ajustado para mantener el composer anclado al fondo sin hueco inferior.
- Header de buzón simplificado sin acción de menu tipo hamburguesa.
- Acción de "mas opciones" (`ellipsis_horizontal`) ubicada en la cabecera de cada conversación, alineada a la derecha.
- Cabecera de conversación con avatar circular de perfil del comprador junto al menu de tres puntos para mayor fidelidad al patrón de Wallapop.
- Las fotos de perfil de contraparte en conversación/sidebar usan imágenes realistas (personas, paisaje u objeto) para simular uso real de Wallapop.
- En cabecera de conversación, la primera línea del bloque contextual muestra el precio del artículo en lugar del nombre del usuario.
- Footer del wizard de propuesta en móvil con layout estable en una sola fila:
  - Bloque contextual (artículo/comprador) a la izquierda.
  - CTA principal (`Siguiente`/`Enviar propuesta`) a la derecha sin desplazamiento vertical.
  - Título de artículo truncado con elipsis para evitar salto de layout.
  - Se elimina la línea `Proponer quedada` del bloque contextual.
  - Se muestra `userName` en primera línea y la asistencia en segunda.
  - La asistencia replica reglas de `ChatCounterpartCard`:
    - `>90%`: verde.
    - `70% - 90%`: ambar.
    - `<70%`: `Baja asistencia a quedadas` en rojo.
- Ajuste de botones:
  - `Button.variant=critical` usa radio tipo pill consistente con el resto de botones de acción Wallapop.
- Estado de entrega con icono `double_check` unificado en listado y burbujas (`sent` gris, `read` verde), con bubble enviada usando padding horizontal simétrico.
- CTA de llegada en castellano:
  - `Estoy aqui` gestionado unicamente desde `MeetupCard`.
- Buzón de conversaciones con escenario realista: multiples interesados por artículo, textos de chat plausibles e imagen de producto por conversación.
- El chat de `Bicicleta fixie Fuji` (`conv-002`) incluye una propuesta activa del vendedor para validar la variante inversa de `MeetupCard` desde el rol comprador.
- Estados comerciales representados en el listado de conversaciones con los indicadores visuales del sistema de diseño:
  - `WithBookmark` (`leadingIndicator="bookmark"`) para anuncios reservados.
  - `WithDeal` (`leadingIndicator="deal"`) para anuncios vendidos.
  - Color oficial de icono/acento:
    - `Reservado`: `#86418A`.
    - `Vendido`: `#D32069`.
- Sincronización estado comercial <-> meetup:
  - Al confirmar una propuesta (`CONFIRMED`) el artículo pasa automaticamente a `Reservado` en listado y card derecha.
  - En `ARRIVED` se mantiene `Reservado`.
  - Si la quedada termina en `CANCELLED`, se elimina la reserva automaticamente.
  - El estado `Vendido` prevalece y no se sobreescribe por sincronización de meetup.
- Toggle manual en card de producto (seller):
  - `Reservar` activa estado `Reservado` y muestra icono de reserva en listado + badge en card.
  - `Anular reserva` revierte a estado sin reserva.

---

### Norma interna de implementación de nuevas secciones

- Al crear una nueva sección/apartado de UI, reutilizar primero componentes existentes del design system.
- Si el componente necesario no existe:
  - Definirlo y documentarlo siguiendo tokens y reglas del design system.
  - Registrar su story bajo `Design System/*` en Storybook.
  - Verificar que el estado/caso nuevo quede visible también en el Design System vivo (`src/pages/design-system-page.tsx`), directamente o a traves de la story.
  - Implementar después la sección funcional consumiendo ese componente (no con UI ad-hoc).
- Antes de mergear, sincronizar cambios de implementación y documentación en `plans/design-system/` y `docs/elements/`.

---

### Contrato funcional v2 (2026-02-23)

Esta sección define la versión de referencia para flujo de estados y comportamiento por rol.
Si hay conflicto con secciones anteriores, prevalece este contrato v2.

#### 1) Estados soportados

- `PROPOSED`
- `COUNTER_PROPOSED`
- `CONFIRMED`
- `ARRIVED`
- `COMPLETED`
- `CANCELLED`

No se introducen nuevos estados terminales en esta iteración.

#### 2) Flujo por rol (decisión complete)

- Estado `null` (sin meetup activo):
  - `SELLER`: puede iniciar propuesta (`PROPOSE`).
  - `BUYER`: no puede iniciar propuesta.
- Estado `PROPOSED`:
  - `BUYER`: puede `ACCEPT`, `COUNTER_PROPOSE`, `CANCEL`.
  - `SELLER`: puede editar propuesta sin cambiar estado.
- Estado `COUNTER_PROPOSED`:
  - `SELLER`: puede `ACCEPT`, `PROPOSE` (reenviar), `CANCEL` y editar propuesta.
  - `BUYER`: espera respuesta del vendedor.
- Estado `CONFIRMED`:
  - `SELLER` y `BUYER`: pueden `MARK_ARRIVED`.
  - `SELLER` y `BUYER`: pueden `CANCEL` hasta el último segundo antes/durante la cita.
    - `LATE_NOTICE` queda fuera de la UI actual (evento reservado para futura fase si se reactiva).
- Estado `ARRIVED`:
  - Se alcanza cuando al menos una parte marca llegada dentro de la ventana valida.
  - Si ambos marcan llegada y hay geovalidación positiva, queda evidencia objetiva de asistencia.
  - Solo `SELLER` puede ejecutar `COMPLETE`.
- Estados terminales:
  - `COMPLETED`: venta cerrada.
  - `CANCELLED`: cancelación manual por una de las partes.
    - Excepción funcional: tras `CANCELLED`, `SELLER` puede reabrir el flujo con un nuevo `PROPOSE` desde el composer.

#### 3) Reglas temporales y de evidencia

- Ventana de llegada: `scheduledAt - 30 min` hasta `scheduledAt + 2 h`.
- Zona roja de cancelación: últimos `30 min` antes de `scheduledAt`.
- Cancelación en zona roja:
  - Mostrar advertencia de impacto en fiabilidad.
  - Enviar notificación prioritaria a la contraparte para evitar desplazamientos innecesarios.
- Cancelación/rechazo desde card:
  - Siempre requiere modal de confirmación.
  - CTA primario: `Si`.
  - CTA secundario (outline): `No`.
- Check-in cruzado:
  - `MARK_ARRIVED` es el mecanismo de evidencia de presencia.
  - Geovalidación por defecto: radio `<= 100m` del punto pactado.
  - Si solo una parte valida llegada y la otra no, debe poder resolverse como no-show atribuible.

#### 4) Política de no-show y cierres

- No existe estado EXPIRED.
- El no-show se resuelve con CANCELLED y cancelReason (NO_SHOW_BUYER, NO_SHOW_FINAL_CONTRADICTION).
- El reporte de no-show requiere 5 minutos de cortesía tras scheduledAt.

#### 5) Fiabilidad y seguimiento post-encuentro

- La fiabilidad se comunica como indicador positivo en perfil (porcentaje de asistencia), evitando framing punitivo.
- El primer prompt post-encuentro para confirmar/valorar debe lanzarse entre `+1 h` y `+2 h` tras la cita.
- Default inicial: `+2 h`, configurable por producto.

#### 6) Contrato de API para siguiente fase de implementación

- `MeetupEvent`:
  - Mantener eventos actuales.
  - Sustituir `EXPIRE` por `REPORT_NO_SHOW` y `CONFIRM_NO_SHOW_FINAL` (seller).
  - `LATE_NOTICE` se mantiene como capacidad de dominio no expuesta en UI por ahora.
- `MeetupMachine`:
  - Añadir metadata de check-in por rol (timestamp y resultado de proximidad).
  - Añadir metadata de resolución de no-show (reportante, ausente inferido, fuente de evidencia).
  - Añadir metadata de impacto de fiabilidad para cancelaciones en zona roja.

---

### Actualización de implementación v3 (2026-02-23)

Esta sección refleja el estado implementado real al cierre de esta conversación.
Si hay conflicto con bloques anteriores, prevalece v3.

#### 1) Flujo y estados en UI

- El estado `COUNTER_PROPOSED` se representa visualmente como `pendiente` (en lugar de `contraoferta`) para mantener foco en revisión del vendedor.
- En propuesta recibida (`BUYER` + `PROPOSED`), la acción `Proponer cambios` abre el overlay de propuesta para editar parametros existentes.
- Al enviar esos cambios desde comprador, la entidad transiciona a `COUNTER_PROPOSED` con los nuevos datos propuestos.
- En todos los estados visibles de la card, el título es `Quedada con <nombre contraparte>`.

#### 2) Ventana de llegada y acciones en confirmado

- Ventana de llegada vigente: `scheduledAt - 30 min` hasta `scheduledAt + 2 h`.
- Mensaje de llegada en card dentro de ventana:
  - `Acercate a menos de 100 metros del punto de encuentro para indicar que has llegado.`
- En `CONFIRMED`:
  - Dentro de ventana: CTA `Estoy aqui` + `Cancelar quedada`.
  - Fuera de ventana: CTAs `Anadir a Calendar` + `Cancelar quedada`.
- El botón `Anadir a Calendar` exporta un `.ics` local para calendario personal.

#### 3) Cancelación en zona roja

- Zona roja: últimos `30 min` previos a la cita.
- La cancelación muestra modal de advertencia y requiere confirmación explicita.
- Al confirmar cancelación en zona roja se mantiene registro de impacto reputacional en metadata.

#### 4) Card de contraparte en desktop

- La métrica ambigua previa fue sustituida por asistencia estructurada.
- Nuevo formato:
  - `X% de asistencia (N)` cuando existe dato suficiente.
  - `Baja asistencia a quedadas` cuando `X < 70`.
- Semaforo visual:
  - `> 90`: color success del sistema.
  - `70-89`: color warning del sistema.
  - `< 70`: color error del sistema y sin porcentaje.
- Las estrellas muestran recuento de valoraciones al lado: `(N)`.
- El tamaño tipográfico de `km de ti`, asistencia y `(N)` de valoraciones esta alineado en `14px`.

---

### Flujo visual de referencia

- User flow Mermaid oficial: `docs/wallapop-meet-user-flow.md`.




