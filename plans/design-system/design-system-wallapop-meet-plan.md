# Plan de trabajo: sistema de diseño para Wallapop Meet

## 1. Objetivo
Construir un sistema de diseño sólido y reutilizable, alineado con los estilos oficiales de Wallapop, para acelerar y estandarizar el desarrollo de Wallapop Meet en producto, diseño y código.

## 2. Alcance
- Definir tokens de diseño oficiales (color, tipografía, espaciado, radio, elevación, opacidad y motion).
- Estandarizar componentes base y sus variantes para los flujos de meetup.
- Documentar reglas de uso, accesibilidad y estados de interacción.
- Dejar preparado el sistema para implementación técnica (web/app) y evolución futura.

Fuera de alcance en esta fase:
- Implementación completa de UI en producción.
- Integraciones funcionales (push, mapas, calendario) más allá de necesidades visuales e interactivas.

## 3. Principios de diseño
- Consistencia con la marca Wallapop: respetar identidad visual oficial por encima de preferencias locales.
- Escalabilidad: tokens y componentes pensados para reutilización en otras funcionalidades.
- Accesibilidad: contraste, foco, tamaños táctiles y feedback claros.
- Estados explícitos: cada componente y flujo debe cubrir loading, éxito, error, deshabilitado y casos límite.

## 4. Plan por fases

### Fase 0: descubrimiento y alineación (1-2 días)
Entregables:
- Inventario de estilos oficiales disponibles (guías, librerías, capturas, referencias internas).
- Análisis de brecha entre estilos oficiales y `styles.json` actual.
- Lista de decisiones bloqueantes (tipografía oficial, escala de espaciado, naming final).
- Línea base de botones capturados en producción web (`primary`, `nav_expandable`, `tab`, `inline_action`, `icon`, `menu_close`).
- Línea base de input capturado en producción web (`default`, `hover`, `focused`, `filled`, `error`, `success`, `disabled`).

Criterios de aceptación:
- Existe una fuente de verdad acordada para estilos oficiales.
- Se decide si `styles.json` será base temporal o se reemplaza estructura.

### Fase 1: arquitectura de tokens (2-3 días)
Entregables:
- Esquema de tokens v1 en `styles.json` (o `styles/tokens.json`):
  - `color` (marca, neutros, semánticos: success/warning/error/info)
  - `typography` (familias, tamaños, pesos, line-height)
  - `spacing` (escala)
  - `radius`, `shadow`, `border`, `opacity`, `motion`
- Convención de naming consistente (ejemplo: `color.background.surface.primary`).
- Mapeo token -> uso práctico (qué componente consume cada token).
- Tokenización explícita de los botones capturados (color, radius, border, typography y shadow).
- Tokenización explícita del input capturado (ring por estado, label, placeholder en foco, opacidad disabled y padding por estado).

Criterios de aceptación:
- No hay valores hardcodeados en especificaciones de componentes.
- Los tokens cubren al menos el 90% de necesidades identificadas de Wallapop Meet.

### Fase 2: componentes base (3-4 días)
Entregables:
- Especificación de componentes principales:
  - Button, Input, Select, Chip/Tag, Card, Banner, Toast, Modal, List Item y Badge.
- Estados de cada componente: default, hover/pressed, focused, disabled, error, loading.
- En `Button`, variantes basadas en evidencia real: `primary`, `nav_expandable`, `tab`, `inline_action`, `icon`, `menu_close`.
- En `Input`, patrón de label flotante + contador y estados basados en evidencia real (`filled`, `success`, `error`).

Criterios de aceptación:
- Cada componente tiene API visual clara (props, variantes y estados).
- Se puede componer una pantalla completa de meetup usando solo componentes del sistema.

### Fase 3: patrones de Wallapop Meet (3-4 días)
Entregables:
- Patrones específicos del flujo de meetup:
  - Línea de estados (`PROPOSED`, `COUNTER_PROPOSED`, `CONFIRMED`, `ARRIVED`, `COMPLETED`, `CANCELLED`).
  - Tarjeta de meetup confirmado.
  - Banner persistente del día de meetup.
  - Notificación interactiva (especificación visual + comportamiento esperado).
  - UI de check-in "Estoy aqui" dentro de la ventana válida.
  - Follow-up post meetup (24-48h) para confirmar venta.

Criterios de aceptación:
- Cada estado de negocio tiene representación visual y reglas de transición.
- Se cubren errores y expiración, no solo happy path.

### Fase 4: documentación y handoff técnico (2 días)
Entregables:
- Guía de uso del sistema de diseño (do/don't por componente crítico).
- Checklist de accesibilidad y QA visual.
- Mapeo de implementación:
  - Tokens -> constantes técnicas
  - Componentes -> módulos (`src/meetup/` y `src/integrations/`)
- Plan de versionado (v0.1, v0.2, breaking changes).

Criterios de aceptación:
- Un desarrollador puede implementar Wallapop Meet sin ambigüedades visuales.
- La documentación cubre decisiones y tradeoffs principales.

## 5. Backlog inicial priorizado
Prioridad alta:
1. Validar tipografía y paleta oficial de Wallapop.
2. Normalizar tokens y naming.
3. Diseñar estados visuales del flujo de meetup.
4. Definir componentes críticos (Button, Card, Banner, Toast, Modal) partiendo del inventario web capturado el 2026-02-18.

Prioridad media:
1. Motion tokens y microinteracciones clave.
2. Patrones de empty/error/loading para cada pantalla.
3. Plantillas de notificaciones y banners con variantes.

Prioridad baja:
1. Theming avanzado.
2. Automatización de exportación de tokens a múltiples plataformas.

## 6. Riesgos y mitigaciones
- Riesgo: referencias oficiales incompletas o desactualizadas.
  Mitigación: congelar versión de referencia y registrar fecha/fuente.
- Riesgo: crecer componentes antes de estabilizar tokens.
  Mitigación: bloquear creación de nuevos componentes sin tokens aprobados.
- Riesgo: inconsistencias entre diseño y código.
  Mitigación: incluir handoff técnico y checklist de QA desde fase 2.

## 7. Definición de terminado (DoD)
- Tokens v1 aprobados y documentados.
- Componentes base y patrones de meetup definidos con estados completos.
- Contraste y accesibilidad validados en elementos críticos.
- Estructura preparada para implementación en código sin rediseño mayor.

## 8. Próximos pasos inmediatos
1. Revisar y aprobar este plan.
2. Ejecutar fase 0 y actualizar `styles.json` a estructura de tokens v1.
3. Mantener sincronizados tokens, componentes y patrones en `plans/design-system/`.



