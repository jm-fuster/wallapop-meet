# Inventario de `Chat Counterpart Card` observado en Wallapop Chat

## Fuente de análisis
- URL: `https://es.wallapop.com/app/chat`
- Fecha de captura: 2026-02-21
- Método: inspección con MCP Chrome DevTools
- Viewport de referencia: `1920x1080`
- Contexto: columna derecha de conversación en desktop

## Especificación visual del componente

### 1) Contenedor
- Card de fondo blanco sobre panel lateral gris claro.
- Radio redondeado suave (`~12px` en implementación DS).
- Padding interno uniforme.

### 2) Bloque principal
- Distribución horizontal:
  - Columna izquierda: nombre + rating + distancia + ubicación.
  - Columna derecha: avatar circular.

### 3) Tipografía
- Nombre:
  - Estilo destacado (negrita).
  - En DS actual: mismo tamaño que metadatos (`16px`) y mayor peso.
- Metadatos:
  - Distancia (`N km de ti`) y ubicación (`Desconocido`).
  - Menor contraste que el nombre.

### 4) Rating
- 5 estrellas con posibilidad de media estrella.
- Color principal oscuro para estrellas activas y gris suave para inactivas.

### 5) Avatar
- Imagen circular en el extremo derecho.
- Tamaño compacto para no competir con la información textual.

## Reglas de uso
- Solo se muestra en desktop dentro del sidebar derecho del workspace de chat.
- Debe aceptar tanto comprador como vendedor como contraparte de la conversación.
- Debe mantener lectura rápida: nombre primero, contexto de distancia/ubicación después.

---

## Actualización v2 (2026-02-23)

Esta sección refleja la implementación actual del componente.
Si hay conflicto con la descripción original, prevalece v2.

### 1) Cambio de métrica secundaria
- Se reemplaza la línea de ubicación por métrica de asistencia a quedadas.
- Formato actual:
  - Alta/media asistencia: `X% de asistencia (N)`.
  - Baja asistencia (`<70`): `Baja asistencia a quedadas`.

### 2) Semaforo de asistencia
- `>90`: color success.
- `70-89`: color warning (`semantic.warning.base`, implementado como `#F4A000`).
- `<70`: color error y sin mostrar porcentaje.
- `0 meetups`: estado neutral en gris con `0% de asistencia (0)`.

### 3) Rating con volumen
- Junto a las estrellas se muestra el total de valoraciones:
  - `(<numero valoraciones>)`
- Ejemplo: `(110)`.
- Si `ratingCount` es `0`, no se renderiza el contador y el perfil se considera sin historial de valoraciones.

### 4) Jerarquía tipográfica actual
- Nombre: `16px` destacado.
- Distancia (`N km de ti`): `14px`.
- Asistencia: `14px`.
- Conteo de valoraciones `(N)`: `14px`.

### 5) API de props actual
- `name: string`
- `rating: number`
- `ratingCount?: number`
- `distanceLabel: string`
- `attendanceRate?: number`
- `attendanceMeetups?: number`
- `profileImageSrc?: string`
- `profileImageAlt?: string`

## Referencias de implementación
- Componente: `src/components/ui/chat-counterpart-card.tsx`
- Storybook: `src/components/ui/chat-counterpart-card.stories.tsx`
- Integración desktop: `src/components/meetup/wallapop-chat-workspace.tsx`
- Design System vivo: `src/pages/design-system-page.tsx` (renderizado desde stories `Design System/*`).
