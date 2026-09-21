# Checklist de accesibilidad y QA visual - Wallapop Meet

## Accesibilidad
- Contraste mínimo AA en texto principal y CTAs.
- Foco visible en elementos interactivos.
- Tamaño táctil mínimo de 44x44 px para acciones críticas.
- Jerarquía semántica correcta en títulos y etiquetas.
- Campos con etiqueta persistente, ayuda y error descriptivo.
- Inputs con label flotante deben mantener etiqueta legible en `default` y `filled/focused`.
- Iconos críticos acompañados por texto.
- Estados nunca comunicados solo por color.
- Botones `icon-only` (`icon`, `menu_close`) con `aria-label` obligatorio.
- En botones `tab`, validar `role="tab"` y `aria-selected` consistente con el estado visual.
- En `Input`, validar `aria-invalid`, `aria-describedby` (helper/counter) y anuncios de contador con `aria-live`.

## QA visual
- Consistencia de espaciado según escala de tokens.
- Radios, sombras y bordes aplicados solo desde tokens.
- Estados `disabled`, `loading` y `error` validados por componente.
- Sin desbordes en textos largos ni en localización.
- Comportamiento correcto en móvil y pantallas pequeñas.
- Banner y toast sin solaparse con la navegación.
- Variantes de botón alineadas a inventario real (`primary`, `nav_expandable`, `tab`, `inline_action`, `icon`, `menu_close`).
- Estados de input alineados a inventario real (`default`, `hover`, `focused`, `filled`, `error`, `success`, `disabled`).

## QA de flujo Meetup
- El vendedor puede proponer; el comprador no inicia propuesta.
- El comprador puede aceptar o contraofertar.
- Las transiciones respetan la máquina de estados definida.
- Acción `Estoy aqui` solo dentro de la ventana válida.
- Seguimiento 24-48h dispara estado final esperado.

## Salida de validación
- Registro de incidencias por severidad: `blocker | major | minor`.
- Evidencia por incidencia: captura y pasos de reproducción.
- Aprobación final con fecha y versión de tokens/componentes.

