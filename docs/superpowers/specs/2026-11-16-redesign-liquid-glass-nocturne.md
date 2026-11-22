# Rediseño: Liquid Glass Nocturne

Fecha: 2026-11-16. Estado: **borrador para revisión**.
Fuente: `Redesign/stitch_liquid_glass_interface_redesign/` (exportación de Stitch: 18 pantallas, cada una con `code.html` y `screen.png`, más el sistema en `liquid_glass_nocturne/DESIGN.md`).
Relación con otros planes: spec v1 y plan v2 ([`2026-11-16-v2-design.md`](2026-11-16-v2-design.md)). La fase A de v2 ya está hecha.

Leyenda: **[V]** verificado en los archivos, **[I]** inferido, **[S]** supuesto a validar.

---

## 0. Qué trae la carpeta

| Pantalla de Stitch | Pantalla de la app |
|---|---|
| `ronda_inicio_liquid_glass` | Inicio |
| `ronda_gesti_n_de_jugadores` | Jugadores |
| `ronda_configurar_partida` | Configurar partida |
| `ronda_turno_de_juego` | Turno (Verdad / Al azar / Reto) |
| `ronda_ruleta_al_azar`, `ronda_ruleta_girando_activa`, `ronda_desaceleraci_n_y_resultado_victorioso` | Al azar en tres estados: girando, frenando, resultado |
| `ronda_carta_de_reto_y_temporizador` | Carta personal con cuenta regresiva |
| `ronda_carta_grupal_yo_nunca` | Carta grupal |
| `ronda_modal_men_de_partida`, `ronda_modal_confirmaci_n_de_abandono` | Menú de partida y confirmar terminar |
| `ronda_mis_cartas_personalizadas` | Mis cartas |
| `ronda_ajustes_generales` | Ajustes |
| `ronda_modo_cita_*` (5 pantallas) | Modo cita: configurar, acuerdo, IOS, pregunta, resultado |

**Sistema visual ([V], `DESIGN.md`):**
- **Base:** violeta medianoche (`#14121f` / `#0D0B18`).
- **Un color por nivel:** suave ámbar (`#FF8C53`), picante magenta (`#D92688`), extremo carmesí (`#E6194B`).
- **Vidrio:** `blur(28px) saturate(190%)`, relleno blanco del 12 % al 3 % y borde especular de 1 px.
- **Tipografía:** Inter, pesos 700–800 con interletrado negativo (−0,03 a −0,015 em); el texto de carta usa 20 px con interlínea 1,4.
- **Formas:** botones píldora (radio completo), chips de 24 px de radio, cartas y hojas de 32 px.
- **Botón principal:** 56 px de alto, degradado `#FFA36B` → `#FF7A3D`, texto medianoche y brillo volumétrico ámbar.
- **Cartas apiladas:** las de atrás bajan su opacidad (0,5 y 0,25), escalan a 0,95 y 0,90 y se desplazan hacia arriba.

**Cómo está construido ([V]):** cada `code.html` carga Tailwind por CDN, Google Fonts (Inter; Plus Jakarta Sans en 2 pantallas) y la fuente de íconos Material Symbols (unos 40 íconos distintos). Además, hay 13 imágenes alojadas en servidores de Google.

---

## 1. Decisiones

1. **Se reconstruye en la app, no se copia el HTML.** Los HTML dependen de CDN y la app funciona sin red con CSP `connect-src 'self'` (spec v1). El rediseño se aplica sobre los tokens CSS y los componentes React existentes, que ya tienen tests de arquitectura (sin textos ni colores literales en el JSX).
2. **Tipografía: Inter, servida desde la app** con `@fontsource-variable/inter` 5.3.0 (OFL-1.1, verificado con `npm view`). Reemplaza a Bricolage Grotesque y Figtree. Plus Jakarta Sans no se usa: aparece en 2 pantallas sueltas y el `DESIGN.md` define todo en Inter.
3. **Íconos: se dibujan en nuestro set SVG**, no se carga la fuente Material Symbols. Son unos 20 íconos nuevos con el estilo de trazo actual, más livianos y sin red.
4. **Colores: los tokens de `DESIGN.md` mandan.** La aurora se conserva como mecanismo (cambia de color con el nivel y se desliza entre niveles), pero toma los tres acentos y la base medianoche del sistema.
5. **Tema claro: se mantiene.** La pantalla de Ajustes de Stitch ofrece Sistema, Claro y Oscuro, pero solo diseña el oscuro. El claro se deriva de los mismos tokens, con la misma jerarquía, y se valida con capturas.
6. **Lo inventado se descarta.** Stitch rellenó con datos y funciones que la app no tiene o que contradicen la spec (sección 3). Ningún número, estado ni texto de relleno llega a la app.
7. **Los títulos de relleno en inglés** ("Active Game Round", "Active Card Screen", "Date Mode Flow", "CUSTOM CARDS") se reemplazan por los títulos reales en español de `es.ts`.

