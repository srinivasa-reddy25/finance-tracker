#!/usr/bin/env bash
# Grade the master, bake the poster into frame 0, mux the soundtrack, encode for sharing.
set -euo pipefail
cd "$(dirname "$0")"
OUT=..
POSTER_T=${POSTER_T:-22.9}
VBITRATE=${VBITRATE:-16M}

# Film grade (RGB): gentle S-curve with lifted blacks, warm highlights, faintly teal shadows, soft vignette.
GRADE="format=gbrp,\
colorbalance=rs=-0.006:gs=0.0:bs=0.006:rh=0.01:gh=0.0:bh=-0.006,\
curves=master='0/0.018 0.22/0.208 0.5/0.505 0.8/0.812 1/0.995',\
eq=saturation=1.05,\
vignette=angle=0.16:mode=forward"
TO709="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
GRAIN="noise=c0s=4:c0f=t:c1s=0:c2s=0"

# poster: strongest settled frame, graded, kept in RGB
ffmpeg -y -loglevel error -ss "$POSTER_T" -i render/master.mp4 -frames:v 1 -vf "$GRADE,format=rgb24" render/poster.png
ffmpeg -y -loglevel error -i render/poster.png -q:v 1 "$OUT/brag.jpg"

# final: grade, poster replaces frame 0 (duration and sync unchanged), luma grain, two-pass H.264 + AAC
FC="[0:v]$GRADE[m];[1:v]format=gbrp[p];[m][p]overlay=enable='eq(n,0)'[o];[o]$TO709,$GRAIN[v]"
COMMON=(-map "[v]" -c:v libx264 -preset slow -b:v "$VBITRATE" -maxrate 24M -bufsize 32M -profile:v high -level 4.2 -pix_fmt yuv420p -r 60
  -colorspace bt709 -color_primaries bt709 -color_trc bt709)
ffmpeg -y -loglevel error -i render/master.mp4 -i render/poster.png -filter_complex "$FC" "${COMMON[@]}" \
  -pass 1 -passlogfile render/x264 -an -f mp4 /dev/null
ffmpeg -y -loglevel error -i render/master.mp4 -i render/poster.png -i audio/soundtrack.wav -filter_complex "$FC" "${COMMON[@]}" \
  -pass 2 -passlogfile render/x264 -map 2:a -c:a aac -b:a 256k -ar 48000 -movflags +faststart -t 24 "$OUT/brag.mp4"

ffprobe -v error -show_entries format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate -of compact "$OUT/brag.mp4"
