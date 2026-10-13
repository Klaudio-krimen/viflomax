#!/usr/bin/env bash
# Codifica los PNG renderizados a los entregables web (sin audio) y un preview sobre el hero.
# Uso: ./codificar.sh   (después de ./render-hoja.sh 16x9 y ./render-hoja.sh 9x16)
set -euo pipefail
base="$(cd "$(dirname "$0")" && pwd)"
salida="$base/../../../public/video"
mkdir -p "$salida"
cd "$base/renders"
for c in 16x9 9x16; do
  ffmpeg -v error -y -framerate 30 -i "frames-$c/frame_%06d.png" -an -c:v libx264 -preset veryslow -crf 26 \
    -pix_fmt yuv420p -tune grain -movflags +faststart "$salida/hero-ola-$c.mp4"
  ffmpeg -v error -y -framerate 30 -i "frames-$c/frame_%06d.png" -an -c:v libvpx-vp9 -crf 40 -b:v 0 \
    -row-mt 1 -deadline good -cpu-used 1 -pix_fmt yuv420p "$salida/hero-ola-$c.webm"
  # Preview: gradiente del hero + ola en screen + scrim negro/30, igual que en la web.
  w=${c%x*}; [ "$c" = 16x9 ] && s=1440x810 || s=720x1280
  W=${s%x*}; H=${s#*x}
  ffmpeg -v error -y -f lavfi -i "gradients=s=$s:c0=0x0d2f40:c1=0x2f9fd6:c2=0x6ab04c:nb_colors=3:x0=$W:y0=0:x1=0:y1=$H:speed=0:d=2.4:r=30,format=gbrp" \
    -framerate 30 -i "frames-$c/frame_%06d.png" \
    -filter_complex "[1:v]format=gbrp[w];[0:v][w]blend=all_mode=screen,colorchannelmixer=rr=0.7:gg=0.7:bb=0.7,format=yuv420p" \
    -c:v libx264 -crf 18 -an "preview-hero-$c.mp4"
done
ls -la "$salida"
