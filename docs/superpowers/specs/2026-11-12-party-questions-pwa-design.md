# Diseño: juego de preguntas para grupos (PWA)

Fecha: 2026-11-12. Estado: **borrador para revisión**.
Antecedentes: [`analisis-referencias/REPORTE.md`](../../../analisis-referencias/REPORTE.md)
y [`analisis-referencias/BENCHMARK-VERDAD-O-RETO.md`](../../../analisis-referencias/BENCHMARK-VERDAD-O-RETO.md).

Leyenda: **[V]** verificado (con fuente), **[I]** inferido, **[S]** supuesto o
pendiente de verificar en el plan.

---

## 0. Qué es y qué resuelve

Es un juego para grupos que se juega pasando un solo teléfono. Tiene cuatro modos: Verdad o reto,
Yo nunca, ¿Qué prefieres? y Lo más probable. Resuelve los dos problemas detectados en el
benchmark:

- **Pagar para avanzar de nivel:** todos los modos y niveles son gratis. No hay
  suscripción, anuncios ni cuentas.
- **Poca variedad:** el corpus es propio y grande, con plantillas de variables, cartas
  propias y un historial que evita repetir cartas entre noches.

### Decisiones tomadas

| Tema | Decisión |
|---|---|
| Plataforma | **PWA** instalable. Se usa en Android y también funciona en iPhone. Reemplaza al plan nativo Kotlin para iterar más rápido. |
| Publicación | Uso personal por ahora. Si algún día va a Play, la misma PWA se empaqueta como Trusted Web Activity (sección 6). |
| Modos v1 | Verdad o reto, Yo nunca, ¿Qué prefieres? y Lo más probable. |
| Niveles | Suave, picante y extremo. Son exactos y no se acumulan. El extremo pide confirmar +18 en cada partida. |
| Castigos | Se configuran por partida: tragos (1 a 5), prenda o ninguno. |
| Emparejamiento | Cada jugador declara su género y quién le atrae. La compatibilidad es mutua. |
| Contenido | Lo genera Claude por lotes, el usuario revisa muestras y luego se publica como JSON dentro de la app. |
| Persistencia | Un solo documento JSON con el estado del usuario detrás de la interfaz `UserStore`. |

### Principios heredados de GymMane y Square

- Local-first. Sin cuenta, sin analíticas y sin backend propio.
- El contenido son datos (JSON), no código.
- Los tokens de tema son la única fuente de colores, espacios y tipografía.
- Un test obliga a que todo texto de la interfaz salga del archivo de traducciones.
- Los tests prueban reglas de negocio, no mecánica del framework.
- Las interfaces sirven de costura (`UserStore`).
- Fallar de forma explícita: sin fallbacks silenciosos.

---

## 1. Stack y estructura

### Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Lenguaje | TypeScript estricto | Un solo lenguaje para el motor, la interfaz y las herramientas de contenido. |
| Interfaz | React | Es el stack que ya usa el usuario en otros proyectos. |
| Build | Vite | Recarga instantánea. Se prueba en el teléfono por la red local sin compilar un APK. |
| PWA | `vite-plugin-pwa` | Genera el manifest y el service worker con Workbox ([guía](https://vite-pwa-org.netlify.app/guide/)). [V] |
| Persistencia | IndexedDB, con un registro que guarda todo `UserState` | Las transacciones de IndexedDB son atómicas, así que un cierre a mitad del guardado no deja datos a medias. [I] |
| Tests | Vitest para la lógica y Playwright para el flujo principal | — |

Las versiones exactas, el router y la librería de IndexedDB (si se usa alguna) se fijan en
el plan, después de verificarlas. No se afirman aquí. [S]

**Entorno verificado el 2026-11-12:** Node v24.15.0, npm 11.12.1 y git 2.53.0. [V]
Vite pide Node 18 o 20+ ([guía de vite-plugin-pwa](https://vite-pwa-org.netlify.app/guide/)). [V]
El riesgo del JDK 25 descrito en `REPORTE.md` ya no aplica, porque no hay Gradle.

### Estructura

```
├── content/
│   ├── packs/              cartas publicadas, un JSON por tipo y nivel
│   │   ├── truth.soft.json
│   │   ├── …
│   │   └── extreme/        nivel extremo aparte; se carga con import dinámico
│   ├── GUIDELINES.md       tono por nivel y reglas duras (sección 5)
│   ├── seed/               frases MIT traducidas y adaptadas, más CREDITS.md
│   ├── drafts/             lotes generados, todavía sin publicar
│   └── review/             muestras para que el usuario las revise
├── src/
│   ├── core/               TS puro: sin DOM, sin React, sin IndexedDB
│   │   ├── content/        Card, Pack, ContentValidator
│   │   └── game/           GameEngine, CardPicker, TurnOrder, Matchmaker, TemplateRenderer, ModeBag
│   ├── store/              UserStore (interfaz) + IndexedDbStore
│   ├── ui/                 pantallas React, tema con tokens (CSS custom properties)
│   └── i18n/               es.ts, con todos los textos de la interfaz
└── tests/e2e/              Playwright
```

**Por qué `core` es puro:** `src/core` tiene su propio `tsconfig` sin la librería
`DOM`. Así, si alguien usa `window`, `document` o `indexedDB` dentro del motor, falla la compilación y no
basta con una convención. Además, una regla de lint prohíbe que `core` importe de
`ui` o `store`.

**Cómo se cargan los packs:** los JSON se importan en el build, así que viajan dentro del bundle y
funcionan sin conexión sin pedir nada más. El nivel extremo va en un chunk aparte
que solo se carga después de la confirmación +18.

**Flujo de datos:** packs → `ContentValidator` → lista en memoria → `GameEngine`
(reducer puro, que recibe el historial desde `UserStore`) → hook `useGame` → pantallas.

**Contenido mal formado:** si un JSON no pasa la validación, el build falla con el archivo, el id y el motivo.
La misma validación corre como test.

### Sin red en tiempo de ejecución

Equivale a quitar el permiso `INTERNET` en GymMane:

- Una Content-Security-Policy restringe las conexiones al propio origen
  (`connect-src 'self'`). Esto se verifica con un test E2E. [S: la sintaxis exacta se valida en el plan]
- Sin analíticas, fuentes externas ni CDNs. Todo se sirve desde el propio sitio.

### Hosting y desarrollo

- **Instalar la PWA exige un contexto seguro:** HTTPS, o `localhost` durante el
  desarrollo ([MDN, Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)). [V]
- **Durante el desarrollo,** Vite sirve la app en la red local y se juega en el teléfono por
  `http://<ip-del-pc>`. Sin HTTPS no se registra el service worker, así que en ese modo
  no hay instalación ni modo sin conexión, pero se puede jugar e iterar. [I]
- **Para instalarla,** se despliega en un hosting estático con HTTPS. Cloudflare Pages
  da 500 builds al mes en el plan gratuito
  ([límites](https://developers.cloudflare.com/pages/platform/limits)). [V]
  Si permite desplegar desde un repo privado no quedó verificado. [S] Hay que tener en cuenta que el sitio
  queda en una URL pública, con todo el contenido incluido. Se decide en el plan.

---

## 2. Pantallas y flujo

1. **Inicio:** Nueva partida, Mis cartas y Ajustes.
2. **Jugadores:**
   - La lista se guarda entre partidas.
   - Cada jugador tiene nombre (único, sin distinguir mayúsculas), género (mujer, hombre,
     otro, prefiero no decir) y a quién le atrae (mujeres, hombres, **todos**,
     prefiero no decir).
   - Antes de jugar se marca quién juega esa noche. El mínimo es 2.
3. **Configurar partida:**
   - Modos: uno o varios.
   - Nivel: suave, picante o extremo.
   - Castigo: tragos (con cantidad), prenda o ninguno.
   - El extremo pide confirmar +18 en cada partida.
   - No deja empezar si algún modo elegido no tiene cartas en ese nivel.
4. **Partida:**
   - Si se eligieron varios modos, cada ronda toca uno según la bolsa de modos (sección 4).
   - **Verdad o reto:** muestra el nombre del jugador con los botones Verdad, Al azar y
     Reto. Después aparece la carta con Cumplió y Se niega. Se niega muestra el castigo:
     "Bebe 2 tragos". Los retos con tiempo muestran una cuenta regresiva.
   - **Modos grupales:** la carta es para todos y se pasa con Siguiente.
   - **Menú de partida:** sumar o sacar jugadores, cambiar el nivel o terminar. Nada de eso
     reinicia el historial.
5. **Mis cartas:**
   - Crear cartas con tipo, nivel y texto. El texto admite variables.
   - Exportar e importar packs JSON con el selector de archivos. Exportar descarga un archivo.
6. **Ajustes:**
   - Tema: sistema, claro u oscuro.
   - Borrar el historial.
   - **Exportar e importar un respaldo completo** del estado del usuario (sección 3).
   - Créditos, con la atribución MIT del dataset semilla.

**Fuera de la v1:** puntos o marcador, partida en varios teléfonos, ruleta o botella
animada, otros idiomas, mantener la pantalla encendida y Paranoia.

---

## 3. Modelo de datos

### Cartas (solo lectura)

```ts
type CardType = 'TRUTH' | 'DARE' | 'NEVER' | 'RATHER' | 'MOST_LIKELY';
type Level = 'SOFT' | 'SPICY' | 'EXTREME';
type GameMode = 'TRUTH_OR_DARE' | 'NEVER' | 'RATHER' | 'MOST_LIKELY';

interface Pack { id: string; version: number; lang: string; cards: Card[] }

interface Card {
  id: string;              // único y estable, ej. "tod-t-soft-0001"
  type: CardType;
  level: Level;
  text: string;            // puede llevar variables
  timerSeconds?: number;   // solo para DARE
  tags: string[];
}
```

- **Relación entre modos y tipos:** `TRUTH_OR_DARE` usa `TRUTH` y `DARE`. Cada uno de los otros modos usa
  un solo tipo.
- **Cambios respecto al modelo del benchmark:** se quita `audience`, porque el nivel cumple esa función. `lang`
  pasa a nivel de pack.

### Variables del texto

| Variable | Se reemplaza por | Cuándo es elegible la carta |
|---|---|---|
| `{jugador}` | quien tiene el turno | siempre |
| `{otro}` | otro jugador activo | si hay al menos 2 jugadores |
| `{compatible}` | un jugador afín (ver emparejamiento) | si existe al menos uno |

- Los requisitos se deducen del texto. No hay un campo aparte que los guarde.
- Una variable desconocida es un error de validación.
- Los modos grupales no pueden usar variables de jugador.
- Toda carta con la etiqueta `contacto` tiene que usar `{compatible}`.

### Jugadores y emparejamiento

```ts
type Gender = 'WOMAN' | 'MAN' | 'OTHER' | 'UNDISCLOSED';
type Attraction = 'WOMEN' | 'MEN' | 'ANYONE' | 'UNDISCLOSED';
interface Player { id: string; name: string; gender: Gender; attractedTo: Attraction }
```

**Regla de compatibilidad:** A y B son compatibles solo si a A le atrae el género de B **y** a
B le atrae el género de A.
- `ANYONE` incluye los tres géneros declarados.
- `UNDISCLOSED` en cualquiera de los dos campos, de cualquiera de los dos jugadores, impide la compatibilidad.

| A | B | ¿Compatibles? |
|---|---|---|
| mujer, le atraen hombres | hombre, le atraen mujeres | sí |
| mujer, le atraen hombres | hombre, le atraen hombres | no |
| otro, le atraen todos | mujer, le atraen todos | sí |
| hombre, le atraen mujeres | otro, le atraen hombres | no |
| cualquiera | prefiero no decir | no |

**Quién es el objetivo:** entre los candidatos válidos se elige al que hace más tiempo
que no fue nombrado en una carta.

### Configuración de partida

```ts
type Penalty = { kind: 'DRINKS'; count: 1 | 2 | 3 | 4 | 5 } | { kind: 'GARMENT' } | { kind: 'NONE' };
interface GameConfig { modes: GameMode[]; level: Level; penalty: Penalty }  // modes.length >= 1
```

La confirmación +18 vive en el estado de la partida y no se guarda.

### Estado del usuario

```ts
interface UserState {
  schemaVersion: number;
  players: Player[];
  history: Record<string, number>;  // cardId -> última vez vista (epoch ms)
  customCards: Card[];              // ids con prefijo "custom-"
  settings: { theme: 'SYSTEM' | 'LIGHT' | 'DARK'; lastConfig?: GameConfig };
}

interface UserStore {
  load(): Promise<UserState>;
  save(state: UserState): Promise<void>;
}
```

- **Historial:** es global por carta, no por grupo de jugadores.
- **Cartas que ya no existen:** sus entradas en el historial se podan al cargar.
- **Errores de carga:** si el registro está corrupto o trae un `schemaVersion` desconocido, se muestra una
  pantalla de error que dice qué falló y **no se sobrescribe el registro**. Desde esa pantalla se puede
  exportar el contenido crudo. Las migraciones se escriben en código cuando cambia el esquema.
- **Persistencia:** la primera vez que se guarda un jugador, que es un gesto del usuario, se pide
  `navigator.storage.persist()`. Chrome decide sin preguntar, según heurísticas
  como la instalación de la app. Sin persistencia, los datos pueden borrarse si falta
  espacio, aunque Chrome "rara vez" lo hace
  ([web.dev, Persistent storage](https://web.dev/articles/persistent-storage)). [V]
  Por ese riesgo se agrega a la v1 **exportar e importar un respaldo** en Ajustes.
- **Importar un pack o un respaldo:** se valida entero. Si algo es inválido, se rechaza el archivo
  completo indicando qué falló y por qué. Si un id ya existe con otro texto, también se rechaza.

---

## 4. Motor de la partida

`GameEngine` es un reducer puro: `reduce(state, action) → state`. `Random` y `Clock` se
inyectan, así que con la misma semilla la partida sale idéntica.

- **Acciones:** `Start`, `ChooseTruth`, `ChooseDare`, `ChooseRandom`, `Complete`, `Refuse`, `Next`,
  `AddPlayer`, `RemovePlayer`, `ChangeLevel` y `End`.
- **Guardado:** después de cada carta mostrada, la interfaz guarda el historial a través de `UserStore`.

```ts
interface GameState {
  config: GameConfig;
  players: Player[];                 // activos
  turnQueue: string[];               // ids pendientes en la vuelta actual
  modeBag: GameMode[];               // modos pendientes en la bolsa actual
  choiceCount: Record<string, { truth: number; dare: number }>;
  lastNamed: Record<string, number>; // playerId -> ronda en que fue nombrado por última vez
  round: number;
  phase:
    | { kind: 'AWAITING_CHOICE'; playerId: string }
    | { kind: 'SHOWING_CARD'; card: Card; text: string; playerId?: string }
    | { kind: 'PAUSED_NEED_PLAYERS' }
    | { kind: 'ENDED' };
}
```

1. **Bolsa de modos:** cada modo elegido entra una vez a la bolsa y se baraja. Cuando la bolsa
   se vacía, se rellena. El último modo de una bolsa no puede ser el primero de la siguiente.
2. **Turnos (solo en Verdad o reto):**
   - En cada vuelta juegan todos una vez, en orden barajado.
   - Quien cierra una vuelta no abre la siguiente.
   - Si alguien se suma a mitad de la partida, entra al final de la vuelta actual. Si alguien se va, sale de la cola.
   - Con menos de 2 jugadores, la partida pasa a `PAUSED_NEED_PLAYERS`.
3. **Al azar:** elige el tipo que ese jugador hizo menos veces en la noche. En caso de empate decide el
   azar.
4. **`CardPicker`:**
   1. Arma las cartas elegibles: tipo pedido, nivel exacto (packs más cartas propias) y variables que
      se puedan resolver con los jugadores actuales.
   2. Si hay cartas nunca vistas, elige una al azar entre ellas.
   3. Si no, elige al azar dentro del 25 % visto hace más tiempo (mínimo 1 carta).
   4. Una carta cuenta como vista **al mostrarse**.
5. **Sin cartas posibles:**
   - Con Al azar, prueba el otro tipo.
   - Si el jugador eligió un tipo explícito sin cartas elegibles, se muestra
     "No hay retos posibles para Ana con los jugadores de ahora" y puede elegir el otro tipo.
   - Configurar partida ya impide empezar si un modo no tiene cartas en el nivel elegido.
6. **`TemplateRenderer`:**
   - Si una variable se repite en la misma carta, se reemplaza por la misma persona.
   - `{otro}` y `{compatible}` se reemplazan por el candidato nombrado hace más tiempo.
   - Una variable desconocida lanza un error con el id de la carta y la variable.
7. **Se niega:** muestra el texto del castigo. En la v1 no hay puntos.
8. **Temporizador:**
   - Cuenta regresiva con aviso visual.
   - La vibración usaría `navigator.vibrate`. Si hay soporte en Android Chrome y no en iPhone
     se verifica en el plan. [S] Si no hay soporte, el temporizador queda solo visual. Esto es un límite
     del navegador, no un fallback que tape un error.
9. **Cambios a mitad de partida:** no reinician el historial, la bolsa ni los conteos.

---

## 5. Tests y pipeline de contenido

### Tests

| Qué | Herramienta | Qué se prueba |
|---|---|---|
| `CardPicker` | Vitest | En 1 000 sorteos no se repite ninguna carta mientras queden otras sin ver. El segundo ciclo sale en otro orden. Una carta mostrada cuenta como vista. |
| `TurnOrder` | Vitest | En cada vuelta juegan todos una sola vez. Nadie juega dos veces seguidas, tampoco al cambiar de vuelta. Funciona al sumar o sacar jugadores a mitad de la vuelta. |
| Al azar | Vitest | Elige el tipo que la persona hizo menos veces. |
| `Matchmaker` | Vitest | Se prueban todas las combinaciones (4 × 4 de cada lado). La compatibilidad es simétrica y `UNDISCLOSED` nunca empareja. Una carta con `{compatible}` sin candidato no es elegible. |
| `TemplateRenderer` | Vitest | Una variable repetida se reemplaza por la misma persona. Se elige al nombrado hace más tiempo. Una variable desconocida lanza un error. |
| `ModeBag` | Vitest | Cada modo sale una vez por bolsa y no se repite al cambiar de bolsa. |
| Partida completa | Vitest | Escenarios con semilla fija, de principio a fin, incluidos los cambios a mitad de partida. |
| `IndexedDbStore` | Vitest con una IndexedDB simulada [S: la librería se elige en el plan] | Guardar y leer devuelve lo mismo. Un registro corrupto o un esquema desconocido fallan y el registro queda intacto. |
| Contenido | Vitest, sobre todos los packs reales | Se valida el esquema y que los ids sean únicos. Se rechazan las variables desconocidas, las variables de jugador en modos grupales y la etiqueta `contacto` sin `{compatible}`. También se rechazan los casi duplicados y las palabras prohibidas en el nivel suave. Se exige un mínimo de cartas por combinación. |
| Textos traducibles | Lint | Falla si hay texto literal en el JSX de `src/ui`. [S: la regla exacta se elige en el plan] |
| Flujo principal | Playwright con viewport móvil | Crear 2 jugadores, empezar, elegir verdad y ver la carta. Los selectores van por `data-testid` o rol accesible. |
| Sin red | Playwright | La partida no hace peticiones fuera del propio origen. |

**Casi duplicados:** se normaliza el texto (minúsculas, sin tildes ni signos) y se compara
por trigramas de palabras. El umbral se ajusta en el plan con datos reales. [S]

### Pipeline de contenido

1. **`content/GUIDELINES.md`** define el tono y las reglas duras:
   - Suave: apto para cualquier reunión.
   - Picante: sugerente, nunca explícito.
   - Extremo: va aparte.
   - Nada peligroso, ilegal ni humillante, y nada que involucre manejar ni a menores.
   - El alcohol solo aparece como castigo.
   - Todo contacto físico usa `{compatible}` y lleva la etiqueta `contacto`.
   - Español neutro.
2. **Semilla:** las ~1 200 frases de juego del dataset MIT
   [party-game-sentences](https://github.com/itsbrunodev/party-game-sentences) se traducen
   y adaptan, con atribución en `CREDITS.md`.
3. **Lotes de 100 cartas** por combinación de tipo y nivel en `content/drafts/`. Cada lote pasa
   `npm run content:check` (el mismo `ContentValidator`) antes de llegar al usuario.
4. **Muestra de 20 cartas al azar por lote,** en `content/review/<lote>.md`, numerada.
   El usuario responde con los números que rechaza y el motivo.
   - Si rechaza 2 o menos: se quitan esas cartas, se revisan a mano las que se les parezcan y el
     lote se promueve.
   - Si rechaza más: el lote se descarta, se ajusta la guía y se genera otro.
5. **Promoción:** se asignan ids definitivos y consecutivos, el lote se mueve a `content/packs/` y
   se valida el pack completo, incluidos los casi duplicados contra lo que ya existe.

### Metas de volumen

Hay 10 combinaciones: verdad, reto y yo nunca en suave y picante, ¿qué
prefieres? y lo más probable en ambos niveles, y extremo aparte.

| Hito | Cartas por combinación |
|---|---|
| Hito 1, jugable una noche sin repetir | ≥150 |
| v1 | ≥500 |
| Mediano plazo | ≥2 000 |

El mínimo que exige el test es una constante que sube con cada hito. El ritmo de
generación por sesión todavía no se conoce y se mide con los primeros lotes.

---

## 6. Distribución y restricciones

- **Google Play** prohíbe el contenido sexual explícito
  ([política](https://support.google.com/googleplay/android-developer/answer/9878810)). [V]
  Mientras el uso sea personal no aplica, pero el nivel picante se escribe sugerente desde el
  inicio para no tener que reescribirlo después.
- **Si se publica en Play:** una PWA se puede abrir a pantalla completa desde una app Android como
  Trusted Web Activity. Bubblewrap es una CLI de Node que genera ese proyecto, y el sitio
  y la app deben vincularse con Digital Asset Links
  ([Chrome for Developers, TWA](https://developer.chrome.com/docs/android/trusted-web-activity)). [V]
  Esa página no confirma que se pueda publicar en Play; eso queda por verificar cuando llegue el momento. [S]

---

## 7. Preguntas abiertas

1. **Nombre de la app.** Hace falta para el manifest, el título y el icono.
2. **Hosting:** si Cloudflare Pages u otro hosting despliega desde un repo privado, y si la URL
   pública con el contenido incluido es aceptable.
3. **Versiones exactas** de React, Vite, `vite-plugin-pwa`, el router y la librería de IndexedDB. Se
   verifican en el plan.
4. **Soporte de `navigator.vibrate`** por plataforma.
5. **Umbral de casi duplicados.**
6. **Repo git:** la carpeta todavía no es un repositorio. Se crea al empezar el plan.
