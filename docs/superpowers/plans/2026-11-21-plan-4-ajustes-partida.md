# Plan 4: ajustes de la partida tras la prueba en el teléfono

Fecha: 2026-11-21. Origen: prueba del APK del rediseño en el teléfono.

Leyenda: **[V]** verificado, **[I]** inferido, **[S]** supuesto a validar.

## Lo que se observó

| # | Observación | Causa |
|---|---|---|
| O1 | La ruleta de "Al azar" demora mucho y se veía mejor antes | R3 la cambió a tres estados: gira hasta 3 s, frena ~1,2 s y espera a que alguien toque "Revelar pregunta" [V]. Antes duraba ~1,9 s y mostraba la carta sola |
| O2 | El menú de partida se abre desde abajo aunque el botón está arriba | Todas las hojas usan el mismo `Dialog` anclado abajo [V] |
| O3 | Para cerrar el menú hay que tocar "Cerrar"; tocar fuera no hace nada | El `<dialog>` nativo no cierra al tocar el fondo [V] |
| O4 | Al minimizar la app y volver, no se regresa a la partida | La partida vive solo en memoria (`GameContext`) [V]. Si Android cierra el proceso en segundo plano, al volver la app arranca de cero en Inicio [I: se reproduce en el emulador] |

## Decisiones

1. **Ruleta como antes.** Se vuelve a la secuencia rápida que se frena sola (~1,4 s), se queda en el resultado medio segundo y la carta aparece sola. Se quitan "Parar ruleta" y "Revelar pregunta". Se mantiene la regla: la última cara es siempre la que eligió el motor (tests de `roulette.ts`). El aspecto vuelve al de antes: una sola losa de vidrio con la palabra que cambia y el acento al aterrizar; se conserva el ícono de cada tipo.
2. **El menú cae desde arriba**, pegado a la barra donde está su botón. `Dialog` gana `placement: 'top'`; el resto de las hojas (confirmaciones, agregar jugador) siguen subiendo desde abajo.
3. **Tocar fuera cierra** cualquier hoja, salvo que esté bloqueada (cargando el nivel extremo). Se mira si el toque cayó fuera del rectángulo del diálogo; tocar el relleno interior no cierra.
4. **La partida en curso sobrevive a que Android cierre la app.** Se guarda en `localStorage` (síncrono, sobrevive al cierre del proceso) después de cada acción; se borra al terminar o descartar. Al abrir, si hay una partida guardada, se restaura y se va a la partida. La partida restaurada conserva su confirmación +18 porque es la misma partida, no una nueva; si es de nivel extremo, primero se cargan sus cartas. La cita en curso queda fuera de este plan [S: se agrega si la prueba muestra que hace falta].

## Tareas (un commit cada una)

| # | Tarea | Verificación |
|---|---|---|
| 1 | Reproducir O4 en el emulador: partida empezada, Inicio, `am kill`, volver | Captura antes y después |
| 2 | Ruleta como antes (O1) | Tests de `roulette.ts`; E2E de Al azar sin tocar nada |
| 3 | `Dialog`: tocar fuera cierra (O3) | E2E: abrir menú, tocar fuera, se cierra |
| 4 | Menú desde arriba (O2) | Captura |
| 5 | Partida guardada y restaurada (O4) | Tests de guardar/leer; E2E: recargar a mitad de partida vuelve a la misma carta; emulador con `am kill` |
| 6 | APK y prueba en el emulador | Salida de `npm run apk` y capturas |
