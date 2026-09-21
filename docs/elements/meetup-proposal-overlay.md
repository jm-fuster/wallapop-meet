# Inventario de `Meetup Proposal Overlay` (Wallapop Meet)

## Fuente de analisis
- Implementacion de referencia: `src/components/meetup/wallapop-chat-workspace.tsx`
- Fecha de actualizacion: 2026-04-06
- Contexto: flujo `Proponer quedada` iniciado desde `ChatComposer`.

## Estructura funcional
- Wizard de 3 pasos:
  - Paso 1: fecha y hora.
  - Paso 2: seleccion de punto de encuentro.
  - Paso 3: preferencia de pago y precio final (`Efectivo`, `Wallapop Wallet`); no Bizum.
- Cierre del overlay:
  - Boton `X` en cabecera.
  - No existe boton `Cancelar` en footer.

## Paso 2: seleccion de punto

### Regla base de visibilidad
- Siempre hay exactamente 2 opciones seleccionables visibles.

### Modelo de datos visual
- El paso 2 usa una cola de 2 elementos (`selectableOptions`) basada en las ultimas selecciones.
- Insercion de nueva seleccion:
  - Entra en posicion 1.
  - La anterior pasa a posicion 2.
  - Se descarta cualquier tercera.

### Comportamiento esperado
- Si se pulsa la opcion inferior, no desaparece la superior.
- Cambia solo la seleccion activa (`selectedOptionId`).
- Cada opcion muestra indicador visual `selected` / `unselected` alineado a la derecha.
  - `unselected`: aro fino con centro blanco.
  - `selected`: aro oscuro mas grueso (donut) con centro blanco reducido.
- Si se selecciona un nuevo punto desde mapa:
  - Aparece arriba.
  - Empuja al anterior hacia abajo.
  - Se mantienen 2 opciones visibles.

### Tipos de opcion
- Punto seguro:
  - Icono escudo.
  - Nombre + direccion.
  - Label unico: `Punto seguro · <N> ventas completadas`.
- Punto personalizado:
  - Icono de puntero en la card de opcion (negro, sin contenedor circular).
  - Direccion seleccionada.
  - Sin label `Personalizado` en la card.

## Vista de mapa (selector)

### Interaccion
- Permite seleccionar:
  - Marcadores de puntos seguros.
  - Cualquier punto personalizado con tap libre sobre mapa.
- Estilo de marcador en mapa (seguro/custom):
  - Forma capsula Wallapop con mini triangulo unido al cuerpo.
  - Punto seguro: icono escudo.
  - Punto personalizado: icono de puntero.
  - Los iconos dentro del pin se muestran en blanco.
- Al seleccionar personalizado:
  - Se genera direccion (reverse geocoding con fallback textual `Calle seleccionada`).
  - Se calcula distancia desde posicion de referencia.
  - No se muestra aviso de no seguro.

### Bottom sheet de seleccion
- Contenido:
  - Titulo del punto.
  - Direccion.
  - Chip de distancia en `m/km`.
  - Mensaje contextual:
    - Punto seguro: `<N> ventas completadas en este punto seguro.` (con `<N> ventas completadas` en negrita).
    - Punto personalizado: sin aviso de no seguro.
  - CTA `Seleccionar`.
- Reglas:
  - Debe renderizarse por encima del mapa (`z-index` superior).
  - Distancia debe permanecer en una sola linea (`no-wrap`).
  - Los mensajes contextuales de seguro/no seguro ajustan ancho horizontal al contenido (`w-fit`).
  - En punto personalizado, el titulo usa direccion abreviada priorizando `calle + numero` y evita valores numericos aislados.

### Movil
- Controles de zoom `+/-` ocultos.
- Zoom por gesto tactil.

## Footer del wizard
- Layout movil en una sola fila:
  - Izquierda: contexto de articulo/comprador.
  - Derecha: CTA principal del paso.
- Texto de articulo truncado con elipsis para no desplazar boton.
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
- Mensaje global de validacion: `Faltan campos por rellenar`.
- Cada seccion incompleta muestra mensaje inferior especifico.
- Paso 1:
  - El calendario muestra label superior `Dia`.
  - Calendario (`CalendarPicker`) con estado `error` cuando falta dia.
  - Dia seleccionado del calendario reforzado en verde Wallapop para mayor contraste.
  - Selector de hora (`Select`) con estado `error` cuando falta hora.
  - Lista de hora en intervalos de 15 minutos durante todo el dia.
- Paso 3:
  - Importe (`Input`) con estado `error` cuando falta o es invalido (< 0).
  - El campo de importe limita entrada a `99999 €` y `2` decimales.
  - Si el importe supera `2000 €`, se muestra alerta destacada (warning naranja) indicando impacto DAC7.
  - La alerta DAC7 incluye CTA textual `Más información` enlazada a ayuda oficial:
    - `https://ayuda.wallapop.com/hc/es-es/articles/19093732048785--Qu%C3%A9-es-DAC7-y-a-que-vendedores-de-Wallapop-les-afecta`
  - Iconografia de metodo de pago sin capsula/circulo de fondo (solo icono + label).
  - Metodo de pago: cada card se marca en rojo por separado cuando no hay seleccion.
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

## QA rapido
- Caso 1: seleccionar seguro recomendado superior, luego inferior.
  - Resultado: ambos siguen visibles; cambia seleccion activa.
- Caso 2: seleccionar personalizado en mapa repetidas veces.
  - Resultado: nuevo personalizado arriba; anterior baja.
- Caso 3: seleccionar seguro tras personalizado en mapa.
  - Resultado: desaparece pin personalizado del mapa.
- Caso 4: titulo/direccion largos en mapa.
  - Resultado: chip distancia permanece en una sola linea.
