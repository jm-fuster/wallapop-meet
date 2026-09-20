# Componentes v1 - Wallapop Meet

## Objetivo
Definir la API visual mùnima de componentes para implementar los flujos de Wallapop Meet con consistencia.


## Regla global de implementaciùn (Source of Truth)
- Storybook y componentes en `src/components/*` deben consumir tokens semùnticos/aliases (`styles.json` + `src/index.css`) como fuente de verdad.
- En cùdigo nuevo de componentes documentados en Storybook (`Design System/*`), no se permite color hardcodeado en hex.
- Para color semùntico usar copia directa: `var(--alias-corto)` y/o raùz Tailwind `text-/bg-/border-<raiz>`.
- Todo componente alcanzable desde `src/App.tsx` debe exportar `designSystemMeta` y tener story sincronizada en `Design System/*`.
- Siempre que cambie un componente, actualizar tambien el Design System vivo (`src/pages/design-system-page.tsx`) para reflejar el nuevo estado/caso (de forma directa o consumiendo su story).
## 1. Botùn (`Button`)
Propiedades visuales:
- `variant`: `primary | secondary | ghost | link | nav_expandable | tab | inline_action | icon | menu_close`
- `size`: `sm | md | lg | tab`
- `state`: `default | hover | pressed | focused | disabled | loading`
- `icon`: `none | leading | trailing | only`

Tokens base:
- `primary`:
  - Fondo: `tokens.color.button.primary.background`
  - Texto: `tokens.color.button.primary.text`
  - Radio: `tokens.radius.button.pill`
  - Tipografia: `tokens.typography.button.primary`
- `nav_expandable`:
  - Fondo: `tokens.color.button.nav.background`
  - Texto: `tokens.color.button.nav.text`
  - Radio: `tokens.radius.none`
  - Tipografia: `tokens.typography.button.nav`
- `tab`:
  - Fondo: `tokens.color.button.tab.background`
  - Texto: `tokens.color.button.tab.text`
  - Fondo (`selected`): `tokens.color.button.tab.background_selected`
  - Texto (`selected`): `tokens.color.button.tab.text_selected`
  - Texto (`disabled`): `tokens.color.button.tab.text_disabled`
  - Radio: `tokens.radius.button.pill`
  - Tipografia: `tokens.typography.button.tab`
- `inline_action`:
  - Fondo: `tokens.color.button.inline_action.background`
  - Texto: `tokens.color.button.inline_action.text`
  - Radio: `tokens.radius.button.inline_pill`
  - Tipografia: `tokens.typography.button.inline_action`
- `icon`:
  - Fondo: `tokens.color.button.icon.background`
  - Icono: `tokens.color.button.icon.foreground`
  - Radio: `tokens.radius.button.circular`
  - Sombra: `tokens.shadow.button.icon`
- `menu_close`:
  - Fondo: `tokens.color.button.menu_close.background`
  - Icono: `tokens.color.button.menu_close.foreground`
  - Radio: `tokens.radius.button.menu_close`
- `secondary`:
  - Tipo: outline para continuidad de flujo (`Anadir a Calendar`, `Reenviar propuesta`).
- `ghost`:
  - Tipo: accion textual sin borde ni fondo.
- `link`:
  - Tipo: enlace textual contextual para acciones inline.

Reglas:
- Variantes base y extendidas alineadas con capturas de Wallapop Chat y necesidades del flujo de meetup.
- `loading` mantiene ancho para evitar cambios de layout.
- `icon` y `menu_close` requieren `aria-label` obligatorio.
- En mùvil, cualquier acciùn crùtica mantiene ùrea tùctil mùnima de `44x44` aunque el icono visual sea menor.

## 2. Campo de entrada (`Input`)
Propiedades visuales:
- `type`: `text | number | date | time`
- `state`: `default | hover | focused | filled | error | success | disabled`
- `helper`: `none | hint | error`
- `label`: `floating | hidden`
- `counter`: `visible | hidden` (cuando existe `maxLength`)

Tokens base:
- Texto input: `tokens.color.input.text`
- Label/subtext/counter: `tokens.color.input.label`
- Placeholder en foco: `tokens.color.input.placeholder_focus`
- Ring default: `tokens.color.input.ring.default`
- Ring hover/focus: `tokens.color.input.ring.hover`
- Ring error: `tokens.color.input.ring.error`
- Ring success: `tokens.color.input.ring.success`
- Opacidad disabled: `tokens.opacity.input_disabled`
- Radio: `tokens.radius.300`
- Padding base: `components.input.padding_y_default` + `components.input.padding_x`
- Padding compacto (`filled/focused`): `components.input.padding_y_compact` + `components.input.padding_x`

Reglas:
- Basado en captura oficial de `https://es.wallapop.com/app/catalog/upload/consumer-goods` (2026-02-18).
- Usar `box-shadow inset` para representar borde/ring; no usar `border` fùsico.
- `label` flotante: tamaùo `16px/24px` en `default`, `14px/20px` en `filled/focused`.
- Mostrar ayuda/error siempre debajo del campo, nunca en placeholder.
- Si existe `error`, prevalece sobre `hint`.
- `counter` se muestra con formato `actual/max` cuando existe `maxLength`.
- En estado `error`, mostrar indicador visual a la derecha (`error-indicator`) con exclamacion sobre fondo rojo.

## 3. Selector (`Select`)
Propiedades visuales:
- `state`: `default | focused | error | disabled`
- `size`: `md | lg`
- `dropdownDirection`: `down | up`
- `maxVisibleOptions`: nùmero de opciones visibles antes de scroll

Reglas:
- Debe soportar lista de puntos de encuentro sugeridos.
- Altura tùctil mùnima de 44 px.
- El panel del dropdown debe tener altura fija y scroll interno para listas largas.
- En overlays mùviles, permitir desplegar hacia arriba (`dropdownDirection=up`) para no ocultar opciones fuera de viewport.

