#!/usr/bin/env bash
# Codifica los PNG renderizados a los entregables web (sin audio) y un preview sobre el hero.
# Uso: ./codificar.sh   (después de ./render-hoja.sh 16x9 y ./render-hoja.sh 9x16)
set -euo pipefail
base="$(cd "$(dirname "$0")" && pwd)"
salida="$base/../../../public/video"
mkdir -p "$salida"
cd "$base/renders"
chrome="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
for c in 16x9 9x16; do
  ffmpeg -v error -y -framerate 30 -i "frames-$c/frame_%06d.png" -an -c:v libx264 -preset veryslow -crf 26 \
    -pix_fmt yuv420p -tune grain -movflags +faststart "$salida/hero-ola-$c.mp4"
  ffmpeg -v error -y -framerate 30 -i "frames-$c/frame_%06d.png" -an -c:v libvpx-vp9 -crf 40 -b:v 0 \
    -row-mt 1 -deadline good -cpu-used 1 -pix_fmt yuv420p "$salida/hero-ola-$c.webm"
  # Preview: plate del hero real (plate-hero.html, capturado con Chrome) + ola en screen + scrim negro/30,
  # en el mismo orden de capas que la web. 9:16 simula un móvil de 375 px de ancho (escala 1,92).
  [ "$c" = 16x9 ] && { ventana=1440,810; escala=1; } || { ventana=375,667; escala=1.92; }
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=$escala \
    --window-size=$ventana --screenshot="$(cygpath -m "$base/renders/plate-hero-$c.png")" \
    "file:///$(cygpath -m "$base/plate-hero.html")" 2>/dev/null
  [ "$c" = 16x9 ] && s=1440x810 || s=720x1280
  ffmpeg -v error -y -loop 1 -framerate 30 -t 2.4 -i "plate-hero-$c.png" \
    -framerate 30 -i "frames-$c/frame_%06d.png" \
    -filter_complex "[0:v]scale=$s,format=gbrp[p];[1:v]format=gbrp[w];[p][w]blend=all_mode=screen,colorchannelmixer=rr=0.7:gg=0.7:bb=0.7,format=yuv420p" \
    -c:v libx264 -crf 18 -an "preview-hero-$c.mp4"
  ffmpeg -v error -y -i "preview-hero-$c.mp4" -vf "select='not(mod(n\,6))',scale=${s%x*}/3:-1,tile=4x3:padding=4:color=gray" \
    -frames:v 1 "hoja-hero-$c.png"
done
ls -la "$salida"
