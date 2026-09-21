# Ajustes de labels y counterpart (2026-02-28)

## Objetivo

- Homologar labels de estado con fondo suave + texto del color semántico del propio estado.
- Asegurar visibilidad del estado `sin_nivel` en `ChatCounterpartCard` dentro de la pagina de Design System.

## Cambios aplicados

- Se anade alias semántico `tokens.color.semantic.label.*` en `styles.json`, trazado a `tokens.color.meetup_status.*`.
- Se suavizan fondos de `tokens.color.meetup_status.*.background` a escala `50`.
- `Label` consume variables semánticas por tono (`--label-*-bg`, `--label-*-border`, `--label-*-text`) para mantener consistencia visual y contraste.
- `ChatCounterpartCard` muestra el copy `Sin nivel de fiabilidad aun (0 quedadas)` cuando `attendanceMeetups = 0`.
- Se registra estado y variante de story `sin_nivel` para discovery en Design System.

## Accesibilidad

- Cada tono usa combinación explicita `fondo + texto + borde` para mejorar legibilidad del estado.
- Se mantiene tamaño compacto de chip sin perder contraste frente a `bg-base` y `bg-surface`.