## Matriz de estados (fase inicial)

### `Button`
| Estado | Quù cambia visualmente | Comportamiento |
| --- | --- | --- |
| `default` | Segùn `variant` real (`primary`, `nav_expandable`, `tab`, `inline_action`, `icon`, `menu_close`) | Acciùn disponible |
| `hover` | Ajuste de color/fondo sin alterar dimensiones | Solo feedback visual |
| `pressed` | Ajuste de contraste o elevaciùn segùn variante | Mantiene semùntica de la variante |
| `focused` | `focus ring` visible con `tokens.color.border.focus` | Navegaciùn por teclado accesible |
| `disabled` | Opacidad reducida + cursor no interactivo | No dispara `onClick` |
| `loading` | Spinner + texto de carga; ancho estable | Bloquea interacciùn temporalmente |

### `Input`
| Estado | Quù cambia visualmente | Comportamiento |
| --- | --- | --- |
| `default` | Ring `1px inset` en `tokens.color.input.ring.default`, label `16px/24px` | Entrada editable |
| `hover` | Ring `2px inset` en `tokens.color.input.ring.hover` | Solo feedback visual |
| `focused` | Ring `2px inset` en `tokens.color.input.ring.hover`, padding compacto, label flotante compacta | Foco visible y ediciùn activa |
| `filled` | Mantiene label compacta (`14px/20px`) y padding compacto | Conserva jerarquùa label/valor |
| `error` | Ring `2px inset` en `tokens.color.input.ring.error`, label y helper en error | `aria-invalid=true` |
| `success` | Ring `2px inset` en `tokens.color.input.ring.success`, helper en success | Confirmaciùn visual de validez |
| `disabled` | Opacidad `tokens.opacity.input_disabled`, sin hover interactivo | No editable |

Notas:
- `helper` siempre bajo el campo (`hint` o `error`), nunca en placeholder.
- Si existe `error`, prevalece sobre `hint`.

### `Select`
| Estado | Quù cambia visualmente | Comportamiento |
| --- | --- | --- |
| `default` | Borde `tokens.color.border.default` + icono de desplegable | Selecciùn disponible |
| `focused` | `focus ring` + borde `tokens.color.border.focus` | Navegable por teclado |
| `error` | Borde `2px` en `tokens.color.input.ring.error` + mensaje de error | `aria-invalid=true` |
| `disabled` | Opacidad reducida + cursor no interactivo | No se puede abrir |

Notas:
- Tamaùos soportados: `md` (44 px) y `lg` (48 px).
- Debe aceptar opciones de puntos de encuentro sugeridos.
- Cuando la lista supere `maxVisibleOptions`, usar scroll interno sin desplazar layout general.

## 4. Chip / Etiqueta (`Chip/Tag`)
Propiedades visuales:
- `variant`: `neutral | success | warning | error | info`
- `state`: `default | selected | disabled`

Uso:
- Mostrar estado de meetup y filtros rùpidos de propuestas.

## 5. Tarjeta (`Card`)
Propiedades visuales:
- `variant`: `base | elevated | outlined | interactive`
- `state`: `default | pressed | focused`

Uso:
- Tarjeta principal de meetup confirmado.
- Resumen de propuesta y contraoferta.

## 6. Banner
Propiedades visuales:
- `variant`: `info | success | warning | error | meetup_day`
- `dismissible`: `true | false`

Uso:
- Banner persistente del dùa del meetup.
- Alertas de ventana de llegada y expiraciùn.

## 7. Mensaje emergente (`Toast`)
Propiedades visuales:
- `variant`: `info | success | error`
- `duration`: `short | medium | long`

Reglas:
- No usar para errores bloqueantes.
- Mostrar un solo `toast` a la vez y con cierre automùtico por duraciùn.

## 8. Modal
Propiedades visuales:
- `variant`: `confirmation | destructive | form`
- `size`: `sm | md | lg`

Uso:
- Confirmar cancelaciùn.
- Confirmar resultado post meetup.

## 9. Elemento de lista (`List Item`)
Propiedades visuales:
- `variant`: `default | selectable | navigable`
- `state`: `default | pressed | selected | disabled`

Uso:
- Listado de ubicaciones sugeridas por mapa.
- Historial de propuestas de fecha/hora.

## 10. Insignia (`Badge`)
Propiedades visuales:
- `variant`: `success | error | warning | info | neutral`

Uso:
- Estado compacto en chat o lùnea temporal.

## 11. Iconografia (`WallapopIcon`)
Propiedades visuales:
- `name`: naming Wallapop (`arrow_left`, `cross`, `chevron_right`, `shield`, `paper_plane`, etc.)
- `size`: `small | medium | large`
- `state`: `default | disabled`

Reglas:
- Fuente de verdad de nombres: `docs/elements/icons.md`.
- El wrapper de implementacion en app es `src/components/ui/wallapop-icon.tsx`.
- Mientras no exista libreria publica oficial, mapear a iconos equivalentes en `lucide-react` manteniendo naming Wallapop en la API.
- En movil, mantener escala `16px` (`small`) y `24px` (`medium`) con area tactil minima de `44x44` en controles accionables.
- Para estado de entrega de mensajes, `double_check` debe verse compacto y de bajo protagonismo visual frente al texto/hora.
- Para acciones contextuales de conversacion, usar `ellipsis_horizontal` en cabecera de `ConversationPane` y evitar su uso en preview de lista.
- `bot` (Lucide `Bot`): mensajes de asistente o sistema; uso referenciado en `ChatMeetRatingPromptBubble` y catalogado en Design System (Iconography).

