# Wallapop Meet

> [!IMPORTANT]
> **Proyecto no oficial, sin afiliación con Wallapop.**
>
> Este repositorio es un **ejercicio de diseño de producto independiente**, hecho por
> iniciativa propia como pieza de portfolio. No está afiliado, patrocinado ni respaldado
> por Wallapop S.L., no ha sido encargado ni revisado por la empresa, y no describe
> ninguna funcionalidad real, planificada ni interna del producto Wallapop.
>
> «Wallapop» y el resto de marcas citadas pertenecen a sus respectivos titulares y se
> usan aquí únicamente para identificar el contexto del ejercicio. El código y la
> documentación son míos y se publican bajo licencia MIT (ver [LICENSE](LICENSE)); esa
> licencia cubre el código, no concede ningún derecho sobre marcas de terceros (ver [NOTICE](NOTICE)).
>
> No contiene datos reales de personas ni de usuarios de ninguna plataforma.

Wallapop Meet es un concepto de funcionalidad: convertiría acuerdos informales de chat en un encuentro presencial estructurado, trazable y accionable. El ejercicio parte del contexto de una app de compraventa entre particulares y está planteado sobre Wallapop como caso de estudio.

El objetivo de producto es reducir fricción operativa (olvidos, cambios de última hora, no-shows) mediante una máquina de estados explícita, reglas por rol y evidencias de asistencia.

## Qué resuelve

- Formaliza fecha, hora, punto de encuentro y precio final dentro del chat.
- Limita acciones por rol: el vendedor inicia, el comprador acepta o contraoferta.
- Gestiona el ciclo completo del meetup desde propuesta hasta cierre o cancelación.
- Habilita check-in con ventana temporal controlada y validación de proximidad.
- Permite exportar la cita a calendario (`.ics`) y ejecutar seguimiento post-encuentro.

## Lógica funcional del concepto

### Punto de entrada

En el concepto, un meetup siempre nace desde una conversación de chat vinculada a un anuncio (`conversationId`, `listingId`, `sellerUserId`, `buyerUserId`).

### Estados de negocio

- `PROPOSED`
- `COUNTER_PROPOSED`
- `CONFIRMED`
- `ARRIVED`
- `COMPLETED`
- `CANCELLED`

### Reglas por rol (resumen)

- `SELLER`:
  - Puede `PROPOSE` desde estado inicial (`null`), desde `COUNTER_PROPOSED` y tras `CANCELLED`.
  - Puede `COMPLETE` únicamente cuando el meetup está en `ARRIVED`.
  - Puede reportar no-show (`REPORT_NO_SHOW`) y confirmar contradicción (`CONFIRM_NO_SHOW_FINAL`).
- `BUYER`:
  - Puede `ACCEPT`, `COUNTER_PROPOSE` y `CANCEL` cuando aplica según estado.
  - No puede iniciar meetup desde estado inicial.

### Reglas temporales críticas

- Ventana de llegada (`MARK_ARRIVED`): desde **30 minutos antes** hasta **2 horas después** de `scheduledAt`.
- Zona roja de cancelación: últimos **30 minutos** antes de `scheduledAt` (genera impacto de fiabilidad).
- No-show: requiere **5 minutos de cortesia** tras la hora pactada antes de poder reportarse.

### Flujo principal

1. `SELLER` envía `PROPOSE`.
2. `BUYER` acepta (`ACCEPT`) o plantea cambios (`COUNTER_PROPOSE`).
3. Con aceptación válida, pasa a `CONFIRMED`.
4. En ventana activa, cualquiera puede marcar llegada (`MARK_ARRIVED`) y el estado pasa a `ARRIVED`.
5. Solo `SELLER` cierra venta (`COMPLETE`) y pasa a `COMPLETED`.
6. Si hay incidencia, puede terminar en `CANCELLED` con motivo explicito (`MANUAL_CANCEL`, `NO_SHOW_BUYER`, etc.).

## Arquitectura del proyecto

- `src/meetup/`: dominio de Wallapop Meet (tipos, máquina de estados, reglas temporales).
- `src/components/meetup/`: componentes y reglas de UI del flujo meetup.
- `src/`: aplicación React + TypeScript (Vite).
- `tests/`: pruebas unitarias e integración de reglas de dominio y UI.
- `docs/`: objetivos y user flow funcional.
- `plans/design-system/`: contrato y especificaciones del Design System.
- `styles.json`: fuente canónica de tokens de diseño.

## Stack técnico

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Storybook
- Convex
- Vitest

## Puesta en marcha

```bash
npm install
npm run dev
```

## Scripts disponibles

- `npm run dev`: arranca entorno local.
- `npm run build`: compila TypeScript y build de Vite.
- `npm run preview`: sirve build de producción localmente.
- `npm test`: ejecuta pruebas con Vitest.
- `npm run storybook`: levanta Storybook en local.
- `npm run build-storybook`: genera build estatico de Storybook.
- `npm run ds:sync`: sincroniza catalogo de Design System.
- `npm run ds:check`: valida sincronización DS (componentes/stories/tokens).
- `npm run audit:design-system`: detecta hardcodes visuales prohibidos en `src`.
- `npm run audit:design-system:baseline`: actualiza baseline del auditor DS.
- `npm run lint`: ejecuta auditoría DS + validación + ESLint.

## Criterio obligatorio antes de cerrar cambios

Si hay modificaciones en el proyecto, validar:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. `npx convex dev --once`

## Calidad y pruebas

La suite cubre, entre otros, estos casos:

- Transiciones válidas e inválidas por estado y rol.
- Ventana de llegada y límites exactos de tiempo.
- No-show con cortesia mínima de 5 minutos.
- Impacto de fiabilidad en cancelación en zona roja.
- Reapertura del flujo tras `CANCELLED` por parte del vendedor.

## Documentación relevante

- Objetivos de producto: `docs/objectives.md`
- User flow funcional: `docs/wallapop-meet-user-flow.md`
- Contrato de gobernanza DS: `DESIGN_SYSTEM.md`
- Tokens DS: `plans/design-system/design-tokens-v1.md`
- Componentes DS: `plans/design-system/components-spec-v1.md`
- Patrones meetup: `plans/design-system/meetup-ui-patterns-v1.md`
- Checklist QA/accesibilidad: `plans/design-system/accessibility-qa-checklist.md`

## Convenciones de contribución

- Mantener los estados de máquina exactamente como están definidos (`PROPOSED`, `CONFIRMED`, etc.).
- Evitar hardcodes visuales en `src`; usar siempre tokens.
- Todo cambio de UI debe apoyarse en componentes reutilizables del Design System.
- El subject de los commits debe ir en inglés.
