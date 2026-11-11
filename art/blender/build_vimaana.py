"""Vimaana (eagle) — a tall sandstone spire with golden grass; the eagle lands on its nest at the summit.

Run:  Blender -b --factory-startup -P art/blender/build_vimaana.py -- [draft|final]
"""
import bpy, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from mathutils import Vector, noise
from island_lib import (Island, reset, load, place, add_animal, summit, scatter, smooth, ground_material,
                        rock_material, tint_materials, world_and_sun, camera, render)

scene, props = reset(31)
SPIRE = Vector((0.8, 1.2))


def top(x, y, t):
    p = Vector((x, y))
    h = 0.4 * (1 - t * t) + 0.3 * noise.fractal(Vector((x / 4, y / 4, 5.5)), 0.6, 2.0, 4)
    d = (p - SPIRE).length
    h += 1.4 * math.exp(-(d / 2.6) ** 2)                      # mound the spire rises from
    rim = max(0.0, (t - 0.9) / 0.1)
    return h - 0.35 * rim * rim


def cover(x, y, h, slope):
    return 1 - smooth(0.65, 1.1, slope)


isl = Island(7.0, 15.0, top, cover, clearing=SPIRE, clear_r=2.4, shape_seed=12.0,
             tip_shift=(1.6, 0.4), taper=0.8)
island = isl.build(scene)
island.data.materials.append(ground_material("forest_ground_04", "aerial_rocks_02", tint=(0.95, 0.78, 0.42),
                                             tint_amt=0.55, rock_sat=0.8, rock_val=1.05))
island.data.materials.append(rock_material(sat=0.75, val=0.95, hue=0.52, moss_amt=0.15,
                                           soil_tint=(0.7, 0.55, 0.38)))

grass, gobjs = load("grass_medium_01")
tint_materials(gobjs, hue=0.39, sat=0.9, val=1.9)          # dry golden grass
bush, bobjs = load("wild_rooibos_bush")
sorrel, _ = load("shrub_sorrel_01")
scatter(island, "Sorrel", sorrel, 3.0, "scatter", 2.0, 3.0, 34)
scatter(island, "Golden grass", grass, 70.0, "top", 1.2, 2.3, 14)
scatter(island, "Bushes", bush, 0.35, "scatter", 0.7, 1.2, 24)

_, t2 = load("island_tree_02", "1k")
place(t2[0], (-3.6, -1.6, isl.surface_z(-3.6, -1.6) - 0.15), 0.9, (1.5, 1.5, 1.7), props)
_, sear = load("searsia_lucida", "1k")
for i, (x, y) in enumerate([(-5.4, 1.2), (5.2, 0.6), (-1.6, -5.2), (3.0, 4.8)]):
    place(sear[i % len(sear)], (x, y, isl.surface_z(x, y) - 0.05), random.uniform(0, 6.3), 1.2, props)
_, quiver = load("quiver_tree_01", "1k")
place(quiver[0], (4.4, -2.8, isl.surface_z(4.4, -2.8) - 0.05), 2.0, 1.3, props)

_, b2 = load("boulder_01")
_, b4 = load("rock_moss_set_02")
_, cliff = load("namaqualand_cliff_01")
spire = place(cliff[0], (SPIRE.x, SPIRE.y, isl.surface_z(*SPIRE) - 1.2), 0.9, (0.75, 0.75, 1.55), props)
place(cliff[0], (SPIRE.x - 1.2, SPIRE.y + 0.9, isl.surface_z(*SPIRE) - 1.6), 2.9, (0.6, 0.6, 1.1), props)
bpy.context.view_layer.update()
for i, (x, y) in enumerate([(-4.8, 2.0), (2.6, -4.6), (5.4, 1.6), (-1.8, -5.0), (-5.6, -3.0), (3.0, 4.6)]):
    place((b2 + b4)[i % 2], (x, y, isl.surface_z(x, y) - 0.45), random.uniform(0, 6.3), random.uniform(0.35, 0.6), props)

# nest of dry branches in the summit cup
_, sticks = load("dry_branches_medium_01")
sx, sy, nest_z = summit(spire)
nest_z -= 0.15
for i in range(14):
    a = i / 14 * 2 * math.pi
    r = 0.55 + random.uniform(-0.08, 0.08)
    place(sticks[i % len(sticks)], (sx + math.cos(a) * r, sy + math.sin(a) * r, nest_z + 0.05 + 0.04 * (i % 3)),
          a + math.pi / 2 + random.uniform(-0.3, 0.3), 0.9, props, rot_xy=(random.uniform(-0.25, 0.25), 0.35))

eagle = add_animal("bald_eagle", "GltfAnimation 0", 20, 3.4, (sx + 5.6, sy + 2.0, nest_z + 0.6), math.radians(-160),
           forward=("SETUP-HAWK-SPINE_9", "SETUP-HAWK-HEAD_49"), pitch=math.radians(8), ground=False)

world_and_sun(sun_energy=4.2, sun_rot=(68, 0, -35), sun_colour=(1.0, 0.82, 0.58))   # golden hour
camera((21.0, -54.0, 12.0), (0.8, 0.0, -2.4))

P0 = Vector((sx + 11.0, sy + 5.5, nest_z + 3.2))
P1 = Vector((sx + 3.4, sy + 1.2, nest_z + 0.5))


def step(i, t):
    """The eagle glides in from the distance, beating its wings, and flares toward the nest."""
    bpy.context.scene.frame_set((i * 3) % 48)
    e = 1 - (1 - t) ** 2
    p = P0 + (P1 - P0) * e
    d = P1 - P0
    eagle.place(p, math.atan2(d.y, d.x), math.radians(5 + 20 * t * t), ground=False)


render("vimaana", step)