## 12. Navegacion inferior de inbox (`InboxBottomNav`)
Propiedades visuales:
- `items`: lista de 5 acciones de primer nivel (`Inicio`, `Favoritos`, `Vender`, `Buzon`, `Tu`)
- `activeItemId`: item activo (`aria-current="page"`)
- `badgeCount`: opcional por item para notificaciones no leidas
- `state`: `default | active | focused`

Reglas:
- Altura visual objetivo similar a runtime movil de Wallapop Chat (footer fijo con borde superior).
- Cada accion mantiene layout vertical (icono arriba, etiqueta abajo).
- En `active`, usar mayor contraste de color y peso tipografico en etiqueta.
- Todos los items usan el mismo ancho, altura y separacion horizontal para evitar solapamientos.
- En etiquetas de item, garantizar legibilidad sin corte de texto en viewport movil de referencia.
- Todos los items deben ser navegables por teclado y exponer nombre accesible.

## 13. Linea temporal de meetup (`MeetupTimeline`)
Propiedades visuales:
- `currentStatus`: `null | PROPOSED | COUNTER_PROPOSED | CONFIRMED | ARRIVED | COMPLETED | CANCELLED`

Reglas:
- Debe mantener orden fijo de estados para facilitar lectura del progreso.
- Las etiquetas se muestran traducidas en minusculas (`propuesta`, `contrapropuesta`, `confirmada`, `has llegado`, `completada`, `cancelada`), nunca el enum crudo.
- `COMPLETED` y `CANCELLED` son terminales mutuamente excluyentes: solo se renderiza el terminal que aplica (`cancelada` sustituye a `completada` cuando la quedada esta cancelada).
- En estado `null`, todos los pasos se muestran como pendientes.
- Estado actual resaltado visualmente.
- Estados anteriores al actual se muestran como completados; con la quedada cancelada, los pasos intermedios quedan neutros (el estado actual no permite afirmar hasta donde llego el flujo).
- Estados finales (`COMPLETED`, `CANCELLED`) deben comunicarse tambien con texto, no solo color.

## 14. Simulador de flujo (`MeetupSimulator`)
Propiedades visuales:
- Composicion de `Button`, `MeetupTimeline` y bloque de contexto temporal.
- Selector de rol activo (`SELLER` / `BUYER`) con `Button.variant=tab`.
- Acciones contextuales segun estado y reglas de negocio.

Reglas:
- Debe exponer errores de transicion para QA funcional.
- Debe permitir simular hora para validar ventana de llegada (`-30m` a `+2h`).
- Se considera herramienta de validacion interna, no UI final de produccion.

## 15. Tarjeta de meetup (`MeetupCard`)
Propiedades visuales:
- `meetup`: estado actual de la entidad.
- `actorRole`: `SELLER | BUYER`.
- `currentTime`: hora de referencia para reglas temporales.
- `onMeetupChange`: callback de transicion valida.
- `onError`: callback de error de transicion.
- `onEditProposal`: callback para reabrir el wizard en modo edicion.
- `onOpenMapPreview`: callback para abrir previsualizacion de mapa en grande.
- `buyerWalletAvailableEur?: number`: saldo disponible del comprador para validar pago en Wallapop Wallet (workspace de demo).
- `onWalletTopUp?: (amountEur: number) => void`: callback al confirmar recarga desde `WalletTopUpSheet` cuando falta saldo al aceptar.
- `distanceToMeetupMeters?: number | null`: distancia al punto acordado (metros); determina aviso de proximidad y desbloqueo de `Estoy aqui` en conjunto con la ventana temporal.

Reglas:
- Debe renderizar acciones contextuales por estado de negocio y por rol visible en chat.
- En `SELLER`, la card se alinea en el lado derecho del hilo cuando existe propuesta activa.
- En `BUYER`, la card se alinea en el lado izquierdo del hilo cuando recibe una propuesta en `PROPOSED`.
- Titulo fijo en card para todos los estados: `Quedada con <counterpartName>`.
- Debe mostrar label de estado traducida en minusculas:
  - `PROPOSED` -> `pendiente`
  - `COUNTER_PROPOSED` -> `pendiente`
  - `CONFIRMED` -> `confirmada`
  - `ARRIVED` -> `has llegado`
  - `COMPLETED` -> `completada`
  - `CANCELLED` -> `cancelada`
- Icono a la izquierda del texto en el chip (Lucide `lucide-react`), tamaùo `var(--wm-size-12)`, decorativo `aria-hidden` (el texto describe el estado):
  - `pendiente` / `COUNTER_PROPOSED`: `Clock`
  - `confirmada`: `CheckCircle2`
  - `has llegado`: `MapPin`
  - `completada`: `Handshake` (misma semantica visual que `WallapopIcon` `deal` / venta completada)
  - `cancelada`: `XCircle`
  - Sin estado de propuesta: `CircleDashed`
- El chip compone `Label` con `className` que alinea icono y texto (`items-center gap-1`).
- Colores de label por estado:
  - `pendiente`: blanco/neutro
  - `COUNTER_PROPOSED`: reutiliza `pendiente` (sin variante visual adicional)
  - `confirmada`: success
  - `has llegado`: info
  - `completada`: acento de vendido (`#D32069`)
  - `cancelada`: error
- El bloque informativo de la propuesta debe renderizar exactamente 3 filas con icono a la izquierda:
  - Calendario: dia y hora.
  - Mapa: direccion.
  - Billete: metodo de pago y precio.
- El copy de la accion critica en card debe usar sufijo de contexto: `Cancelar quedada` o `Rechazar quedada`.
- El separador visual de las filas de contenido usa `\u00B7`:
  - `dia \u00B7 hora`
  - `metodo \u00B7 precio`
