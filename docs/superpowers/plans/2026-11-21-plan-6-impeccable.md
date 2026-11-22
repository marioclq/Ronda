# Plan 6: refinar todo el diseño con /impeccable

Fecha: 2026-11-21. Después del plan 5 (vidrio ajustable).
Comandos pedidos: audit, animate, bolder, delight, layout, overdrive, optimize y polish, sobre toda la app.

Leyenda: **[V]** verificado, **[I]** inferido, **[S]** supuesto a validar.

## Contexto que dio `impeccable context` [V]

- **No hay `PRODUCT.md` ni `DESIGN.md` en la raíz.** El `DESIGN.md` de Stitch vive en `Redesign/…/liquid_glass_nocturne/`.
- Los comandos de refinamiento pueden seguir sin bloquearse. Toman como referencia el código actual (tokens, CSS y componentes), lo preservan y ofrecen `init` al final.
- **Modo de diseño: Operate** (interfaz de una app). Dos excepciones con algo de Experience: la carta en juego y la ruleta, donde la app es "el objeto" sobre la mesa.
- Hay una versión nueva de impeccable (4.10.0; la instalada es la 4.6.0).

## Orden propuesto (distinto del pedido, a propósito)

| # | Comando | Por qué en este lugar |
|---|---|---|
| 0 | `init` (breve) | Fija la verdad del producto (juego de fiesta local, un teléfono en la mesa, de noche, sin cuentas). Bolder, delight y overdrive la necesitan para no inventar personalidad |
| 1 | `audit` | Diagnóstico con puntajes: lo que encuentre ordena el resto |
| 2 | `layout` | Ritmo, espaciado y jerarquía primero: lo demás se apoya en la estructura |
| 3 | `bolder` | Subir el carácter donde quedó plano (Inicio, encabezados, la carta) |
| 4 | `animate` | Movimiento con propósito sobre la estructura ya fija |
| 5 | `delight` | Un único momento memorable, sobre el movimiento existente |
| 6 | `overdrive` | Lo extraordinario, propuesto antes de construir |
| 7 | `optimize` | Medir y recortar **después** de lo que más cuesta (vidrio, animaciones, overdrive) |
| 8 | `polish` | La pasada final de calidad sobre todo el recorrido |

El orden pedido ponía `optimize` antes de `polish` pero después de `overdrive`; aquí se mantiene esa relación. Solo `layout` sube al principio, porque mover el espaciado después de animar obliga a rehacer animaciones.

## Qué se espera de cada paso

Cada paso es un commit (o varios, si toca muchas pantallas). Todos cierran con typecheck, tests unitarios y E2E en verde, y capturas antes y después en oscuro y claro.

### 0. `init`
- **Salida:** `PRODUCT.md` con usuarios, escenas de uso, tono y lo que la app no es (sin red, sin puntos, sin comunidad).
- Se arma con tus respuestas a unas pocas preguntas; no se inventa.

### 1. `audit`
- **Salida:** un informe en `docs/` con puntaje de 0 a 20 en cinco ejes:
  - accesibilidad;
  - rendimiento;
  - temas;
  - respuesta en distintos tamaños;
  - integridad de la implementación.
- Los hallazgos se ordenan por gravedad.
- **Candidatos ya sospechados [I]:**
  - contraste del texto atenuado sobre el vidrio claro;
  - el desplazamiento al pasar de Configurar a la partida;
  - áreas táctiles de 44 px en los chips de tragos;
  - el costo del vidrio de 28 px en gama baja.
- Los arreglos del audit van en sus propios commits.

### 2. `layout`
- **Pantallas:** Inicio, Jugadores, Configurar, Turno, Carta, Mis cartas, Ajustes, Vidrio y Modo cita.
- **Objetivo:**
  - una tesis espacial única (escala de espaciado coherente);
  - zonas para el pulgar con las acciones abajo;
  - densidad de Ajustes y Vidrio, hoy largas.

### 3. `bolder`
- **Dónde:** el título de Inicio, el nombre del jugador en el turno, la carta y el resultado de la cita.
- **Límite:** sin romper la paleta Nocturne ni la tipografía Inter de `DESIGN.md`.

### 4. `animate`
- **Tesis de movimiento:** el vidrio como material líquido. Entradas de hoja, cambio de nivel, pasar la carta y el aterrizaje de la ruleta (la versión rápida que pediste se conserva).
- `prefers-reduced-motion` se respeta siempre.

### 5. `delight`
- **Un único momento memorable** [S, a proponer]. Candidatos:
  - el "pase del teléfono" entre turnos;
  - el final de la cita;
  - el sorteo de "Al azar".

### 6. `overdrive`
- **Se propone antes de construir**, como pide el skill.
- **Candidatos [S]:**
  - el vidrio que responde al giro del teléfono (la luz del borde sigue la orientación);
  - transiciones entre pantallas con continuidad de la carta;
  - todo con mejora progresiva y con salida en transparencia y movimiento reducidos.

### 7. `optimize`
- **Medir antes y después:**
  - tamaño del bundle (hoy hay un aviso de más de 500 kB);
  - tiempo hasta interactivo en el emulador;
  - costo del blur y del mapa de refracción.
- **Candidatos [I]:**
  - dividir el contenido de cartas en partes;
  - limitar el `backdrop-filter` en elementos secundarios;
  - no regenerar mapas sin cambios.

### 8. `polish`
- **Pasada final** por el recorrido completo: estados vacíos, foco, estados presionados, consistencia de íconos y textos.
- **Cierre:** capturas nuevas en `capturas/` y APK.

## Verificación global

- Al terminar: `npm run typecheck`, `npm test` y `npm run e2e` en verde.
- Capturas del recorrido completo en oscuro y claro.
- APK probado en el emulador, cerrando al final con `stop-android-dev.ps1`.

## Decisiones pendientes

1. **Si se hace `init` primero.** Propuesta: sí, breve. Sin él, bolder, delight y overdrive se guían solo por el código.
2. **Si se actualiza impeccable a 4.10.0** antes de empezar. Corre `npx impeccable update` y aplica recién en la sesión siguiente.
