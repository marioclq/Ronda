# Benchmark: apps de verdad o reto y juegos de fiesta

Fecha: 2026-11-09. Objetivo: una app de preguntas para grupos (verdad o reto y
similares) que resuelva los dos problemas detectados: **pagar para avanzar de
nivel** y **poca variedad de preguntas**.

Leyenda: **[V]** verificado en la ficha de la tienda o en el archivo,
**[I]** inferido de lo verificado, **[S]** supuesto o fuente poco fiable.

---

## 1. Apps analizadas

Datos sacados de las fichas de App Store el 2026-11-09. Las fichas de Google
Play no se pudieron leer con la herramienta (la página llega vacía), así que
para Android solo hay datos de terceros.

| App | Desarrollador | Calificación | Edad | Español | Modelo de cobro | Volumen declarado | Última versión |
|---|---|---|---|---|---|---|---|
| [Picolo](https://apps.apple.com/mx/app/id1001473964) | Marmelapp | 4.8 (7.2 mil) | 18+ | Sí, +13 idiomas | Suscripción semanal (3 días de prueba), mensual y anual: $89 a $889 MXN. Packs sueltos de $89 MXN (Caliente, Getting Crazy, War, Bar) | No dice | 2.3.1, 07/03/2023 [V] |
| [Truth or Dare](https://apps.apple.com/us/app/id591799686) | Vanilla b.v. | 4.6 (1.6 mil) | 16+ | Sí, +19 idiomas | Suscripción de $4.99 a $9.99, "Unlock All" $6.99, packs de $2.99 (Extreme, Naughty Couples) | "2,000+" verdades y retos | 4.0.3 [V] |
| [Partybus · Verdad o Reto](https://apps.apple.com/mx/app/id1625682712) | Panja | 4.3 (91) | 18+ | Sí, +10 idiomas | Suscripción semanal de $199 MXN, anual de $499 a $999 MXN, Party Pass de $89 MXN | No dice | 3.0.0 [V] |
| [Truth or Dare: Party Games](https://apps.apple.com/us/app/id1136805338) | August Bjornberg | 4.7 (1.4 mil) | 18+ | **No**, solo inglés | Pago único por modo, $2.99 cada uno, sin suscripción | "Over 1000" | 7.2 [V] |
| [Yo Nunca: Juego de Preguntas](https://apps.apple.com/es/app/id1473100410) | Pablo Rodríguez Lepe | 4.2 (132) | 13+ | Sí, +11 idiomas | Premium de 3,99 € y extras de 0,99 € (más verdades, más retos, quitar anuncios) | ">1,000" más ">2,000" nuevas | 58.0, 28/01/2025 [V] |
| Verdad o Reto (Drunken Ducks, Android) | Drunken Ducks | 4.51 (7.5 mil) | — | Sí | Con anuncios | — | ~1.8 M instalaciones según [AppGoblin](https://appgoblin.info/apps/com.drunkenducks.truthdarespanish) [S] |
| Truth or Dare AI | — | — | — | — | Gratis, genera preguntas en línea con IA | Sin mazo fijo | Fuente: su propio ranking [S] |

Los precios de las fichas de México no indican moneda. Que sean MXN se infiere
por la tienda. [I]

### Modos de juego que ofrece el mercado [V]
Verdad o reto, Yo nunca, ¿Qué prefieres?, Lo más probable, Paranoia, ruleta o
botella, modo cartas, "Farol" y "Bomba" (Partybus), modos por público (niños,
adolescentes, amigos, pareja, fiesta con alcohol) y niveles de intensidad.

---

## 2. Qué se queja la gente

| Queja | Evidencia |
|---|---|
| **Cobro agresivo / no se puede jugar sin pagar** | Partybus: "cuesta unos 200 por semana o no se puede usar sin pagar" y cobros después de cancelar. Picolo: cobros que el usuario no recuerda y suscripción que no puede cancelar. [V] |
| **Preguntas repetidas** | Reseña de Vanilla: "Some of the truths/dares keep repeating" ([appfollow](https://apps.appfollow.io/ios/truth-or-dare/591799686?country=us)). [V] El ranking de Truth or Dare AI cita "So few questions — gets old quick" y un pack extremo que repite unos pocos retos. [S] |
| **Anuncios en cada ronda** | Citado para "Truth Or Dare : Party Game" (44 mil calificaciones) y para "Dirty Game". [S] |
| **Contenido que no corresponde al modo** | Vanilla: el modo niños tenía lenguaje inapropiado (reseña de 2019). [V] |
| **Reparto desigual entre jugadores** | Partybus: preguntas repartidas de forma desigual. [S] |
| **No se pueden crear preguntas propias** | Pedido en reseñas de Vanilla y de "Truth or Dare Game". [V]/[S] |
| **Apps abandonadas** | La última actualización de Picolo en App Store es de 2023. [V] |

**Lectura [I]:** las apps grandes tienen entre 1 000 y 2 000 cartas *en total*,
repartidas entre varios modos y niveles, y la mayoría queda detrás del pago. Lo
que juega un grupo gratis en un modo y nivel concretos son, probablemente, unas
pocas decenas o cientos de cartas. Por eso se repiten en la segunda noche.

---

## 3. Fuentes de preguntas

| Fuente | Qué tiene | Licencia | ¿Sirve? |
|---|---|---|---|
| [itsbrunodev/party-game-sentences](https://github.com/itsbrunodev/party-game-sentences) | 45 000 frases, **casi todas trivia**. Para juegos de fiesta solo trae 181 verdades, 187 retos, 444 de "yo nunca" y 388 de "¿qué prefieres?". En inglés, sin nivel de intensidad. Último cambio en 2023-12. | **MIT** [V] | Como semilla: se traduce y adapta. Es poco volumen. |
| [OpenTriviaQA](https://github.com/uberspot/OpenTriviaQA) | Trivia (origen de la parte de trivia anterior) | No verificada | Solo si se agrega un modo trivia |
| [API truthordarebot](https://docs.truthordarebot.xyz/api-docs) | Verdad, reto, ¿qué prefieres?, yo nunca, paranoia. Niveles `pg`, `pg13` y `r`. Límite de 5 peticiones cada 5 s. | **No declarada** [V] | **No.** Sin licencia no se puede copiar su contenido, y exige internet. |
| [APIVerve Truth or Dare](https://docs.apiverve.com/ref/truthordare) | API de pago con "400+" prompts | MIT solo el *wrapper*, no el contenido [S] | No: es poco, requiere clave y red |
| Apps de la competencia | Sus mazos | Con derechos de autor [S] | **No copiar ni extraer.** |
| Repos en español de "yo nunca" | No se encontró ninguno con datos útiles | — | — |

**Conclusión:** no existe una fuente abierta en español con el volumen
necesario. La variedad hay que construirla.

### Recomendación: corpus propio en español, generado y curado antes de publicar

1. **Generar con un LLM en el momento de construir la app, no durante la
   partida.** Se generan lotes por modo, público e intensidad, se revisan a mano y
   se publican como archivos JSON dentro de la app. La app funciona sin internet,
   como GymMane, y el contenido es propio, sin problemas de licencia.
2. **Semilla:** traducir y adaptar las ~1 200 frases de juego del dataset MIT, con
   atribución en `CREDITS.md`.
3. **Plantillas con variables** para multiplicar la variedad sin perder control:
   `"{jugador}, imita a {otro_jugador} durante una ronda"`. Con 6 jugadores, una
   plantilla da 30 combinaciones distintas. [I]
4. **Cartas propias de los usuarios** y **packs compartibles** (exportar e
   importar JSON, o por QR) desde la primera versión.
5. **Validación automática en tests:** sin duplicados ni casi duplicados, cada
   carta con modo, público e intensidad válidos, sin palabras prohibidas en los
   niveles para menores, y todas las variables `{…}` resueltas.

**Cuánto volumen hace falta [I]:** con una carta cada ~40 s salen unas 90 por
hora, unas 270 en una noche de 3 horas. Para jugar unas 10 noches sin repetir en
el mismo modo y nivel hacen falta ~2 500 cartas en esa combinación. Una meta
razonable para el lanzamiento es **≥500 cartas por combinación principal** (verdad
y reto en los niveles suave y picante, yo nunca, ¿qué prefieres?), y
**≥2 000** a mediano plazo.

---

## 4. Requerimientos

### Clásicos (lo que todas tienen y no puede faltar)
- Lista de jugadores con nombres. Agregar o quitar jugadores en mitad de la
  partida.
- Modo "pasar el teléfono": un solo dispositivo y turnos automáticos.
- Elegir entre verdad y reto, con opción de aleatorio.
- Modos: **Verdad o reto, Yo nunca, ¿Qué prefieres?, Lo más probable, Paranoia**.
- Públicos: amigos, pareja, familia, fiesta (con tragos opcionales).
- Niveles de intensidad: suave, picante y extremo, con confirmación de edad para
  +18.
- Saltar una carta con castigo configurable (beber, prenda o punto).
- Temporizador para retos con tiempo.
- Ruleta o botella para elegir jugador.
- Idioma español y tema oscuro.

### Diferenciales (los dos dolores detectados)
| Dolor | Requerimiento |
|---|---|
| Pagar por niveles | **Todos los modos y niveles gratis.** Sin suscripción ni packs bloqueados. Apoyo voluntario por donaciones (modelo GymMane). Sin anuncios. |
| Poca variedad | Corpus grande y propio (sección 3), plantillas con variables, cartas propias, packs compartibles. |
| Repetición | **Historial persistente entre partidas:** cada carta guarda cuándo se vio por última vez y se sortea dando preferencia a las menos recientes. No se repite una carta mientras queden otras sin ver en ese modo y nivel. |
| Reparto desigual | Turnos equilibrados: nadie repite turno antes que el resto, y se balancea la proporción de verdades y retos por jugador. |
| Contenido fuera de lugar | Cada carta con su público e intensidad. Los modos de niños y familia nunca sacan cartas de otro nivel (lo garantiza un test). |
| Apps abandonadas | Código abierto y contenido en archivos que cualquiera puede ampliar con un PR. |

### Principios heredados de GymMane y Square
- Sin conexión, sin cuenta y sin analíticas. Los datos (jugadores, historial,
  cartas propias) se quedan en el teléfono.
- Contenido como datos (`assets/packs/*.json`), no como código.
- Un test que obligue a traducir todos los textos de la interfaz.
- Tests de las reglas: anti-repetición, turnos equilibrados y filtros por
  intensidad.

### Modelo de carta propuesto
```json
{
  "id": "tod-truth-0412",
  "mode": "truth",
  "audience": ["friends", "party"],
  "intensity": 2,
  "text": "¿Cuál es la excusa más absurda que le diste a {otro_jugador}?",
  "tags": ["confesiones"],
  "lang": "es"
}
```

---

## 5. Restricciones de distribución

- **Google Play** prohíbe apps que "contengan o promuevan contenido sexual o
  groserías", y eso alcanza también la ficha de la tienda
  ([Política de Google Play](https://support.google.com/googleplay/android-developer/answer/9878810)). [V]
  Un nivel "picante" tiene que ser sugerente, no explícito. Cómo se aplica esto
  a juegos de fiesta concretos no está documentado. [S]
- **F-Droid** marca con la anti-característica **NSFW** las apps que en la mayoría
  de los países pedirían verificación de edad. Esa definición está en revisión
  desde octubre de 2025
  ([blog de F-Droid](https://fdroid.gitlab.io/jekyll-fdroid/2025/10/21/navigating-the-digital-markets-act-digital-services-act-and-the-online-safety-act.html)). [S]
- **Inferencia [I]:** publicar la app base en Play con niveles suave y picante
  moderados. El contenido extremo, si se hace, iría como pack importable aparte.

Esto no es asesoría legal sobre derechos de autor ni sobre políticas de las
tiendas. Antes de publicar conviene leer las políticas vigentes.