---

## 2. Qué se adopta y qué se adapta

### 2.1 Sistema (toda la app)
- Tokens de color, tipografía, radios y espaciado de `DESIGN.md`.
- Material de vidrio con `blur(28px) saturate(190%)` y borde especular. El blur de 28 px pesa más que el actual: se mide en el teléfono (sección 5).
- Botón principal de 56 px con degradado ámbar; botones de vidrio de 48–52 px.
- **Selector segmentado** (una pista con tres segmentos) para nivel, tema y tipo de carta, con el color activo de cada nivel.
- Chips de modo con ícono.
- **Avatares de iniciales:** un círculo de color con la inicial del jugador, generado en local. No hay fotos ni imágenes externas.

### 2.2 Pantalla por pantalla

| Pantalla | Se adopta | Se adapta |
|---|---|---|
| Inicio | Título grande, mazo apilado con carta real y etiqueta de tipo, botón principal, fila Cita / Mis cartas / Ajustes | El selector Suave/Picante/Extremo de la barra superior solo cambia la atmósfera de la portada; el nivel real se elige al configurar [S: confirmar si se quiere] |
| Jugadores | Filas píldora con check, avatar, nombre, **género y "le atraen" como sublíneas**, editar y quitar, botón + | — |
| Configurar | Avatares en "Juegan esta noche", chips de modo con ícono, segmentado de nivel con su texto de ayuda, castigo con chips | "Si no respondes" como subtítulo del castigo (es exactamente su efecto) |
| Turno | Nombre grande, tres opciones como filas con ícono y una línea de descripción, Al azar destacado | El indicador "Ronda N · Nivel" usa el número de ronda real del motor |
| Al azar | Tres estados: girando, frenando y resultado | Entra en la animación actual (`RandomReveal`), que ya escenifica la decisión del motor. Stitch agrega **"Parar ruleta"** (frenar a mano) y **"Revelar pregunta"** (un paso antes de ver la carta): se adoptan, porque no cambian el resultado del motor |
| Carta personal | Etiqueta de tipo, nombre, carta grande con texto entre comillas, anillo de cuenta con degradado y "SEG", Cumplió / Pasar / Otra carta | **"Pausar cuenta"**: se agrega al hook de cuenta regresiva |
| Carta grupal | Encabezado "Para todos", carta con etiqueta de modo | Línea de regla **"Si lo hiciste, bebe 1 trago"** solo cuando el castigo es tragos [S: valor fijo de 1 o el configurado] |
| Aviso de deshacer | Píldora "Turno anterior: Beto bebe 2 tragos · Deshacer" | Reestiliza el aviso actual de la fase A |
| Menú y terminar | Hojas inferiores con filas de jugador con avatar, segmentado de nivel y acciones | — |
| Mis cartas | Lista de cartas con chips de tipo y nivel, formulario con segmentados | El segmentado de tipo muestra Verdad / Reto / Grupal en Stitch; la app tiene 5 tipos, así que va un segmentado de 5 o un selector [S] |
| Ajustes | Segmentado de tema con íconos, filas de acción, aviso de respaldo, créditos | Los créditos pasan a decir Inter |
| Modo cita | Las 5 pantallas: atmósfera magenta, IOS en mosaico, tarjeta de pregunta, "Para quien escucha" con ícono, resultado en dos tarjetas | El historial de citas **no** se muestra (fase B del plan v2), aunque Stitch lo dibuja |

---

## 3. Qué se descarta y por qué

