# Guía del Repositorio

> Proyecto no oficial, sin afiliación con Wallapop S.L. Es un ejercicio de diseño de producto independiente; no describe funcionalidad real, planificada ni interna de Wallapop. Ver [NOTICE](NOTICE).

Wallapop Meet formaliza encuentros presenciales de compraventa dentro de la app de compraventa que sirve de caso de estudio. Convierte acuerdos de chat en un evento estructurado con estados claros, notificaciones interactivas y seguimiento posterior.

## Idioma de trabajo

- A partir de este punto, toda la documentación, propuestas y entregables deben redactarse en español.
- Excepción: identificadores técnicos y estados de máquina (`PROPOSED`, `CONFIRMED`, etc.) se mantienen en inglés para evitar inconsistencias en implementación.

## Estructura del proyecto

- `docs/objectives.md`: objetivos de producto y reglas de negocio de Wallapop Meet.
- `styles.json`: tokens de diseño y configuración base de componentes.
- `plans/design-system/`: documentación del sistema de diseño (plan, tokens, componentes, patrones y QA).
- `src/`: aplicación React + TypeScript (Vite), componentes `shadcn/ui` y stories.
- `.storybook/`: configuración de Storybook con builder Vite.

Si se añade implementación:
- Lógica de dominio en `src/meetup/`.
- Integraciones (push, mapas, calendario) en `src/integrations/`.

## Comandos de build, test y desarrollo

Scripts disponibles:
- `npm run dev`: ejecutar app local en modo desarrollo.
- `npm run build`: compilar TypeScript y generar build de producción con Vite.
- `npm run preview`: previsualizar build de producción.
- `npm test`: ejecutar pruebas con Vitest.
- `npm run storybook`: ejecutar Storybook local.
- `npm run build-storybook`: compilar Storybook estático.
- `npx convex dev`: validar y regenerar artefactos de Convex durante el desarrollo.

Regla operativa obligatoria:
- Siempre que se realicen cambios en el proyecto, comprobar que `npx convex dev` funciona correctamente antes de cerrar la tarea.

## Estilo de código y nomenclatura

- Usar indentación de 4 espacios en archivos JSON (alineado con `styles.json`).
- Fuente de verdad funcional: en caso de conflicto documental, prevalece la versión vigente indicada en `docs/objectives.md` (contrato más reciente).
- Mantener nombres de estado alineados con la máquina de estados:
  `PROPOSED`, `COUNTER_PROPOSED`, `CONFIRMED`, `ARRIVED`, `COMPLETED`, `CANCELLED`.
- Mantener reglas de negocio explícitas y cercanas a la funcionalidad (ventana de llegada, inicio exclusivo del vendedor, etc.).
- Prohibido hardcodear valores visuales en `src` (hex/rgb/hsl/oklch, `px`, radios, sombras, opacidades), salvo en la capa canónica de tokens (`styles.json` y variables raíz de `src/index.css`).
- No añadir estilos inline para UI (`style={...}`) salvo casos técnicos justificados (ejemplo: posición dinámica de mapa) y documentados en PR.
- Excepción técnica actual documentada: `src/components/ui/select.tsx` usa `style` para calcular `maxHeight` dinámico del dropdown según `maxVisibleOptions`.
- Excepción técnica actual documentada: `src/pages/design-system-page.tsx` usa `style` para previsualizaciones dinámicas de tokens (`background`, `borderRadius`, `boxShadow`, anchos de escala) dentro del catálogo.
- Toda nueva UI debe componerse con componentes reutilizables del sistema de diseño; no crear variantes ad-hoc duplicadas en páginas de producto.
- Si se requiere un patrón nuevo, primero crear/actualizar componente base en `src/components/ui` o `src/components/meetup` y después consumirlo.

## Directrices específicas del sistema de diseño

- El plan maestro está en `plans/design-system/design-system-wallapop-meet-plan.md`.
- La especificación de tokens está en `plans/design-system/design-tokens-v1.md`.
- La especificación de componentes está en `plans/design-system/components-spec-v1.md`.
- Los patrones de flujo de meetup están en `plans/design-system/meetup-ui-patterns-v1.md`.
- El checklist de validación está en `plans/design-system/accessibility-qa-checklist.md`.

Al modificar tokens o componentes:
- Actualizar `styles.json` y la documentación correspondiente en `plans/design-system/`.
- Verificar que estados críticos (`disabled`, `loading`, `error`) estén cubiertos.
- Registrar siempre las stories de componentes bajo `Design System/*` en Storybook (no crear apartados paralelos como `Elements/*`).
- Ejecutar `npm run audit:design-system` y mantener `0` incidencias nuevas antes de cerrar la tarea.
- Mantener trazabilidad token -> alias semántico -> componente; no referenciar valores literales directamente desde componentes.

## Guía de testing

El proyecto usa Vitest. Cobertura mínima esperada:
- Transiciones válidas e inválidas de estado.
- Ventana de llegada (30 minutos antes a 2 horas después).
- Lógica de propuesta exclusiva del vendedor y contraoferta del comprador.

Ubicar pruebas en `tests/` con nombres claros (ejemplo: `meetup.state.test.js`).

## Commits y Pull Requests

Usar mensajes consistentes, por ejemplo:
- `feat(meetup): añadir flujo de contraoferta`
- `fix(notifications): corregir acción en pantalla bloqueada`
- Tras crear un nuevo commit, subirlo inmediatamente a GitHub usando `git push` (rama actual en `origin`).
- El título del commit (subject) debe estar siempre en inglés antes de subirlo.

Las PR deben incluir:
- Descripción clara del cambio.
- Issue enlazada (si aplica).
- Capturas o logs para cambios de UX (push, banners, estados visuales).

## Seguridad y configuración

- No hardcodear claves de API (mapas, push, calendario).
- Usar configuración por entorno y documentar variables requeridas.
- Registrar fuente y fecha cuando se use una referencia oficial de diseño para evitar desalineaciones futuras.
