#!/usr/bin/env bash
# Renderiza un corte (16x9 | 9x16) a PNG y arma una hoja de contactos para revisar.
# Uso: ./render-hoja.sh 16x9 [ancho_miniatura]
set -euo pipefail
corte="$1"
base="$(cd "$(dirname "$0")" && pwd)"
cp "$base/ola.js" "$base/$corte/ola.js"   # ola.js es la única fuente; cada subproyecto recibe una copia
cd "$base/$corte"
rm -rf "../renders/frames-$corte"
mkdir -p ../renders
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.153 render --format png-sequence --output "../renders/frames-$corte" > "../renders/render-$corte.log" 2>&1
cd ../renders
ffmpeg -v error -y -framerate 30 -i "frames-$corte/frame_%06d.png" -vf "select='not(mod(n\,6))',scale=${2:-480}:-1,tile=4x3:padding=4:color=gray" -frames:v 1 "hoja-$corte.png"
echo "ok $(ls "frames-$corte" | wc -l) frames"
