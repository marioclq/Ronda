#!/usr/bin/env bash
# Builds capturas/redisenio/comparativas: each Stitch reference (left) next to the app (right), same height.
# Run after: SHOTS_DIR=capturas/redisenio npx playwright test tests/e2e/screenshots.spec.ts
set -euo pipefail
stitch="Redesign/stitch_liquid_glass_interface_redesign"
shots="capturas/redisenio/oscuro"
out="capturas/redisenio/comparativas"
mkdir -p "$out"

pair() {
  local name="$1" reference="$2" app="$3"
  [ -f "$stitch/$reference/screen.png" ] || { echo "Missing Stitch reference: $stitch/$reference/screen.png" >&2; exit 1; }
  [ -f "$shots/$app.png" ] || { echo "Missing app screenshot: $shots/$app.png" >&2; exit 1; }
  ffmpeg -loglevel error -y -i "$stitch/$reference/screen.png" -i "$shots/$app.png" \
    -filter_complex "[0]scale=-2:1600[a];[1]scale=-2:1600[b];[a]pad=iw+40:ih:0:0:color=black[a2];[a2][b]hstack=inputs=2" \
    "$out/$name.png"
  echo "$out/$name.png"
}

pair 01-inicio ronda_inicio_liquid_glass 01-inicio-primera-vez
pair 02-jugadores ronda_gesti_n_de_jugadores 04-jugadores-lista
pair 03-configurar ronda_configurar_partida 09-configurar-castigo-tragos
pair 04-turno ronda_turno_de_juego 10-turno-eleccion
pair 05-al-azar-girando ronda_ruleta_girando_activa 11-al-azar-girando
pair 06-al-azar-frenando ronda_desaceleraci_n_y_resultado_victorioso 12-al-azar-frenando
pair 07-al-azar-resultado ronda_ruleta_al_azar 13-al-azar-resultado
pair 08-carta-con-cuenta ronda_carta_de_reto_y_temporizador 20-reto-cuenta-corriendo
pair 09-carta-grupal ronda_carta_grupal_yo_nunca 26-carta-grupal-yo-nunca
pair 10-menu ronda_modal_men_de_partida 22-menu-partida
pair 11-terminar ronda_modal_confirmaci_n_de_abandono 23-menu-terminar-confirmar
pair 12-mis-cartas ronda_mis_cartas_personalizadas 28-mis-cartas-con-una
pair 13-ajustes ronda_ajustes_generales 29-ajustes
pair 14-cita-configurar ronda_modo_cita_configuraci_n_e_historial 30-cita-configurar
pair 15-cita-acuerdo ronda_modo_cita_acuerdo_previo 31-cita-acuerdo
pair 16-cita-cercania ronda_modo_cita_test_de_cercan_a 32-cita-cercania-antes
pair 17-cita-pregunta ronda_modo_cita_preguntas 33-cita-pregunta-1
pair 18-cita-resultado ronda_modo_cita_resultados_finales 36-cita-resultado