- La miniatura superior debe ser un render real de mapa, sin texto superpuesto.
- La miniatura superior debe ocultar controles de zoom `+/-`.
- La card debe mantener fondo blanco y sin sombreado, alineada visualmente al estilo de burbuja de chat.
- Tap en miniatura abre modal de mapa en grande, solo lectura, con cierre por `X`.
- `Estoy aqui` solo habilitado en `CONFIRMED` y ventana valida (`-30m`, `+2h`).
- Debe comunicar motivo de deshabilitado fuera de ventana.
- Debe permitir `Editar` para `SELLER` en `PROPOSED` y `COUNTER_PROPOSED`.
- En propuesta recibida por comprador (`BUYER` + `PROPOSED`) debe mostrar 3 acciones:
  - `Aceptar`
  - `Rechazar quedada`
  - `Proponer cambios`
- Tipologia de botones en `MeetupCard`:
  - `principal`: accion primaria del estado (`Aceptar`, `Estoy aqui`, `Confirmar venta`, etc.).
  - `outline`: accion secundaria de continuidad (`Editar`, `Proponer cambios`, `Anadir a Calendar`, `Reenviar propuesta`).
  - `texto`: accion destructiva suave (`Cancelar quedada`, `Rechazar quedada`).
- Al ejecutar accion `Cancelar quedada` o `Rechazar quedada`, siempre abrir modal de confirmacion:
  - CTA principal: `Si`.
  - CTA secundaria outline: `No`.
- Tipografia de botones en `MeetupCard`:
  - Todos los botones de accion (`principal`, `outline`, `texto`) usan `16px`.
- Hora de envio en card:
  - Se muestra en esquina inferior derecha.
  - Debe quedar alineada verticalmente con el ultimo elemento visible de la card.
  - No debe crear un bloque extra de espacio en blanco al final del componente.
- Metodos de pago en overlay de propuesta: `EFECTIVO` (Cash) y `WALLAPOP WALLET` (Wallet); no `Bizum`.
- Con `proposedPaymentMethod === WALLET` y rol `BUYER` solo en `PROPOSED` o `COUNTER_PROPOSED`: `NoticeBanner` con `tone=success` (fondo verde Wallapop / acento) y copy educativo sobre Wallet. No se muestra ese bloque en `CONFIRMED` ni estados posteriores.
- No se muestra en la card el aviso de importe apartado en monedero (`walletHoldAmountEur`); el hold sigue existiendo en dominio pero sin banner dedicado en UI.
- El boton `Aceptar` con Wallet no se deshabilita por falta de saldo: al pulsar, si el saldo es insuficiente, se invoca `onWalletTopUp` para abrir `WalletTopUpSheet` (`src/components/meetup/wallet-top-up-sheet.tsx`).
- En `CONFIRMED`, dentro de ventana y con distancia aun mayor a la minima de proximidad, puede mostrarse un aviso para acercarse; si `Estoy aqui` ya esta habilitado por proximidad, no se muestra ese aviso redundante.
- En `ARRIVED` con Wallet, el vendedor ve CTA principal de escaneo de QR del comprador (`Escanear codigo QR de <nombre>`); con Efectivo se mantiene `Confirmar venta`.
- En `ARRIVED` con Wallet y comprador que ya marco llegada (`arrivalCheckins.BUYER`): CTA principal `Mostrar codigo QR` (`Button.variant=status_sold_solid`, icono `QrCode`, pildora ancha). Abre un dialog modal (patron scrim + panel centrado, mismo familia que confirmacion de cancelacion) con titulo `Pago con Wallapop Wallet`, cuerpo instructivo, `WalletInPersonQr` (payload `buildWalletInPersonPayPayload` en `src/meetup/wallet-payment-qr.ts`), codigo numerico de 6 digitos bajo el QR (`deriveWalletDisplayCode`), etiqueta `Codigo de verificacion`, CTA `Cerrar` y cierre al pulsar fuera del panel. El QR no se muestra inline en la card.

## 16. Composer de chat (`ChatComposer`)
Propiedades visuales:
- `onSubmit`: envio de mensaje.
- `submitLabel` / `submitAriaLabel`: accesibilidad del boton de envio.
- `secondaryActionLabel`: etiqueta accesible para accion secundaria.
- `secondaryActionAriaLabel`: alternativa accesible.
- `secondaryActionIconName`: icono de accion secundaria (`WallapopIconName`).
- `onSecondaryAction`: apertura de flujo contextual (meetup).
- `secondaryActionDisabled`: bloqueo de accion secundaria.

Reglas:
- El footer usa padding simetrico para mantener equilibrio visual entre botones izquierdo/derecho.
- El boton de envio y el secundario son circulares y mantienen area tactil minima de `40x40` (`sm`) y `44x44` (movil).
- La accion secundaria se usa para iniciar `Proponer quedar` sin ocupar ancho con texto.
- En workspace de meetup, la accion secundaria se ubica a la derecha, justo antes de `paper_plane`.
- El icono por defecto para esta accion en meetup es `calendar`.
- La accion secundaria debe ocultarse cuando el actor no es `SELLER`; para `BUYER` solo se renderiza el boton de envio.
- Para `SELLER`, la accion secundaria se muestra cuando no hay meetup activo o cuando el ultimo estado fue `CANCELLED`.

## 17. Banner de seguridad de chat (`ChatSecurityBanner`)
Propiedades visuales:
- `message`: mensaje principal.
- `linkText`: accion secundaria contextual.
- `onLinkClick`: callback opcional.
- `showIcon`: muestra/oculta escudo.

Reglas:
- Debe mostrarse fijo sobre el composer en el chat workspace.
- En footer fijo se usa variante compacta (menos alto) para no desplazar demasiado los mensajes.
- No reemplaza errores bloqueantes ni toast; es aviso contextual persistente.

## 18. Mapa de ubicacion de meetup (`MeetupLocationMap`)
Propiedades visuales:
- `center`: centro actual del mapa (`lat`, `lng`).
- `safePoints`: puntos seguros sugeridos.
- `selectedPointId`: punto seleccionado.
- `selectedCustomPoint`: marcador de seleccion manual.
- `onMapClick`: callback al pulsar en mapa.
- `onSafePointClick`: callback al pulsar en marcador seguro.

