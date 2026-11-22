# Capturas: v2, fase A

Estado de la app capturado el 2026-11-16: versión 1 completa + **fase A de la versión 2** (Pasar, Otra carta con motivo, Deshacer y registro de jugadas). APK de esta versión: `release/ronda-debug.apk` (versionName 1.0, debug).

Pantalla de teléfono emulada (Pixel 7 en Playwright, Chromium). Las cartas salen al azar, así que el texto de cada carta cambia entre una generación y otra.

- `oscuro/`: el recorrido completo en tema oscuro (34 pantallas).
- `claro/`: pantallas clave en tema claro (7).
- `resumen/`: tres hojas de contacto con todas las capturas, para verlas de un vistazo.

## Recorrido en tema oscuro

| # | Pantalla | Qué muestra |
|---|---|---|
| 01 | Inicio, primera vez | El mazo con una carta real, "Nueva partida", Cita, Mis cartas, Ajustes |
| 02 | Jugadores vacío | Invitación a agregar al primero |
| 03 | Hoja "Agregar jugador" | Nombre, género y "Le atraen" con chips |
| 04 | Lista de jugadores | Quién juega esta noche, editar y quitar |
| 05 | Configurar, nivel suave | Juegan esta noche, modos, nivel, castigo |
| 06 | Configurar, picante | El fondo cambia de color con el nivel |
| 07 | Confirmación +18 | Al elegir extremo |
| 08 | Configurar, extremo | Fondo "brasa" |
| 09 | Castigo con tragos | Selector de 1 a 5 tragos |
| 10 | Turno | Verdad, Al azar, Reto |
| 11 | Al azar | La ruleta entre Verdad y Reto, en movimiento |
| 12 | Carta personal | Cumplió, Pasar, Otra carta |
| 13 | Otra carta | "No se entiende" / "No va con nosotros" |
| 14 | Carta cambiada | Aviso con Deshacer |
| 15 | Castigo tras Pasar | "Bebe 2 tragos" y aviso de Deshacer |
| 16 | Deshacer | Vuelve la misma carta |
| 17 | Reto con tiempo | Anillo de la cuenta regresiva, antes de iniciar |
| 18 | Cuenta corriendo | El anillo se vacía |
| 19 | Menú de la partida | Sacar y sumar jugadores, cambiar nivel, terminar |
| 20 | Terminar partida | Confirmación |
| 21 | Partida terminada | Volver al inicio |
| 22 | Inicio con "Jugar otra vez" | Resume la última configuración |
| 23 | Carta grupal | Yo nunca, con Siguiente y Otra carta |
| 24 | Mis cartas vacío | Formulario de carta propia |
| 25 | Mis cartas con una | La carta creada en la lista |
| 26 | Ajustes | Tema, historial, respaldo, créditos |
| 27 | Modo cita, configurar | Quiénes van y set de inicio |
| 28 | Acuerdo previo | Reglas del procedimiento y la condición ética de Aron (1997) |
| 29 | Cercanía antes | Escala IOS con círculos |
| 30 | Pregunta 1 | Quién lee primero y consejo para quien escucha |
| 31 | Pregunta 11 | La cuenta de 4:00 |
| 32 | Pausa entre sets | Fin del Set I |
| 33 | Resultado | Cercanía antes y después de cada persona |
| 34 | Modo cita con historial | "Citas anteriores" visible (la fase B lo oculta) |

## Tema claro

| # | Pantalla |
|---|---|
| 01 | Inicio |
| 02 | Lista de jugadores |
| 03 | Configurar, suave |
| 04 | Turno, nivel picante |
| 05 | Carta personal, picante |
| 06 | Modo cita, pregunta 1 |
| 07 | Ajustes |

## Observaciones de esta revisión

- **Pausa entre sets (oscuro 32):** el botón "Empezar el Set II" se partía en dos líneas. Corregido: botón a todo el ancho y "Terminar la cita" debajo, como en las preguntas.
- **Modo cita (oscuro 34):** el historial de citas todavía se ve en el modo cita. Es la fase B del plan v2.

## Regenerar

```bash
SHOTS_DIR=capturas/v2-fase-a npx playwright test tests/e2e/screenshots.spec.ts
```
