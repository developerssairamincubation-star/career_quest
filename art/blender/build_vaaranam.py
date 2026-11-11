"""Vaaranam (elephant) — dense forest around a watering hole; the elephant drinks at its edge.

Run:  Blender -b --factory-startup -P art/blender/build_vaaranam.py -- [draft|final]
"""
import bpy, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from mathutils import Vector, noise
from island_lib import (Island, reset, load, place, add_animal, scatter, disc, smooth, ground_material,
                        rock_material, water_material, world_and_sun, camera, render)

scene, props = reset(7)
CLEARING = Vector((1.2, -2.8))
POND, POND_R = Vector((2.4, -3.0)), 2.6


def base(x, y, t):
    """Gentle dome, a hill behind for depth, flattened clearing."""
    h = 0.55 * (1 - t * t)
    h += 0.35 * noise.fractal(Vector((x / 6, y / 6, 0.3)), 0.6, 2.0, 4)
    h += 1.6 * math.exp(-((x + 1.5) ** 2 + (y - 5.0) ** 2) / 14)
    h += 0.6 * math.exp(-((x - 5.5) ** 2 + (y - 2.0) ** 2) / 6)
    d = (Vector((x, y)) - CLEARING).length
    return h * (1 - 0.7 * math.exp(-d * d / 8))


def top(x, y, t):
    h = base(x, y, t)
    h -= 0.9 * (1 - smooth(POND_R * 0.6, POND_R * 1.15, (Vector((x, y)) - POND).length))
    rim = max(0.0, (t - 0.9) / 0.1)
    return h - 0.35 * rim * rim


WATER = min(top(POND.x + POND_R * 1.15 * math.cos(a), POND.y + POND_R * 1.15 * math.sin(a), 0.5)
            for a in [i / 24 * 2 * math.pi for i in range(24)]) - 0.1


def cover(x, y, h, slope):
    return smooth(POND_R * 0.95, POND_R * 1.2, (Vector((x, y)) - POND).length)


isl = Island(9.5, 11.0, top, cover, clearing=CLEARING, clear_r=3.4)
island = isl.build(scene)
island.data.materials.append(ground_material("forest_ground_04", steep=(0.3, 0.5)))
island.data.materials.append(rock_material())
disc("Pond", POND, POND_R * 1.15, WATER, water_material(deep=(0.12, 0.36, 0.3)))

grass_a, _ = load("grass_medium_01")
grass_b, _ = load("grass_medium_02")
fern, _ = load("fern_02")
shrub2, _ = load("shrub_02")
shrub4, _ = load("shrub_04")
calathea, _ = load("calathea_orbifolia_01")
_, rocks1 = load("rock_moss_set_01")
_, rocks2 = load("rock_moss_set_02")
scatter(island, "Grass A", grass_a, 70.0, "top", 1.2, 2.2, 11)
scatter(island, "Grass B", grass_b, 28.0, "top", 1.0, 1.8, 21)
scatter(island, "Ferns", fern, 1.1, "scatter", 0.9, 1.7, 31)
scatter(island, "Calathea", calathea, 0.35, "scatter", 1.0, 1.6, 41)
scatter(island, "Shrubs", shrub2, 0.22, "scatter", 0.8, 1.4, 51)
scatter(island, "Shrub small", shrub4, 0.6, "scatter", 1.5, 2.6, 61)

# a full canopy around the back and sides, open to camera over the watering hole
_, t1 = load("island_tree_01", "1k")
_, t2 = load("island_tree_02", "1k")
_, t3 = load("island_tree_03", "1k")
_, t4 = load("tree_small_02", "1k")
_, pach = load("pachira_aquatica_01")
trees = [
    (t1, (-3.8, 3.6), 0.4, 1.9), (t2, (2.8, 5.2), 2.1, 2.1), (t4, (-6.6, -0.6), 1.2, 1.7),
    (t3, (6.2, 1.2), 3.0, 1.8), (t1, (0.2, 6.6), 4.4, 1.6), (t3, (-1.4, 1.4), 5.2, 1.5),
    (t4, (6.4, -4.4), 0.9, 1.3), (t2, (-5.6, 4.4), 1.8, 1.5),
    (t3, (3.6, 2.6), 2.6, 1.9), (t1, (-7.0, 2.2), 5.9, 1.4), (t2, (7.4, -1.0), 0.2, 1.3),
    (t4, (-2.8, 6.0), 3.3, 1.8), (t3, (-5.0, -4.4), 4.1, 1.2), (t1, (4.6, 5.4), 1.1, 1.7),
]
for src, (x, y), rz, s in trees:
    place(src[0], (x, y, isl.surface_z(x, y) - 0.15), rz, s, props)
for o in pach:
    place(o, (-3.6, -3.4, isl.surface_z(-3.6, -3.4)), 0.6, 1.3, props)

for i, (x, y) in enumerate([(-7.4, -3.0), (7.6, -1.8), (-2.0, -7.6), (4.0, -6.9), (7.3, 3.8), (-8.0, 2.4)]):
    src = (rocks1 + rocks2)[i % (len(rocks1) + len(rocks2))]
    place(src, (x, y, isl.surface_z(x, y) - 0.3), random.uniform(0, 6.3), random.uniform(0.5, 0.9), props)
for a in (2.2, 3.4, 4.6):                                # stones at the water's edge
    x, y = POND.x + math.cos(a) * POND_R * 1.05, POND.y + math.sin(a) * POND_R * 1.05
    place(rocks1[int(a) % len(rocks1)], (x, y, WATER - 0.15), a, 0.35, props)
_, log = load("dead_tree_trunk_02")
place(log[0], (-1.6, -5.4, isl.surface_z(-1.6, -5.4) + 0.05), 0.3, 0.8, props)

ex, ey = POND.x - POND_R * 1.3, POND.y + 0.4            # elephant on the pond's left bank
elephant = add_animal("african_elephant", "Roar", 22, 6.0, (ex, ey, isl.surface_z(ex, ey) - 0.1), math.radians(-25),
           forward=("RigPelvis_03_11", "RigHead_039_49"))

world_and_sun()
camera((19.5, -45.0, 15.5), (0.4, 0.0, -1.2))


def step(i, t):
    bpy.context.scene.frame_set(round(2 + 48 * t))      # raises its trunk and trumpets


render("vaaranam", step)
