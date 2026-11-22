# Capturas: rediseño Liquid Glass Nocturne

Estado de la app capturado el 2026-11-16, con el rediseño completo (fases R1 a R4 del plan [`2026-11-16-redesign-liquid-glass-nocturne.md`](../../docs/superpowers/specs/2026-11-16-redesign-liquid-glass-nocturne.md)) y la fase B del plan v2. APK de esta versión: `release/ronda-debug.apk` (debug).

Pantalla de teléfono emulada (Pixel 7 en Playwright, Chromium). Las cartas salen al azar, así que su texto cambia de una generación a otra. Las capturas marcadas como página completa muestran toda la pantalla desplazada; en ellas el fondo de aurora solo cubre la primera altura de pantalla, porque es fijo.

- `comparativas/`: cada pantalla de Stitch (izquierda) junto a la de la app (derecha), 18 pares.
- `oscuro/`: el recorrido completo en tema oscuro (39 pantallas).
- `claro/`: pantallas clave en tema claro (7). Stitch solo diseñó el oscuro; el claro se deriva de los mismos tokens.

Para regenerar:

```bash
SHOTS_DIR=capturas/redisenio npx playwright test tests/e2e/screenshots.spec.ts
bash scripts/compare-redesign.sh
```

## Comparativas con Stitch

| # | Pantalla de Stitch | Captura de la app |
|---|---|---|
| 01 | Inicio | 01 Inicio, primera vez |
| 02 | Gestión de jugadores | 04 Lista de jugadores |
| 03 | Configurar partida | 09 Configurar con castigo de tragos |
| 04 | Turno de juego | 10 Turno |
| 05 | Ruleta girando | 11 Al azar, girando |
| 06 | Desaceleración y resultado | 12 Al azar, frenando |
| 07 | Ruleta al azar (resultado) | 13 Al azar, resultado con "Revelar pregunta" |
| 08 | Carta de reto con temporizador | 20 Cuenta corriendo |
| 09 | Carta grupal Yo nunca | 26 Carta grupal |
| 10 | Menú de partida | 22 Menú |
| 11 | Confirmar abandono | 23 Terminar partida |
| 12 | Mis cartas | 28 Mis cartas con una |
| 13 | Ajustes | 29 Ajustes |
| 14 | Modo cita, configuración | 30 Elegir con quién y set (sin historial) |
| 15 | Modo cita, acuerdo | 31 Acuerdo |
| 16 | Modo cita, cercanía | 32 Cercanía antes |
| 17 | Modo cita, pregunta | 33 Pregunta 1 |
| 18 | Modo cita, resultado | 36 Resultado |

**Diferencias a propósito** (sección 3 del plan): no hay datos ni funciones inventadas por Stitch (versión, "120.000 rondas", "98% atrevidos", puntos, comodines, tensión, jugadores observando, perfil, barra de navegación inferior, galería de referencia, micrófono y altavoz), y los títulos en inglés se cambiaron por los reales. El historial de citas no aparece en el modo cita: se ve en Ajustes → Privacidad, después de confirmar.

## Recorrido en tema oscuro

| # | Pantalla | Qué muestra |
|---|---|---|
| 01 | Inicio, primera vez | Selector de nivel, título, mazo apilado con carta real y su tipo, Nueva partida, Cita, Mis cartas, Ajustes |
| 02 | Jugadores vacío | Invitación a agregar al primero |
| 03 | Hoja "Agregar jugador" | Nombre, género y "Le atraen" |
| 04 | Lista de jugadores | Contador, botón +, filas con check, género y atracción, editar y quitar |
| 05 | Configurar, suave | Paneles: jugadores con avatar, modos con ícono, nivel segmentado, castigo |
| 06 | Configurar, picante | El fondo y el acento cambian con el nivel |
| 07 | Confirmación +18 | Al elegir extremo |
| 08 | Configurar, extremo | Acento carmesí |
| 09 | Castigo con tragos | Cantidad de 1 a 5 |
| 10 | Turno | Ronda y nivel, avatares, nombre, Verdad / Al azar / Reto en filas |
| 11 | Al azar, girando | "Parar ruleta" |
| 12 | Al azar, frenando | La ruleta desacelera |
| 13 | Al azar, resultado | Resultado del motor y "Revelar pregunta" |
| 14 | Carta personal | Tipo, nombre, carta, Cumplió, Pasar, Otra carta |
| 15 | Otra carta | "No se entiende" / "No va con nosotros" |
| 16 | Carta cambiada | Aviso "Turno anterior" con Deshacer |
| 17 | Castigo tras Pasar | "Bebe 2 tragos" y aviso con Deshacer |
| 18 | Deshacer | Vuelve la misma carta |
| 19 | Reto con tiempo | Anillo con degradado, antes de iniciar |
| 20 | Cuenta corriendo | El anillo se vacía, "Pausar cuenta" |
| 21 | Cuenta en pausa | "Seguir cuenta" |
| 22 | Menú de la partida | Jugadores con avatar, sumar, nivel segmentado, terminar |
| 23 | Terminar partida | Confirmación |
| 24 | Partida terminada | Volver al inicio |
| 25 | Inicio con "Jugar otra vez" | Resume la última configuración |
| 26 | Carta grupal | Para todos, Yo nunca, "Si lo hiciste, bebe 2 tragos" |
| 27 | Mis cartas vacío | Formulario con tipo y nivel segmentados |
| 28 | Mis cartas con una | La carta con su tipo y nivel |
| 29 | Ajustes | Tema, historial, privacidad, respaldo, créditos |
| 30 | Cita: configurar | Personas con avatar, "Agregar persona", set inicial |
| 31 | Cita: acuerdo | Reglas antes de empezar |
| 32 | Cita: cercanía antes | Escala de círculos |
| 33 | Cita: pregunta 1 | Avance, quién lee, pregunta, consejo para quien escucha |
| 34 | Cita: pregunta 11 | Pregunta con cuenta regresiva |
| 35 | Cita: fin de set | Pausa entre sets |
| 36 | Cita: resultado | Antes y después de cada uno |
| 37 | Cita: agregar persona | La misma hoja de Jugadores, dentro del modo cita |
| 38 | Ajustes: ver registro | Confirmación antes de mostrar fechas y nombres |
| 39 | Ajustes: registro de citas | La cita guardada, visible solo tras confirmar |

## Tema claro

| # | Pantalla |
|---|---|
| 01 | Inicio |
| 02 | Lista de jugadores |
| 03 | Configurar, suave |
| 04 | Turno, picante |
| 05 | Carta personal, picante |
| 06 | Cita: pregunta 1 |
| 07 | Ajustes |
