# Plan 5: vidrio líquido adaptado de xenitV1 y ajustable

Fecha: 2026-11-21. Fuente: [xenitV1/liquid-glass-skill](https://github.com/xenitV1/liquid-glass-skill) (MIT), archivos `assets/refraction.js` y `assets/tokens.css`, leídos completos.

Leyenda: **[V]** verificado, **[I]** inferido, **[S]** supuesto a validar.

## Qué traen los dos archivos [V]

**`refraction.js`** (403 líneas, sin dependencias ni red):
- Mapa de desplazamiento por elemento, con la forma real de su borde redondeado (distancia firmada a un rectángulo redondeado).
- Curva del borde: `smoothstep` elevado a 1,6, más fuerte junto al contorno, como el canto de una lente gruesa.
- El mapa se suaviza con `feGaussianBlur` para que las esquinas no se "pellizquen".
- **Separación de color:** tres desplazamientos (R, G, B) con escalas algo distintas, recombinados.
- **Lupa:** un aumento suave hacia el centro (`magnify`).
- Parámetros: fuerza (0–2), ancho del borde, desenfoque tras doblar, dispersión (0–0,2) y lupa.
- **Modo espejo:** para Safari y Firefox copia el DOM y lo resincroniza en cada cuadro.
- Se apaga con `prefers-reduced-transparency` o `data-rt` en `<html>`.

**`tokens.css`** (546 líneas):
- **Borde de luz en tres tramos a 135°:** brillante arriba a la izquierda, tenue al centro y de nuevo más claro abajo a la derecha.
- **"Sheen":** una película especular que se desvanece hacia abajo.
- `@supports not (backdrop-filter)`: relleno opaco.
- `prefers-reduced-transparency`: vidrio grueso y opaco, sin película.
- `.glass-text`: los paneles con texto conservan el tinte aunque refracten.
- El resto (paleta azul y gris de Apple, componentes, `body::before`) choca con Liquid Glass Nocturne.

## Decisiones

1. **`refraction.js` se porta a TypeScript dentro de la app**, no como script global. El mapa (distancia firmada, smoothstep^1,6, lupa) y la cadena de filtros (suavizado del mapa y separación R/G/B) reemplazan a `displacementMap.ts` y al filtro actual de `LensGlass`. Se conserva la atribución MIT en el archivo.
2. **El modo espejo no se porta.** La app Android corre en WebView, que es Chromium y dobla el fondo real. En Safari y Firefox (PWA) queda el desenfoque, como hoy. El modo espejo agrega un bucle por cuadro que cuesta batería en gama baja.
3. **De `tokens.css` se adoptan los mecanismos, no la paleta:** el borde en tres tramos, la película especular, el respaldo opaco sin `backdrop-filter`, el modo de transparencia reducida y la regla de `.glass-text`. Los colores siguen siendo los de Nocturne.
   - La película va como una capa más del fondo de `.glass`, no en `::after`, porque `::after` ya se usa (el punto del set elegido en la cita).
4. **No se baja el tinte al refractar.** Las cartas son texto: es el caso `.glass-text` del propio skill.
5. **Todo el vidrio se rige por variables CSS numéricas** (`--lg-*`) que multiplican los valores base de cada tema. Así un mismo ajuste sirve en claro y en oscuro.
6. **Ajustes → Vidrio:** una pantalla nueva con una carta de muestra arriba y un control por parámetro. Los cambios se ven al instante y se guardan en `settings.glass`, que entra en el respaldo. Hay un botón "Restablecer".

| Parámetro | Qué mueve | Rango | Inicial |
|---|---|---|---|
| Escarcha | desenfoque del fondo | 0–40 px | 28 |
| Saturación | viveza de lo que se ve detrás | 100–250 % | 190 |
| Tinte | cuánto relleno tiene el vidrio | 0–2 × | 1 |
| Color del tinte | neutro o del nivel | — | neutro |
| Película | brillo especular de arriba | 0–0,5 | 0,15 |
| Luz del borde | intensidad del borde de luz | 0–2 × | 1 |
| Profundidad del borde | ancho de la zona que dobla | 4–40 px | 16 |
| Curvatura | cuánto dobla | 0–2 | 1 |
| Separación del color | dispersión R/G/B en el borde | 0–0,2 | 0,04 |
| Lupa | aumento hacia el centro | 0–0,1 | 0 |
| Profundidad | sombra bajo el vidrio | 0–2 × | 1 |
| Reducir transparencia | vidrio opaco, sin refracción | sí / no | no |

7. **Accesibilidad:** `prefers-reduced-transparency` del sistema y el interruptor de la app (que pone `data-rt` en `<html>`) dan vidrio opaco sin refracción. `prefers-contrast: more` da un relleno más denso y un borde más marcado.

## Tareas (un commit cada una)

| # | Tarea | Verificación |
|---|---|---|
| 1 | Motor de refracción portado (mapa y filtro) en `LensGlass` | Tests del mapa: neutro al centro, hacia dentro en el borde, lupa; E2E de refracción activa |
| 2 | Tokens adaptados: borde en tres tramos, película, respaldo opaco, transparencia reducida y contraste | Test de arquitectura; capturas en claro y oscuro |
| 3 | Modelo `settings.glass`: valores iniciales, rangos y validación al leer; se aplica como variables CSS | Tests de validación y de respaldo |
| 4 | Pantalla Ajustes → Vidrio con vista previa, controles y Restablecer | E2E: mover un control cambia la variable y sobrevive a recargar; Restablecer vuelve a los valores iniciales |
| 5 | Capturas, APK y prueba en el emulador | Capturas y salida de `npm run apk` |

**Pendiente aparte:** la revisión del flujo completo con el skill de frontend design (el plan 2 original) queda para después de este.
