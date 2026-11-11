"""Veera (tiger) — rocky granite kopje with dry grass; the tiger roars from the front outcrop.

Run:  Blender -b --factory-startup -P art/blender/build_veera.py -- [draft|final]
"""
import bpy, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from mathutils import Vector, noise
from island_lib import (Island, reset, load, place, add_animal, summit, scatter, smooth, ground_material, center_base,
                        rock_material, tint_materials, world_and_sun, camera, render)

scene, props = reset(11)
OUTCROP = Vector((1.2, -2.8))        # tiger's rock, front-centre
PEAK, PEAK2 = Vector((-3.4, 4.6)), Vector((2.6, 5.8))


def top(x, y, t):
    p = Vector((x, y))
    h = 0.45 * (1 - t * t) + 0.3 * noise.fractal(Vector((x / 6, y / 6, 2.3)), 0.6, 2.0, 4)
    for c, height, sigma in ((PEAK, 2.6, 3.6), (PEAK2, 1.6, 2.8), (OUTCROP, 0.6, 2.0)):
        h += height * math.exp(-((p - c).length / sigma) ** 2)
    rim = max(0.0, (t - 0.9) / 0.1)
    return h - 0.35 * rim * rim


def cover(x, y, h, slope):
    return 1 - smooth(0.7, 1.15, slope)


isl = Island(10.0, 12.0, top, cover, clearing=OUTCROP, clear_r=2.2, shape_seed=3.0, tip_shift=(-0.8, 1.0))
island = isl.build(scene)
island.data.materials.append(ground_material("forest_ground_04", "aerial_rocks_02",
                                             tint=(0.78, 0.72, 0.42), tint_amt=0.45))
island.data.materials.append(rock_material(sat=0.55, val=0.9))

grass_a, ga = load("grass_medium_01")
grass_b, gb = load("grass_medium_02")
tint_materials(ga + gb, hue=0.44, sat=0.8, val=1.55)       # sun-dried grass of a dry forest
shrub2, _ = load("shrub_02")
bush, _ = load("wild_rooibos_bush")
scatter(island, "Grass A", grass_a, 100.0, "top", 1.4, 2.6, 12)
scatter(island, "Grass B", grass_b, 28.0, "top", 1.0, 1.8, 22)
scatter(island, "Bushes", bush, 0.3, "scatter", 0.7, 1.2, 42)
scatter(island, "Shrubs", shrub2, 0.08, "scatter", 0.7, 1.2, 52)

# granite crags: back ridge plus scattered tors
_, cliff = load("namaqualand_cliff_01")
place(cliff[0], (PEAK.x, PEAK.y, isl.surface_z(*PEAK) - 1.6), 0.6, (1.35, 1.25, 1.7), props)
place(cliff[0], (PEAK.x + 2.2, PEAK.y + 1.6, isl.surface_z(*PEAK) - 2.2), 2.4, (1.0, 1.0, 1.2), props)
place(cliff[0], (PEAK2.x, PEAK2.y, isl.surface_z(*PEAK2) - 1.6), 4.0, (0.9, 0.9, 1.0), props)
place(cliff[0], (-7.6, -2.4, isl.surface_z(-7.6, -2.4) - 1.2), 1.3, (0.5, 0.5, 0.6), props)
place(cliff[0], (6.6, 0.4, isl.surface_z(6.6, 0.4) - 1.4), 3.3, (0.55, 0.5, 0.7), props)
tor = cliff[0].copy(); tor.data = cliff[0].data.copy()     # same granite, centred for small tors
center_base(tor)
_, bould = load("boulder_01")
_, rocks = load("rock_moss_set_01")
for x, y, s in [(-4.6, -5.6, 0.3), (5.4, -5.0, 0.28), (-1.2, 2.6, 0.35)]:
    place(tor, (x, y, isl.surface_z(x, y) - 0.5), random.uniform(0, 6.3), (s, s, s * 1.1), props)
for i, (x, y) in enumerate([(5.6, -0.6), (-2.6, -1.0), (-8.4, 1.6), (2.0, -8.2), (8.6, 2.8), (-3.4, -7.4)]):
    place(rocks[i % len(rocks)], (x, y, isl.surface_z(x, y) - 0.25), random.uniform(0, 6.3), 0.7, props)

# the outcrop: stacked boulders with a flat-ish top for the tiger
ox, oy = OUTCROP
oz = isl.surface_z(ox, oy)
seat = place(tor, (ox, oy, oz - 0.5), 0.35, (0.5, 0.48, 0.72), props)
place(bould[0], (ox - 2.0, oy + 0.4, oz - 0.6), 2.2, 1.6, props)
place(bould[0], (ox + 1.9, oy + 0.8, oz - 0.7), 4.0, 1.4, props)
place(bould[0], (ox + 0.6, oy - 1.6, oz - 0.6), 1.1, 1.1, props)

_, t2 = load("island_tree_02", "1k")
_, sear = load("searsia_lucida", "1k")
for src, (x, y), rz, s in [(t2, (-6.6, 1.0), 0.4, 1.6), (t2, (6.8, 4.2), 2.0, 1.5), (t2, (-5.0, -3.6), 4.2, 1.2)]:
    place(src[0], (x, y, isl.surface_z(x, y) - 0.15), rz, s, props)
for i, (x, y) in enumerate([(-2.0, -6.0), (5.4, -3.2), (-7.4, 3.4), (0.4, 1.6), (7.6, -2.2)]):
    place(sear[i % len(sear)], (x, y, isl.surface_z(x, y) - 0.05), random.uniform(0, 6.3), 1.3, props)

bpy.context.view_layer.update()
sx, sy, sz = summit(seat, band=0.25)
tiger = add_animal("tiger_rebuilt", "Howl", 36, 4.2, (sx, sy, sz - 0.08), math.radians(-160), forward=(-1, 0))

world_and_sun()
camera((21.0, -48.0, 16.0), (0.2, 0.0, -0.6))


def step(i, t):
    bpy.context.scene.frame_set(round(4 + 58 * t))      # the roar builds as the page scrolls


render("veera", step)