Reglas:
- Implementado con `react-leaflet` + teselas OpenStreetMap.
- Debe permitir seleccionar ubicacion custom con click en mapa.
- Debe mostrar marcadores con estilo Wallapop tipo capsula + mini triangulo unido:
  - Punto seguro: icono `shield`.
  - Punto personalizado: icono `deal` (manos).
- Al seleccionar un punto seguro, mostrar tooltip persistente con formato `<nombre> - Punto seguro`.
- Debe poder convivir dentro de un overlay con alto maximo y scroll interno sin desbordar viewport.
- En contexto del wizard movil, ocultar controles de zoom `+/-` y mantener zoom por gesto tactil.

## 19. Overlay de propuesta meetup (`MeetupProposalOverlay`)
Propiedades visuales:
- `step`: `1 | 2 | 3`
- `selectedOptionId`: opcion actualmente seleccionada para propuesta.
- `selectableOptions`: cola visual de 2 opciones seleccionables en paso 1.
- `mapPickerOpen`: estado de vista de mapa para seleccion.
- `errorMessage`: validacion contextual del wizard.

Reglas:
- Wizard en 3 pasos: fecha/hora, punto, preferencia de pago.
- Paso 2 siempre muestra exactamente 2 opciones seleccionables.
- El modelo de paso 2 es una cola de las 2 ultimas selecciones:
  - Una seleccion nueva entra en primera posicion.
  - La anterior pasa a segunda posicion.
  - Si habia una tercera, se descarta.
- Las cards de punto seguro muestran:
  - Nombre
  - Direccion
  - Label unico `Punto seguro ù <N> ventas completadas`.
- Las cards de punto personalizado muestran:
  - Icono `deal` (manos) en el pin del mapa
  - Direccion seleccionada
  - Sin label `Personalizado`.
- No existe boton `Cancelar` en el footer del wizard; cierre mediante boton `X` de cabecera.
- Footer del wizard en movil:
  - Bloque contextual de articulo/comprador alineado a la izquierda.
  - CTA principal (`Siguiente` o `Enviar propuesta`) alineado a la derecha.
  - Texto de articulo truncado con elipsis para no desplazar la CTA.
- Validaciones del wizard:
  - El CTA no se deshabilita por campos incompletos.
  - Mensaje global unificado: `Faltan campos por rellenar`.
  - Cada bloque incompleto debe mostrar helper/error debajo del propio componente o grupo.
  - El estado de error debe usar mismo color y grosor que `Input` (`tokens.color.input.ring.error`, `2px`).
  - En paso 3, el importe admite hasta `99999 ù` con maximo `2` decimales.
  - En paso 3, si el importe supera `2000 ù`, mostrar alerta destacada de normativa DAC7 con enlace de ayuda (`Mùs informaciùn`).
- En paso 3, los iconos de metodos de pago se muestran sin capsula/circunferencia de fondo.
- En vista de mapa:
  - Permitir seleccion de punto seguro y punto personalizado (tap libre sobre mapa).
  - Al seleccionar personalizado, no mostrar aviso de punto no verificado en el panel inferior.
  - Al seleccionar punto seguro, mostrar bloque de ventas con el mismo patron visual del aviso de no verificado, usando variante verde Wallapop.
  - Mostrar distancia `m/km` en chip de una sola linea (`no-wrap`).
  - Bottom sheet de seleccion debe renderizarse por encima del mapa (`z-index` superior).

## 20. Card de contraparte en chat (`ChatCounterpartCard`)
Propiedades visuales:
- `name`: nombre del usuario contraparte.
- `rating`: puntuacion en estrellas (soporta media estrella).
- `distanceLabel`: texto de distancia relativa (`N km de ti`).
- `locationLabel`: texto de ubicacion o estado (`Desconocido`).
- `profileImageSrc`: avatar circular opcional.

Reglas:
- Uso previsto en desktop dentro del sidebar derecho del workspace de chat.
- Debe mantener jerarquia de lectura: nombre > rating > distancia/ubicacion.
- El nombre comparte tamaùo base con metadatos y se diferencia por peso tipografico.

## 21. Card de producto en chat (`ChatProductCard`)
Propiedades visuales:
- `viewerRole`: `seller | buyer`.
- `imageSrc`, `title`, `price`.
- `viewsCount`, `likesCount` (solo `seller`).
- `statusLabel` (solo `buyer`).
- `onEdit`, `onReserve`, `onSold` (acciones solo `seller`).

Reglas:
- `seller`: mostrar lapiz sobre imagen, CTAs de publicacion y metricas (ojo/corazon) junto al precio.
- `buyer`: ocultar lapiz, ocultar CTAs y ocultar metricas de publicacion.
- Debe ser reutilizable en la columna lateral desktop del chat.
- Color de acciones comerciales:
  - `Reservar`: `tokens.color.card.action.reserve` (`#86418A`).
  - `Vendido`: `tokens.color.card.action.sold` (`#D32069`).
- Badge de estado comercial en modo `buyer`:
  - `Reservado`: icono/texto en `tokens.color.list_item.leading_indicator.reserved` (`#86418A`).
  - `Vendido`: icono/texto en `tokens.color.list_item.leading_indicator.sold` (`#D32069`).

## 22. Selector de calendario (`CalendarPicker`)
Propiedades visuales:
- `monthDate`: mes visible actual.
- `selectedDateValue`: fecha seleccionada en formato local (`YYYY-MM-DD`).
- `minDateValue`: fecha mùnima seleccionable.
- `onMonthChange`: navegaciùn de mes.
- `onSelectDate`: selecciùn de dùa.
- `state`: `default | error`.
- `error`: texto de ayuda/error inferior opcional.

