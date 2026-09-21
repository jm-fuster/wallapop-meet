# Inventario de `Meetup Proposal Overlay` (Wallapop Meet)

## Fuente de análisis
- Implementación de referencia: `src/components/meetup/wallapop-chat-workspace.tsx`
- Fecha de actualización: 2026-04-06
- Contexto: flujo `Proponer quedada` iniciado desde `ChatComposer`.

## Estructura funcional
- Wizard de 3 pasos:
  - Paso 1: fecha y hora.
  - Paso 2: selección de punto de encuentro.
  - Paso 3: preferencia de pago y precio final (`Efectivo`, `Wallapop Wallet`); no Bizum.
- Cierre del overlay:
  - Botón `X` en cabecera.
  - No existe botón `Cancelar` en footer.

## Paso 2: selección de punto

### Regla base de visibilidad
- Siempre hay exactamente 2 opciones seleccionables visibles.

### Modelo de datos visual
- El paso 2 usa una cola de 2 elementos (`selectableOptions`) basada en las últimas selecciones.
- Inserción de nueva selección:
  - Entra en posición 1.
  - La anterior pasa a posición 2.
  - Se descarta cualquier tercera.

### Comportamiento esperado
- Si se pulsa la opción inferior, no desaparece la superior.
- Cambia solo la selección activa (`selectedOptionId`).
- Cada opción muestra indicador visual `selected` / `unselected` alineado a la derecha.
  - `unselected`: aro fino con centro blanco.
  - `selected`: aro oscuro mas grueso (donut) con centro blanco reducido.
- Si se selecciona un nuevo punto desde mapa:
  - Aparece arriba.
  - Empuja al anterior hacia abajo.
  - Se mantienen 2 opciones visibles.

### Tipos de opción
- Punto seguro:
  - Icono escudo.
  - Nombre + dirección.
  - Label único: `Punto seguro · <N> ventas completadas`.
- Punto personalizado:
  - Icono de puntero en la card de opción (negro, sin contenedor circular).
  - Dirección seleccionada.
  - Sin label `Personalizado` en la card.

## Vista de mapa (selector)

### Interacción
- Permite seleccionar:
  - Marcadores de puntos seguros.
  - Cualquier punto personalizado con tap libre sobre mapa.
- Estilo de marcador en mapa (seguro/custom):
  - Forma cápsula Wallapop con mini triangulo unido al cuerpo.
  - Punto seguro: icono escudo.
  - Punto personalizado: icono de puntero.
  - Los iconos dentro del pin se muestran en blanco.
- Al seleccionar personalizado:
  - Se genera dirección (reverse geocoding con fallback textual `Calle seleccionada`).
  - Se calcula distancia desde posición de referencia.
  - No se muestra aviso de no seguro.

### Bottom sheet de selección
- Contenido:
  - Título del punto.
  - Dirección.
  - Chip de distancia en `m/km`.
  - Mensaje contextual:
    - Punto seguro: `<N> ventas completadas en este punto seguro.` (con `<N> ventas completadas` en negrita).
    - Punto personalizado: sin aviso de no seguro.
  - CTA `Seleccionar`.
- Reglas:
  - Debe renderizarse por encima del mapa (`z-index` superior).
  - Distancia debe permanecer en una sola línea (`no-wrap`).
  - Los mensajes contextuales de seguro/no seguro ajustan ancho horizontal al contenido (`w-fit`).
  - En punto personalizado, el título usa dirección abreviada priorizando `calle + numero` y evita valores numéricos aislados.

### Móvil
- Controles de zoom `+/-` ocultos.
- Zoom por gesto táctil.

## Footer del wizard
- Layout móvil en una sola fila:
  - Izquierda: contexto de artículo/comprador.
  - Derecha: CTA principal del paso.
- Texto de artículo truncado con elipsis para no desplazar botón.
- Se elimina el texto `Proponer quedada`.
- Orden del bloque contextual:
  - 1) `userName`
  - 2) indicador de asistencia
  - 3) `itemTitle`
- Asistencia:
  - `>90%`: verde
  - `70-90%`: ambar
  - `<70%`: `Baja asistencia a quedadas` en rojo
- CTA por paso:
  - Paso 1 y 2: `Siguiente`
  - Paso 3: `Enviar propuesta`
- El CTA no se deshabilita por campos incompletos; valida al pulsar.

## Validaciones y errores (paso 1 y 3)
- Mensaje global de validación: `Faltan campos por rellenar`.
- Cada sección incompleta muestra mensaje inferior específico.
- Paso 1:
  - El calendario muestra label superior `Dia`.
  - Calendario (`CalendarPicker`) con estado `error` cuando falta día.
  - Día seleccionado del calendario reforzado en verde Wallapop para mayor contraste.
  - Selector de hora (`Select`) con estado `error` cuando falta hora.
  - Lista de hora en intervalos de 15 minutos durante todo el día.
- Paso 3:
  - Importe (`Input`) con estado `error` cuando falta o es invalido (< 0).
  - El campo de importe limita entrada a `99999 €` y `2` decimales.
  - Si el importe supera `2000 €`, se muestra alerta destacada (warning naranja) indicando impacto DAC7.
  - La alerta DAC7 incluye CTA textual `Más información` enlazada a ayuda oficial:
    - `https://ayuda.wallapop.com/hc/es-es/articles/19093732048785--Qu%C3%A9-es-DAC7-y-a-que-vendedores-de-Wallapop-les-afecta`
  - Iconografía de método de pago sin cápsula/circulo de fondo (solo icono + label).
  - Método de pago: cada card se marca en rojo por separado cuando no hay selección.
  - Cada card muestra indicador visual `selected` / `unselected` a la derecha.

## Tokens/estilo recomendados
- Estado seleccionado en cards:
  - Borde oscuro + `inset` de refuerzo.
- Estado neutro:
  - Borde base de tokens (`tokens.color.input.ring.default` para cards de pago en paso 3).
- Estado error (unificado):
  - Borde `2px` en `tokens.color.input.ring.error`.
  - Mensaje de error inferior en `tokens.color.input.ring.error`.
- Labels:
  - `Punto seguro`: fondo verde claro.
  - `Ventas`: fondo neutro claro.
  - `Personalizado`: fondo neutro claro.

## QA rápido
- Caso 1: seleccionar seguro recomendado superior, luego inferior.
  - Resultado: ambos siguen visibles; cambia selección activa.
- Caso 2: seleccionar personalizado en mapa repetidas veces.
  - Resultado: nuevo personalizado arriba; anterior baja.
- Caso 3: seleccionar seguro tras personalizado en mapa.
  - Resultado: desaparece pin personalizado del mapa.
- Caso 4: título/dirección largos en mapa.
  - Resultado: chip distancia permanece en una sola línea.
