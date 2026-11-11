#!/bin/sh
# Converts rendered sequence frames (art/renders/seq/<house>/fNNN.png, transparent) into the
# WebP frames the landing page scrubs through (public/islands/<house>/fNNN.webp).
# usage: export_frames.sh [house ...]   (default: all four)
cd "$(dirname "$0")/../.." || exit 1
for h in ${@:-veera vaaranam varunaa vimaana}; do
  mkdir -p "public/islands/$h"
  for png in art/renders/seq/"$h"/f*.png; do
    [ -e "$png" ] || continue
    out="public/islands/$h/$(basename "$png" .png).webp"
    [ "$out" -nt "$png" ] && continue
    cwebp -quiet -q 78 -alpha_q 85 -m 6 "$png" -o "$out"
  done
  echo "$h: $(ls public/islands/"$h" | wc -l | tr -d ' ') frames, $(du -sh public/islands/"$h" | cut -f1)"
done