Reglas:
- Grid fijo de 6 semanas (42 celdas) para evitar saltos de layout entre meses.
- Dùas fuera del mes visible se muestran con menor contraste.
- Dùas bloqueados por fecha mùnima deben estar deshabilitados visual y semùnticamente.
- Dùa seleccionado usa borde oscuro + texto oscuro (sin fondo de acciùn principal).
- Flechas de navegaciùn izquierda/derecha deben compartir el mismo lenguaje visual (`chevron`).
- En `error`, usar borde `2px` en `tokens.color.input.ring.error` y helper inferior en el mismo color.

## 23. Cabecera de paso de wizard (`MeetupWizardStepHeading`)
Propiedades visuales:
- `caption`: texto contextual de paso.
- `title`: tùtulo opcional del bloque.
- `onBack`: acciùn de volver.

Reglas:
- Botùn de vuelta circular con iconografùa `arrow_left`.
- `caption` siempre visible para contexto, incluso si no existe tùtulo.
- Si `title` existe, usar jerarquùa tipogrùfica de encabezado de paso (`20/22`).

## 24. Footer de propuesta (`MeetupProposalFooter`)
Propiedades visuales:
- `listingImageSrc`, `itemTitle`, `userName`: contexto de la propuesta.
- `actionLabel`: etiqueta de CTA final.
- `actionDisabled`: estado deshabilitado.
- `actionTextTone`: `dark | light` para ajustar contraste del CTA.
- `onAction`: callback de CTA.

Reglas:
- Layout de 2 zonas: contexto de ùtem/comprador (izquierda) + CTA (derecha).
- Debe truncar textos largos sin desplazar la CTA.
- En estado deshabilitado, CTA mantiene fondo gris y texto oscuro.

## 25. Cabecera de propuesta (`MeetupProposalHeader`)
Propiedades visuales:
- `currentStep`: paso actual.
- `totalSteps`: total de pasos del wizard.
- `steps`: metadatos de cada paso (`id`, `label`, `disabled`).
- `onClose`: cierre de overlay.
- `onStepChange`: navegaciùn por paso.
- `helpLabel`: texto de ayuda contextual.

Reglas:
- Estructura en 2 bloques: fila superior (cerrar, tùtulo, ayuda) + barra de progreso clicable.
- La barra de progreso debe reflejar estado activo/inactivo por paso.
- Los pasos bloqueados deben deshabilitar interacciùn manteniendo seùal visual.

## Criterio de completitud
- Cada componente define propiedades, estados, tokens y regla de uso.
- No hay ambigùedad entre uso de `badge`, `chip`, `banner` y `toast`.

## Componentes base aùadidos para evitar duplicaciùn local

- `IconButton` (`src/components/ui/icon-button.tsx`)
  - Wrapper de `Button` para controles icon-only.
  - `aria-label` obligatorio vùa prop `label`.
- `SelectableOption` (`src/components/ui/selectable-option.tsx`)
  - Patrùn reutilizable de opciùn seleccionable con estado visual `selected`.
  - Unifica bordes y estado activo en flujos de propuesta.
- `OverlayHeader` (`src/components/ui/overlay-header.tsx`)
  - Cabecera reutilizable de overlays con tùtulo y cierre.
  - Evita variaciones ad-hoc en headers de modal/sheet.
- `ChatMeetRatingPromptBubble` (`src/components/meetup/chat-meet-rating-prompt-bubble.tsx`)
  - Mensaje de invitacion a valorar tras venta completada en chat; presentacion como mensaje entrante (izquierda).
  - Icono `Bot` (Lucide) en circulo sobre fondo `tokens.color.meet_rating_prompt.icon_background`; CTA capsule con `cta_background` / `cta_hover`.
  - Story: `Design System/Chat Meet Rating Prompt Bubble`; preview en Design System vivo (`/design-system`, seccion Components).

---

## Addendum v2 (2026-02-23) - Componentes y contratos para flujo completo por rol

Si hay conflicto con especificaciones anteriores de este documento, prevalece este addendum v2.

## A. Ajustes de contrato en `MeetupCard`

Reglas funcionales actualizadas:
- El CTA manual `Expirar meetup` queda fuera del contrato UI.
- No existe estado `EXPIRED`; los cierres no exitosos usan `CANCELLED` con `cancelReason`.
- En `CONFIRMED`, ambos roles muestran:
  - `Estoy aqui` (segun ventana de llegada).
  - `Anadir a Calendar` (fuera de ventana).
  - `Cancelar quedada`.
- En `ARRIVED`, `COMPLETE` (`Confirmar venta`) solo para `SELLER`.

Estados y disponibilidad:
- `Estoy aqui`: solo dentro de `-30 min` a `+2 h`.
- `Cancelar quedada`: permitido siempre en estados no terminales, con comportamiento especial en zona roja.

## B. Nuevo patron de accion de retraso (`LATE_NOTICE`)

Componente recomendado:
- Reusar `Button.variant=inline_action` para activar selector rapido.
- Usar `Modal.variant=confirmation` o `List Item.selectable` en bottom sheet para seleccionar ETA.

API funcional esperada:
- Evento de dominio: `LATE_NOTICE`.
- Payload: `etaMinutes: 10 | 20`.
- Efecto en UI:
  - No cambia estado de meetup.
  - Muestra confirmacion local y dispara notificacion a contraparte.

Estado actual:
- El patron `LATE_NOTICE` no esta expuesto como CTA en la UI actual.
- Si se retoma en una version futura, debe documentarse en un addendum nuevo.

## C. Modal de cancelacion en zona roja (`< 30 min`)

Componente:
- `Modal.variant=destructive`.
- `size=md`.

Props minimas:
- `isRedZone: boolean`
- `minutesToMeetup: number`
- `onConfirmCancel`

