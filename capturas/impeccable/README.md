# Capturas: refinamiento con /impeccable

Estado de la app el 2026-11-21, después del plan 6 ([`plan-6-impeccable.md`](../../docs/superpowers/plans/2026-11-21-plan-6-impeccable.md)): init, audit ([informe](../../docs/audit/2026-11-21-audit.md)), layout, bolder, animate, delight, overdrive, optimize y polish.

Pantalla de teléfono emulada (Pixel 7 en Playwright, Chromium). Las cartas salen al azar, así que su texto cambia entre generaciones.

- `oscuro/`: recorrido completo (38 pantallas).
- `claro/`: pantallas clave (7).

Lo que se mueve no se ve en una captura fija:
- el segmento de nivel que fluye;
- el nombre que gira al pasar el turno;
- la opción que se vuelve carta;
- el mazo que se baraja;
- la luz que sigue al teléfono;
- los círculos de la cita que se acercan.

Para verlo, usa la app o el APK.

Para regenerar:

```bash
SHOTS_DIR=capturas/impeccable npx playwright test tests/e2e/screenshots.spec.ts
```
