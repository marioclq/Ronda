# Guía de contenido

Juego para adultos que se conocen, pasando un teléfono. Cada carta se lee en voz alta. Español neutro: sin modismos de un país, "tú" (no "vos" ni "usted"), "celular" en lugar de "móvil".

## Reglas duras (todas las cartas)

- Nada peligroso, ilegal ni humillante. Nada que involucre a menores, manejar, armas, autolesión ni salir de la casa.
- El alcohol solo aparece como castigo (lo pone la app). Ninguna carta menciona beber, tragos ni marcas de bebida. Nada de drogas.
- Nada que se burle del cuerpo, peso, raza, religión, orientación ni discapacidad de nadie.
- Nada que pida datos reales sensibles: contraseñas, direcciones, dinero, documentos.
- Los retos se hacen en la sala, en menos de dos minutos, sin romper nada y sin gastar dinero. El celular de cada quien se usa solo si el reto lo dice y sin publicar nada.
- Todo contacto físico con otra persona usa `{compatible}` y lleva la etiqueta `contacto`. Coquetear con alguien también usa `{compatible}`.
- Nada no consentido. Ningún reto obliga a desnudarse (quitarse una prenda es un castigo que pone la app).

## Variables

- `{jugador}`: quien tiene el turno. Úsala poco: la carta ya se le lee a esa persona.
- `{otro}`: otro jugador cualquiera. Para imitar, preguntar, elegir o hacer algo junto a alguien sin carga romántica.
- `{compatible}`: alguien que se siente atraído mutuamente. Solo para coqueteo o contacto.
- Las cartas de grupo (Yo nunca, ¿Qué prefieres?, Lo más probable) no llevan variables.

## Formato por tipo

- **Verdad:** una pregunta que se pueda contestar en voz alta en menos de un minuto. Empieza con "¿" y termina con "?".
- **Reto:** una instrucción en imperativo. Si la duración importa, `timerSeconds` entre 10 y 120. Sin tiempo si no hace falta.
- **Yo nunca:** empieza con "Yo nunca" y describe una experiencia concreta que algunos sí habrán vivido.
- **¿Qué prefieres?:** "¿Qué prefieres: A o B?" Dos opciones parejas, ninguna obvia.
- **Lo más probable:** pregunta al grupo quién es más probable que haga algo. Variar el inicio: "¿Quién de aquí…?", "¿Quién sería el primero en…?", "¿Quién tiene más pinta de…?", "Señalen a quien…". No repetir el mismo inicio más de un tercio del lote.

## Tono por nivel

- **Suave:** apto para cualquier reunión, incluso con compañeros de trabajo. Anécdotas, gustos, manías, vergüenzas leves, hipótesis absurdas. Nada romántico ni sexual.
- **Picante:** sugerente, nunca explícito. Citas, atracción, coqueteo, primeras veces románticas, celos, exes, besos. Se puede insinuar; no se describe nada sexual.
- **Extremo (solo adultos, tras confirmar +18):** temas sexuales e íntimos entre adultos, en lenguaje directo pero no gráfico: experiencias, fantasías, preferencias, lugares, confesiones. Retos de seducción con `{compatible}` (miradas, susurros, bailes, besos en lugares no íntimos) con etiqueta `contacto`. Nunca describe actos sexuales con detalle, nunca exige desnudez ni tocar partes íntimas.

## Calidad

- Una idea por carta, máximo 25 palabras.
- Concreta: "¿Cuál es la peor excusa que inventaste para cancelar un plan?" mejor que "¿Alguna vez mentiste?".
- Variedad: dentro de un lote, no repetir la misma estructura o tema más de tres veces.
- Que provoque una historia o una risa, no un sí o un no.