Comportamiento:
- Fuera de zona roja: confirmacion de cancelacion estandar.
- En zona roja:
  - Mensaje de impacto en fiabilidad.
  - Confirmacion explicita para continuar con cancelacion.

Copy base en zona roja:
- Titulo: `Faltan menos de 30 min para la quedada`.
- Cuerpo: `Cancelar ahora afectara a tu fiabilidad.`
- CTA primario: `Cerrar`
- CTA critico: `Cancelar igualmente`

## D. Feedback visual de fiabilidad

Objetivo:
- Comunicar impacto reputacional sin lenguaje punitivo.

Componente sugerido:
- `Banner.variant=warning` en modal/confirmacion de cancelacion en zona roja.
- `Chip/Tag.variant=info` o `Badge.neutral` para representar indicador de asistencia en perfil.

Contrato de contenido:
- Mostrar mensaje orientado a transparencia:
  - `Tu porcentaje de asistencia ayuda a generar confianza en futuras quedadas.`
- Evitar copy de castigo directo.

## E. Metadata funcional requerida (para siguiente fase de implementacion)

Aunque esta iteracion es documental, se fija el contrato que debera soportar el dominio:
- Check-in por rol:
  - timestamp por actor (`SELLER`/`BUYER`).
  - resultado de geovalidacion.
  - distancia al punto acordado.
- Resolucion no-show:
  - actor reportante.
  - actor ausente inferido.
  - fuente de evidencia.
- Impacto de fiabilidad:
  - indicador de cancelacion en zona roja.
  - fecha/hora del evento reputacional.

## F. Escenarios de QA vinculados a componentes

Los siguientes escenarios deben tener story de estado o caso de prueba visual:
1. `MeetupCard` en `CONFIRMED` sin CTA de expirar.
2. `MeetupCard` en `CONFIRMED` con `Anadir a Calendar` fuera de ventana.
3. Modal de cancelacion fuera de zona roja.
4. Modal de cancelacion en zona roja con warning de fiabilidad.
5. `MeetupCard` con `Cancelar quedada` en estilo texto.
6. `MeetupCard` en `ARRIVED` con `Confirmar venta` solo para `SELLER`.

---

## Addendum v3 (2026-02-23) - API visual implementada

Si hay conflicto entre addendum v2 y v3, prevalece v3.

## A. `MeetupCard` (contrato vigente)

Ajustes de props:
- Aùadido `counterpartName?: string` para titulado contextual tras confirmacion.

Titulos:
- Todos los estados:
  - `Quedada con <counterpartName>`.

Acciones en `CONFIRMED`:
- Dentro de ventana `-30 min` a `+2 h`: `Estoy aqui` + `Cancelar quedada`.
- Fuera de ventana: `Anadir a Calendar` + `Cancelar quedada`.
- `Anadir a Calendar` genera descarga local de archivo `.ics`.

Tipologia de botones en `MeetupCard`:
- `principal`: accion principal del estado.
- `outline`: accion secundaria no destructiva.
- `texto`: accion destructiva suave.
- Tamano tipografico unificado en acciones: `16px`.

Hora en card:
- Hora de envio visible en esquina inferior derecha.
- Debe quedar alineada con el ultimo elemento visible de la card.
- No se reserva un bloque de altura adicional solo para la hora.

Etiqueta de estado:
- `COUNTER_PROPOSED` se muestra como `pendiente`.
- `ARRIVED` se muestra como `has llegado` con icono `MapPin` a la izquierda del texto.
- `COMPLETED` usa icono `Handshake` en chip (misma semantica que `WallapopIcon` `deal`).

Flujo de cambios comprador:
- `Proponer cambios` en propuesta recibida abre overlay de edicion (reusa `onEditProposal`).

## B. `ChatCounterpartCard` (contrato vigente)

Props actuales:
- `name: string`
- `rating: number`
- `ratingCount?: number`
- `distanceLabel: string`
- `attendanceRate?: number`
- `attendanceMeetups?: number`
- `profileImageSrc?: string`
- `profileImageAlt?: string`

Reglas de contenido:
- Rating:
  - Mostrar estrellas + `(<ratingCount>)` a la derecha cuando exista dato.
- Distancia:
  - Mantener `distanceLabel` en `14px`.
- Asistencia:
  - `>90`: `X% de asistencia (N)` en success.
  - `70-89`: `X% de asistencia (N)` en warning.
  - `<70`: ocultar porcentaje y mostrar `Baja asistencia a quedadas` en error.

Reglas de color:
- Solo usar colores/tokens ya existentes del sistema.
- Warning de asistencia media: `semantic.warning.base` (en implementacion actual: `#F4A000`).

## C. QA minimo actualizado

Casos que deben seguir cubiertos en story/test visual:
0. Estados oficiales de `MeetupCard` en Design System: `pendiente`, `confirmada`, `30 mins antes`, `has llegado`, `cancelada`, `completada` (chip con icono + texto segun mapeo de seccion 15).
1. `MeetupCard` en `CONFIRMED` dentro de ventana (mensaje de proximidad + `Estoy aqui`).
2. `MeetupCard` en `CONFIRMED` fuera de ventana (solo `Anadir a Calendar` + `Cancelar quedada`).
3. `MeetupCard` con titulo post-confirmacion `Quedada con <nombre>`.
4. `COUNTER_PROPOSED` renderizado como `pendiente`.
5. `ChatCounterpartCard` asistencia alta (`>90`).
6. `ChatCounterpartCard` asistencia media (`70-89`, warning).
7. `ChatCounterpartCard` asistencia baja (`<70`, mensaje rojo sin porcentaje).
8. `ChatConversationHeader` en viewport movil con controles de cabecera compactos (flecha/menu) y espaciado lateral consistente.
9. `ChatConversationHeader` con `productStatusIcon="deal"` en color de vendido (`--status-sold`), nunca color de reservado.
10. `ChatListItem` con preview larga y `lastMessageDeliveryState`, truncando con elipsis sin desplazar badge ni icono de entrega.
11. `MeetupCard` comprador Wallet: banner educativo solo en `pendiente` (no en `confirmada`).
12. `MeetupCard` comprador Wallet en `ARRIVED` con llegada marcada: boton `Mostrar codigo QR` y dialog con QR + 6 digitos.

