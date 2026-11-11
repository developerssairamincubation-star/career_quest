# Art credits

The landing-page island renders are built in Blender from these assets. The CC-BY animal
credits must appear on the published site (footer or an About/credits page).

## Animals (CC-BY-4.0, credit required)

- Tiger (Veera): "Tiger rebuilt" by kenchoo — https://sketchfab.com/3d-models/tiger-rebuilt-6b5d14b2de984ffcb00ee00e404ad208
- Elephant (Vaaranam): "African Elephant" by jimmyho905 — https://sketchfab.com/3d-models/african-elephant-b960467b14f34cfc84feeb3361a21f54
- Orca (Varunaa): "Killer Whale" by Abner Wu — https://sketchfab.com/3d-models/killer-whale-63b680d7e58f463a9868ed7bf163094a
- Eagle (Vimaana): "Bald Eagle" by ucdavisterc — https://sketchfab.com/3d-models/bald-eagle-8874cfcf83a54575ba8068376f8a63a8

Licence: http://creativecommons.org/licenses/by/4.0/ (commercial use allowed with credit).

## Environment (CC0, no credit required)

Trees, plants, rocks, ground textures and the sky HDRI are from Poly Haven (https://polyhaven.com),
released under CC0.

## Rebuilding

Source models go in `art/polyhaven/` and `art/animals/` (git-ignored). Each island is built by
`art/blender/build_<house>.py` on top of `art/blender/island_lib.py`:

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P art/blender/build_veera.py -- final
