# Análisis de referencia: GymMane y Square

Fecha: 2026-11-09. Repos clonados y leídos en local (no solo el README):

| Repo | Commit más reciente | Commits | Primer commit |
|---|---|---|---|
| [InlitX/GymMane](https://github.com/InlitX/GymMane) | 2026-11-08 | 447 (418 del autor) | 2026-08-05 |
| [Lelonio/Square](https://github.com/Lelonio/Square) | 2026-11-06 (v2.9.0) | 473 (459 del autor) | 2026-08-04 |

Leyenda de certeza: **[V]** verificado en el código o ejecutando un comando,
**[I]** inferido a partir de lo verificado, **[S]** supuesto sin comprobar.

---

## 1. Lo que tienen en común

Son proyectos de un solo autor, de unos 3 meses, con ~450 commits cada uno. Se
nota en el código: hay pocas capas y las decisiones tienen nombre propio.

| Principio | GymMane | Square |
|---|---|---|
| Android primero, APK fuera de Play Store | F-Droid, IzzyOnDroid, GitHub Releases [V] | GitHub Releases, autoactualización [V] |
| Sin cuenta propia ni servidor propio | Ni siquiera tiene permiso `INTERNET` (lo elimina con `tools:node="remove"`) [V] | Usa las cuentas de Spotify/Google del usuario y no tiene backend propio [V] |
| Persistencia local simple | `SharedPreferences` con un único JSON [V] | `SharedPreferences` envueltas en `*Store` con `StateFlow` [V] |
| Sin base de datos ni ORM | No hay sqflite/drift/hive [V] | No hay Room ni DataStore en las dependencias [V] |
| Una sola fuente de verdad para la UI | `FitState` global (`fit`) [V] | `MainViewModel` con `StateFlow` por área [V] |
| Sistema de diseño propio sobre Material 3 | `ThemeExtension<GymColors>` con tokens [V] | `SquareTheme` con color tomado de la carátula [V] |
| Efecto "vidrio" como seña visual | `BackdropFilter` + shaders `.frag` [V] | Vidrio líquido con refracción (lib `backdrop`, API 33+) [V] |
| Iconos Phosphor | `phosphoricons_flutter` [V] | `com.adamglin:phosphor-icon` [V] |
| Una sola familia tipográfica | Nunito, 400–900 [V] | Inter [V] |
| i18n desde el día 1 | 18 idiomas (README), ARB [V] | 12 idiomas, `values-xx` [V] |
| Builds por ABI | `--split-per-abi` [V] | `splits { abi }` + APK universal [V] |
| Firma fuera del repo | Keystore en GitHub Secrets [V] | `keystore.properties` ignorado por git [V] |
| Licencia | GPL-3.0 + término extra 7(b) de atribución [V] | GPL-3.0 [V] |
| Commits | Frase en inglés, imperativo, describe el efecto para el usuario ("Fix empty archived foods list") [V] | Igual ("Halve the frost's cost while scrolling") [V] |

---

## 2. GymMane: cómo está hecho

### Stack [V]
- **Flutter** (Dart SDK `^3.11.5`; CI fija Flutter `3.41.9`). Java 17 en CI.
- Android: AGP 8.9.1, Kotlin 2.1.0, Gradle 8.14, `compileSdk 36`, `minSdk 24`.
- Dependencias mínimas y sin framework de estado ni router: `shared_preferences`,
  `flutter_local_notifications`, `home_widget`, `path_provider`, `share_plus`,
  `archive`, `intl`, etc. No usa Provider, Riverpod, Bloc ni go_router.

### Estructura [V]
```
lib/
├── app/       MaterialApp, shell y barra inferior (app_shell.dart, 1184 líneas)
├── catalog/   base de ejercicios como código Dart (exercise_catalog.dart, 7609 líneas)
├── l10n/      ARB + clases generadas
├── models/    clases de datos planas con toJson/fromJson
├── screens/   un archivo por pantalla
├── services/  almacenamiento, backup/import, alarmas, widgets, puentes nativos
├── state/     FitState partido en `part` por área
├── theme/     app_colors.dart (tokens) y app_theme.dart
└── widgets/   ui_kit.dart (componentes base) y piezas compartidas
```
~114 000 líneas en `lib/`, contando ~13 000 generadas de l10n.

### Arquitectura
- **Estado: un `ChangeNotifier` global.** `FitState extends FitCore with
  ToolsState, LibraryState, …, WorkoutState` (18 mixins, cada uno en su archivo
  `part`). Hay una sola instancia, `fit`. Las pantallas escuchan `fit` y llaman
  a sus métodos. [V]
- **Navegación sin librería.** `fit.route` es un `String` y `app_shell.dart` hace
  `switch (fit.route)` con ~25 casos (`'home'`, `'session'`, `'nutrition'`…)
  sobre una pila propia `_routeStack`. [V]
- **Persistencia.** `Store` serializa todo el estado a **un único JSON** en
  `SharedPreferences` (clave `gymmane_v1`). Exporta a CSV, JSON y ZIP. [V]
- **Nativo por canales.** 13 servicios usan `MethodChannel` hacia Kotlin
  (`HealthBridge`, `LiveNotifier`, 6 widgets de pantalla de inicio, voz, sonido). [V]
- **Arranque explícito en `main.dart`:** inicializa los stores, carga el estado,
  sincroniza recordatorios y decide entre la app de teléfono y la de Wear OS. [V]

### Diseño [V]
- Tres temas: `dark`, `amoled` y `light`. Neutros cálidos y un acento cobre
  (`#D9A184` oscuro / `#9E4E27` claro), salvia, latón, y colores semánticos
  `info`/`warn`/`danger`. Los tokens viven en `GymColors`, no sueltos en widgets.
- Helpers tipográficos `AppTheme.d()` y `AppTheme.f()`: un solo punto para tamaño,
  peso e interlineado.
- `ui_kit.dart` reúne los componentes propios (`SoftCard`, `Pill`,
  `PrimaryButton`, `SegToggle`, `StepperControl`, `ScreenHeader`…).
- `glass.dart`: sheets y diálogos con desenfoque y shaders GLSL
  (`edge_fade.frag`, `medal.frag`).
- Arte propio: mapa corporal en SVG, ilustraciones de comida e insignias.

### Reglas de la casa (CONTRIBUTING.md) [V]
1. Sin cuentas ni datos remotos, **nunca**.
2. Sin red: "lo que funciona en modo avión es válido".
3. **Sin comentarios en el código**; el porqué va en el mensaje de commit.
4. Todo texto visible pasa por `t.<clave>` y el ARB. **Un test lo hace cumplir.**
5. Las estadísticas se calculan con datos reales registrados, nunca estimados.
6. `dart format` y `flutter analyze` limpios.

### Calidad [V]
- 101 archivos de test y ~1100 llamadas `test()`/`testWidgets()`. Prueban reglas
  de negocio (récords, progresión, backups de ida y vuelta, importación de
  archivos reales de otras apps) y que las traducciones estén completas.
- CI (`build-apk.yml`): analyze → test → build. Release **reproducible** para
  F-Droid: lockfile forzado, `PUB_CACHE` en ruta fija, parche de `--build-id=none`
  y `--split-debug-info`.

---

## 3. Square: cómo está hecho

### Stack [V]
- **Kotlin nativo + Jetpack Compose** (Material 3, Compose BOM 2026.06.01).
- AGP 8.13.2, Kotlin 2.3.21, Gradle 9.3.0, `compileSdk 37`, `targetSdk 35`,
  `minSdk 26`, Java 17. Catálogo de versiones en `gradle/libs.versions.toml`.
- Media3 (ExoPlayer + MediaSession), OkHttp/Retrofit/Ktor,
  kotlinx.serialization, Coil, Navigation Compose, `backdrop` (vidrio líquido).
- **Núcleo nativo en Rust** (`native/`, librespot parcheado) compilado con
  `cargo-ndk` y llamado por JNI, más una lib C++ (Bungee) vía CMake. Esto existe
  solo porque reproduce audio de Spotify. **No hace falta para otro ámbito.**

### Estructura [V]
```
app/src/main/java/dev/lelonio/square/
├── auth/         OAuth y tokens
├── backend/      MusicBackend (la interfaz) + SpotifyBackend + youtube/
├── data/         ~45 *Store / repos pequeños, uno por tema
├── download/     cola y servicio de descargas
├── nativecore/   NativeBridge (JNI)
├── playback/     PlaybackService, cola, efectos de audio
├── ui/           MainActivity, MainViewModel, SquareApp + carpetas por pantalla
│   ├── glass/    el sistema de vidrio (shapes, morph, backdrop, tab bar)
│   └── theme/    Theme.kt, Fonts.kt, ArtworkColor.kt
└── update/, widget/, diagnostics/
innertube/        módulo Gradle vendorizado (cliente de YouTube Music)
native/           crate Rust `squarecore`
```
~93 000 líneas de Kotlin en `app/`.

### Arquitectura
- **Una interfaz como costura.** `MusicBackend` es lo único que la UI conoce:
  catálogo y `Player`. Hay dos implementaciones y se cambia en caliente. Si un
  backend no sabe hacer algo, **devuelve el valor vacío en lugar de lanzar una
  excepción**, para que ninguna pantalla tenga que saber cuál está activo. [V]
- **Estados explícitos con `sealed interface`** (`BackendAuthState.LoggedOut /
  Connecting / LoggedIn / Failed`) y `data class` inmutables para la UI. [V]
- **Un `AndroidViewModel`** (`MainViewModel`, ~6900 líneas) expone ~20
  `StateFlow` por área (`feed`, `search`, `playlist`, `devices`…). [V]
- **Stores pequeños y tolerantes:** cada preferencia es un `MutableStateFlow` que
  escribe en `SharedPreferences`. Guarda strings en lugar de enums para que un
  valor antiguo se lea como "sin definir" y no rompa la app. [V]
- **Navegación:** Navigation Compose (`NavHost` + `Routes.*`). [V]
- **Servicio en primer plano** con MediaSession para la notificación, la pantalla
  de bloqueo y Android Auto. [V]

### Diseño [V]
- "Vidrio sobre la carátula": el fondo es un color extraído de la portada que
  suena. Los neutros hacen todo el trabajo estructural y **el acento solo marca
  estado** (play, toggle activo, fila actual). El acento se anima 600 ms al
  cambiar de canción.
- Vidrio con refracción en barras, sheets y menús. Blur, refracción y tinte son
  ajustables y hay un modo ligero para teléfonos lentos. Por debajo de API 33
  cae a un relleno translúcido.
- Rendimiento medido: tipo de build `dev` (release sin R8) porque un build
  `debug` desactiva optimizaciones de ART y falsea la fluidez; baseline profiles.

### Estilo de código [V]
- Lo **opuesto** a GymMane en comentarios: KDoc extensos que explican el porqué
  de cada decisión (por qué un puerto fijo, por qué un mutex en el refresh del
  token, por qué no reconstruir la playlist en `getState()`).
- `docs/DEVELOPMENT.md` con diagrama de capas y una sección de trampas
  conocidas ("Notes for anyone reading the code").

### Calidad [V]
- 11 archivos de test JVM con 51 `@Test` (cola, shuffle, historial, letras,
  shaders). Mucha menos cobertura que GymMane.
- CI: APK `dev` en cada push/PR; workflow de release aparte; anuncio en Telegram.

---

## 4. Qué tomar de cada uno para la app nueva

Estos principios no dependen del ámbito:

1. **Local-first.** Los datos del usuario viven en el teléfono y se exportan
   (CSV/ZIP). Agregar red solo si el ámbito la exige.
2. **Una costura por cada dependencia externa** (patrón `MusicBackend`): una
   interfaz que devuelve valores vacíos, nunca obliga a la UI a preguntar "¿quién
   responde?".
3. **Estado en un solo lugar, partido por área** (mixins de `FitState` o un
   `StateFlow` por área en el ViewModel).
4. **Tokens de diseño en un objeto de tema** (`GymColors`/`SquareTheme`), con un
   acento reservado para estado y una sola familia tipográfica.
5. **Kit de componentes propio** (`ui_kit.dart`) antes que widgets sueltos.
6. **Tests de reglas de negocio + un test que obligue a traducir todo el texto.**
7. **Builds reproducibles y firma fuera del repo.**
8. **Porqué documentado**: en commits (GymMane) o en KDoc + `DEVELOPMENT.md`
   (Square). Elegir uno y ser consistente.

Lo que **no** conviene copiar [I]:
- Archivos gigantes: `MainViewModel.kt` (~6900 líneas), `session_screen.dart`
  (~3500), `SquareApp.kt` (~4600). Funcionan para un autor solo; para mantenerlos
  conviene un ViewModel por pantalla o un mixin por área desde el inicio.
- Un único JSON para todo el estado (GymMane): se reescribe completo en cada
  guardado. Para volúmenes grandes de datos, Room o drift.
- El núcleo Rust de Square: complejidad que solo se justifica por el audio de
  Spotify.

**Licencias.** Tomar principios y patrones es libre. **Copiar código** convierte
la app en obra derivada GPL-3.0, y en el caso de GymMane obliga además a mostrar
"Based on GymMane by InlitX" (`ADDITIONAL_TERMS.md`). La librería de vidrio
`io.github.kyant0:backdrop` es Apache-2.0 y se puede usar sin esa obligación.

---

## 5. ¿Está el PC listo?

Comprobado el 2026-11-09 con `Get-Command`, variables de entorno y el contenido
de `D:\Android\Sdk`.

### Lo que ya está instalado [V]

| Herramienta | Estado |
|---|---|
| Android Studio | 2026.2.1 en `C:\Program Files\Android\Android Studio` |
| JDK de Android Studio (`JAVA_HOME`) | `jbr`, **OpenJDK 25.0.3** |
| JDK en `PATH` | Microsoft OpenJDK **17.0.20** |
| Android SDK (`ANDROID_HOME`) | `D:\Android\Sdk` |
| Plataformas | `android-36`, `android-37.0` |
| Build-tools | 35.0.0, 36.0.0, 37.0.0 |
| NDK | 27.1.12297006 |
| CMake, cmdline-tools, platform-tools, emulador | sí |
| AVD | `Pixel_8_API_37` |
| Git | 2.53.0 |
| Node / Python / Docker / VS Code | sí (no hacen falta para la app) |
| Hardware | i5-10400F, 31.9 GB RAM, 118 GB libres en C:, 435 GB en D: |

### Lo que falta [V]

| Herramienta | Necesaria para |
|---|---|
| **Flutter SDK / Dart** | Stack tipo GymMane |
| Rust, rustup, cargo-ndk | Solo para un núcleo nativo como el de Square (no recomendado) |
| NDK 28.2.13676358 | Solo para compilar Square tal cual |
| `gh` (GitHub CLI) | Opcional, releases y PRs |

### Riesgo detectado: JDK 25 en `JAVA_HOME`
- Gradle necesita **9.1.0 o superior para ejecutarse sobre Java 25** y
  7.3 o superior para Java 17 ([matriz de compatibilidad de Gradle](https://docs.gradle.org/current/userguide/compatibility.html)). [V]
- GymMane usa Gradle **8.14**, así que con `JAVA_HOME` en el `jbr` 25 su build
  Android fallaría. [I]
- Flutter suele detectar el JDK de Android Studio; se fija a mano con
  `flutter config --jdk-dir`. Esto viene de un resumen de la doc de Flutter, no
  de una cita textual. [S]
- Un proyecto Kotlin nuevo creado con el asistente de Android Studio 2026.2
  debería usar un Gradle compatible con Java 25. [S] Se confirma al primer build.

### Veredicto

**Recomendación: Kotlin + Jetpack Compose (la base de Square, sin el núcleo
Rust), con las reglas de producto de GymMane.** Todo lo necesario ya está
instalado y es el stack nativo de Android. Es la única opción que funciona hoy
sin instalar nada. [V para lo instalado; **no verificado con un build**]

Elegir **Flutter** solo si la app tiene que salir también en iOS. En ese caso hay
que:
1. Instalar el SDK de Flutter y agregar `bin` al `PATH`
   ([guía de Flutter](https://docs.flutter.dev/get-started/install/windows)).
2. `flutter config --jdk-dir "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"`
   para no usar el JDK 25.
3. `flutter doctor --android-licenses` y `flutter doctor -v`
   ([setup Android de Flutter](https://docs.flutter.dev/platform-integration/android/setup)).
4. Puede que `flutter doctor` pida activar el Modo desarrollador de Windows para
   los symlinks de los plugins. No encontré fuente oficial que lo confirme. [S]
   Hoy el valor `AllowDevelopmentWithoutDevLicense` está vacío. [V]

Nota: compilar iOS requiere macOS con Xcode, y este PC es Windows. Flutter en
Windows solo saca Android (y escritorio Windows/web). [I]