---

## Addendum v4 (2026-04-06) - Wallapop Wallet, proximidad y mock del workspace

Si hay conflicto entre addendum v3 y este documento, prevalece v4.

### A. `MeetupCard` y dominio Wallet

- `walletHoldAmountEur` en entidad de meetup: importe reservado al confirmar con Wallet (`ACCEPT`); se libera al completar o cancelar segun reglas de `src/meetup/state-machine.ts`.
- `buyerWalletAvailableEur` opcional en evento `ACCEPT` para validar saldo suficiente en transicion.
- Componente `WalletTopUpSheet`: pantalla de recarga alineada a referencia app Wallapop; se abre desde `MeetupCard` cuando el comprador acepta sin saldo suficiente (si existe `onWalletTopUp`).
- Comprador con Wallet: el QR de pago presencial no va en la card; tras marcar llegada (`ARRIVED` + check-in comprador), CTA `Mostrar codigo QR` abre dialog con QR + codigo de 6 digitos (ver addendum v5).
- Vendedor en `ARRIVED` con Wallet: CTA principal tipo pildora en color vendido (`sold`) para escanear QR del comprador; sustituye `Confirmar venta` en ese flujo.

### B. Proximidad y `Estoy aqui`

- Umbral de proximidad para desbloquear check-in (demo): `100 m` (constante `MEETUP_ARRIVAL_NEAR_METERS` en `src/meetup/meetup-ui-rules.ts`).
- Mensaje de acercarse solo cuando el boton `Estoy aqui` sigue bloqueado por distancia; cuando ya esta habilitado por proximidad, no se muestra el aviso redundante.

### C. Matriz de CTAs (ajuste `ARRIVED` con Wallet)

| Estado | SELLER (Efectivo) | SELLER (Wallet) | BUYER (Wallet, comprador con llegada marcada) |
| --- | --- | --- | --- |
| `ARRIVED` | `Confirmar venta` (principal) | `Escanear codigo QR de <comprador>` (principal) | `Mostrar codigo QR` (principal, `status_sold_solid`) + `Cancelar quedada` (texto) si aplica |

El resto de filas de la matriz del addendum v2 se mantiene sin cambio salvo donde se contradiga este cuadro.

### D. Referencia de implementacion

- `src/components/meetup/meetup-card.tsx`
- `src/components/meetup/wallet-top-up-sheet.tsx`
- `src/meetup/wallet-payment-qr.ts` (`buildWalletInPersonPayPayload`, `deriveWalletDisplayCode`)
- `src/components/meetup/wallapop-chat-workspace.tsx` (saldo demo, conversacion seed por defecto)

---

## Addendum v5 (2026-04-06) - Dialog QR Wallet (comprador)

Si hay conflicto entre addendum v4 y este bloque, prevalece v5.

### A. Contenido del dialog

- Titulo: `Pago con Wallapop Wallet`.
- Parrafo de apoyo: instruccion para que el vendedor escanee y complete el cobro.
- Area del QR: componente `WalletInPersonQr` (render proporcional al ancho del contenedor).
- Codigo numerico de 6 digitos en tipografia destacada (`font-wallie-chunky`, tracking amplio), estable por meetup via `deriveWalletDisplayCode`.
- Subtitulo bajo el numero: `Cùdigo de verificaciùn`.
- CTA primaria al pie: `Cerrar`. Cierre adicional: tap en scrim fuera del panel.

### B. Acceso

- Visible solo para `BUYER`, `proposedPaymentMethod === WALLET`, `status === ARRIVED` y existencia de `arrivalCheckins.BUYER`.

### C. QA visual

- Story `Design System/Meetup Card` -> `Wallet Payment Buyer Show Qr Dialog`.
- Flujo vendedor escaneo: `Wallet Payment Seller Scan` (sin cambio de rol).

## Inventarios de referencia (captura oficial)
- `docs/elements/buttons.md`
- `docs/elements/Input.md`
- `docs/elements/chat-list-item.md`
- `docs/elements/chat-message-bubble.md`
- `docs/elements/chat-security-banner.md`
- `docs/elements/chat-product-card.md`
- `docs/elements/chat-counterpart-card.md`
- `docs/elements/chat-composer.md`
- `docs/elements/badge.md`
- `docs/elements/icons.md`
- `docs/elements/inbox-bottom-nav.md`
- `docs/elements/meetup-proposal-overlay.md`
- `src/components/meetup/meetup-timeline.tsx`
- `src/components/meetup/meetup-simulator.tsx`
- `src/components/meetup/meetup-card.tsx`
- `src/components/meetup/meetup-card.stories.tsx`
- `src/components/meetup/wallet-top-up-sheet.tsx`
- `src/components/meetup/wallet-top-up-sheet.stories.tsx`
- `src/meetup/wallet-payment-qr.ts`
- `src/components/meetup/meetup-location-map.tsx`
- `src/components/meetup/meetup-location-map.stories.tsx`

Notas:
- Fuente runtime de chat: `https://es.wallapop.com/app/chat`.
- Fecha de captura de los nuevos inventarios: `2026-02-19`.
- Cuando se actualice cualquier inventario de `docs/elements/`, revisar impacto en tokens (`styles.json`) antes de implementar componentes.
- Regla de implementacion para nuevas secciones:
  - Reutilizar primero componentes existentes del DS.
  - Si falta un componente, crearlo y documentarlo siguiendo tokens/estados del DS antes de usarlo en una nueva seccion.




