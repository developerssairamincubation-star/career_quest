#!/bin/sh
# Lays a transparent island render over the site's light sky gradient for previewing.
# usage: composite.sh in.png out.jpg
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$1")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$1")
ffmpeg -v error -y -f lavfi -i "color=c=white:s=${W}x${H},format=rgb24,geq=r='252-(252-208)*pow(1-Y/H\,1.6)':g='246-(246-228)*pow(1-Y/H\,1.6)':b='236-(236-243)*pow(1-Y/H\,1.6)'" \
  -i "$1" -filter_complex "[0][1]overlay" -frames:v 1 -q:v 2 "$2"