| Elemento de Stitch | Motivo |
|---|---|
| "Más de 120.000 rondas jugadas esta semana", "4 jugadores observando", "Amigos en la mesa", "3 amigos listos" | Datos falsos de comunidad; la app es local, sin red ni cuentas |
| "v2.4 (Build 412)", "Sincronizado local", "Ronda Game" | Versión y estado inventados |
| "98% atrevidos", "Cuestión #14", "Tensión 85%", "Velocidad 320 rpm" | Métricas sin dato detrás. La tensión vuelve con datos reales en la fase E (mood) |
| Puntos, "Recompensa +50", "+2 pts", "Reto épico", "Dificultad Nivel 3" | Marcador fuera de la v1 (spec, sección 2) |
| "Girar otra vez (-1 comodín)" | Requiere un sistema de comodines que no existe. Se puede retomar junto a la evasión (fase C) |
| Botón de perfil, menú "⋮" sin función | La app no tiene cuentas |
| "Turnos aleatorios", "Filtro sin tabúes", "Modo Picante Activo · Intenso" en Jugadores | Opciones que el motor no tiene |
| "Momentos de la mesa" (galería de capturas), "Altavoz activado", micrófono, audio, marcador de página en la carta de cita | Funciones inexistentes |
| "36 preguntas para enamorarse (A. Aron)", "Fase 1 · Afinidades", "Atmósferas del recorrido" | Títulos que el paper no usa. La atribución correcta sigue siendo la del acuerdo previo y el resultado |
| Imágenes de `lh3.googleusercontent.com` | Externas y ajenas; prohibidas por la CSP |

---

## 4. Fases del rediseño

| Fase | Contenido | Verificación |
|---|---|---|
| **R1. Fundación** | Tokens (color, tipo, radios, espaciado), Inter servida en la app, material de vidrio, botones, chips, segmentado, avatares de iniciales, íconos nuevos, aurora con los colores nuevos, tema claro derivado. Kit visual actualizado | Test de arquitectura; capturas del Kit en los 3 niveles × 2 temas; contraste del texto ≥ 4,5:1 sobre el vidrio |
| **R2. Inicio, Jugadores y Configurar** | Las tres pantallas con sus componentes nuevos | E2E existentes (los selectores son `data-testid`); capturas comparadas con las de Stitch |
| **R3. Partida** | Turno, Al azar en tres estados con "Parar ruleta" y "Revelar pregunta", carta personal con anillo nuevo y pausa, carta grupal, aviso de deshacer, menú y confirmar | Tests de la ruleta (el resultado mostrado es siempre el del motor) y del hook de pausa; E2E |
| **R4. Mis cartas, Ajustes y Modo cita** | Las pantallas restantes, con el historial de citas ya oculto (incluye la fase B de v2) | E2E; capturas |
| **R5. Cierre** | Nueva carpeta `capturas/redisenio/` con cada pantalla junto a su referencia de Stitch; `npm run apk`; prueba en tu teléfono | Revisión visual tuya |

**Orden respecto al plan v2:** el rediseño va **antes** de las fases C a F. Esas fases agregan pantallas nuevas (evasión, sugerencias, Verdad o reto en pareja) y conviene construirlas directamente en el sistema nuevo. La fase B de v2 entra en R4.

---

## 5. Riesgos

- **Rendimiento:** el blur de 28 px con saturación de 190 % sobre una aurora animada es más caro que el actual (22 px). Se mide en tu teléfono con la recarga en vivo de `npm run live:android`. Si hay tirones, se baja el blur de los elementos secundarios y se deja el de 28 px solo en la carta.
- **Personalidad tipográfica:** Inter es más neutra que Bricolage. El diseño la compensa con pesos 800 e interletrado negativo; se respeta tal cual, porque es tu diseño.
- **Contraste:** `on-surface-variant` (`#ddc1b5`) sobre vidrio claro puede quedar justo. Se verifica en R1.
- **Texto en mayúsculas pequeñas** ("RESULTADO OFICIAL", "MODO AL AZAR", "PARA TODOS"): es parte del diseño y se respeta, con textos reales.

## 6. Preguntas abiertas

1. ¿El selector de nivel de la portada solo cambia la atmósfera, o también preselecciona el nivel al configurar la partida? Propuesta: lo preselecciona.
2. Carta grupal con tragos: ¿"bebe 1 trago" fijo o la cantidad configurada en el castigo? Propuesta: la configurada.
3. Mis cartas: ¿segmentado con los 5 tipos o selector desplegable? Propuesta: segmentado de dos filas.
