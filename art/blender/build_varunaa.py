"""Varunaa (orca) — a waterfall pours from tall rocks into a deep pool where the orca swims;
the river runs across the island and spills off the edge as a second fall.

Run:  Blender -b --factory-startup -P art/blender/build_varunaa.py -- [draft|final]
"""
import bpy, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from mathutils import Vector, noise
from mathutils.geometry import intersect_point_line
from island_lib import (Island, reset, load, place, add_animal, scatter, smooth, ground_material, rock_material,
                        water_material, falls_material, foam_material, waterfall, island_water, center_base,
                        world_and_sun, camera, render)

scene, props = reset(23)
R0 = 11.0
POOL, POOL_R = Vector((0.6, 1.4)), 5.4
EXIT_ANGLE = math.radians(-100)                   # river leaves the island at the front, a little left
EXIT = Vector((math.cos(EXIT_ANGLE), math.sin(EXIT_ANGLE))) * R0 * 1.3
CH_W = 2.5                                        # river half-width
BASE = 1.6
WATER = 0.6
BACK = Vector((0.6, 7.4))                         # rock wall behind the pool


def to_channel(p):
    q, f = intersect_point_line(p, POOL, EXIT)
    f = min(1.0, max(0.0, f))
    return (p - (POOL + (EXIT - POOL) * f)).length


def top(x, y, t):
    p = Vector((x, y))
    h = BASE + 0.25 * noise.fractal(Vector((x / 5, y / 5, 7.7)), 0.6, 2.0, 4)
    h += 1.4 * math.exp(-((p - BACK).length / 3.2) ** 2)
    wob = 1 + 0.08 * noise.noise(Vector((x / 3, y / 3, 1.3)))
    pool_cut = 2.6 * (1 - smooth(0.5, 1.5, (p - POOL).length / (POOL_R * wob)))
    river_cut = 1.45 * (1 - smooth(0.4, 1.9, to_channel(p) / (CH_W * wob)))
    h -= max(pool_cut, river_cut)
    rim = max(0.0, (t - 0.9) / 0.1)
    return h - 0.35 * rim * rim


def cover(x, y, h, slope):
    return (1 - smooth(0.6, 1.0, slope)) * smooth(WATER + 0.55, WATER + 0.8, h)


isl = Island(R0, 12.0, top, cover, clearing=POOL, clear_r=POOL_R, shape_seed=6.0, tip_shift=(0.8, 0.8))
island = isl.build(scene)
island.data.materials.append(ground_material("forest_ground_04", "aerial_rocks_02", tint=(0.55, 0.78, 0.35),
                                             tint_amt=0.45, steep=(0.3, 0.5),
                                             shore=("coast_sand_05", WATER + 0.3, WATER + 0.6)))
island.data.materials.append(rock_material(sat=0.35, val=0.95, moss_amt=0.5))

water = water_material(deep=(0.35, 0.86, 0.84), wave_scale=0.9, density=0.35)
island_water(isl, WATER, water, "River")

grass_a, _ = load("grass_medium_01")
grass_b, _ = load("grass_medium_02")
sorrel, _ = load("shrub_sorrel_01")
fern, _ = load("fern_02")
scatter(island, "Grass A", grass_a, 85.0, "scatter", 1.2, 2.2, 13)
scatter(island, "Grass B", grass_b, 25.0, "scatter", 1.0, 1.7, 23)
scatter(island, "Sorrel", sorrel, 4.0, "scatter", 2.0, 3.2, 33)
scatter(island, "Ferns", fern, 0.6, "scatter", 0.8, 1.4, 43)

# tall rocks behind the pool, with a gap the upper fall pours through
_, cliff = load("namaqualand_cliff_01")
_, cland = load("coast_land_rocks_03")
_, rface = load("rock_face_01")
center_base(cliff[0])
gz = isl.surface_z(*BACK)
place(cliff[0], (-3.2, 7.4, gz - 1.8), math.radians(80), (0.75, 1.1, 1.65), props)
place(cliff[0], (4.6, 7.2, gz - 1.8), math.radians(-75), (0.75, 1.0, 1.5), props)
place(cliff[0], (0.7, 9.6, gz - 1.0), math.radians(5), (1.0, 1.0, 1.7), props)
place(rface[0], (-2.4, 5.6, gz - 1.4), 0.4, 0.6, props)
place(rface[0], (3.8, 5.4, gz - 1.4), 2.6, 0.6, props)
place(cland[0], (-6.6, 4.4, isl.surface_z(-6.6, 4.4) - 1.0), 0.8, 0.45, props)

FALL_TOP = Vector((0.7, 7.3, gz + 4.6))
fm = falls_material("Upper falls", fade_from=0.95)
waterfall("Upper falls", FALL_TOP, (0, -1), 2.0, FALL_TOP.z - WATER + 0.1, fm, curve=0.32, spread=0.35)
bpy.ops.mesh.primitive_circle_add(vertices=48, radius=1, fill_type="NGON", location=(0.7, 5.4, WATER + 0.02))
foam = bpy.context.object; foam.scale = (1.7, 1.0, 1); foam.data.materials.append(foam_material())

# the river spills over the rim and falls away beneath the island
lip_r = isl.radius(EXIT_ANGLE) * 0.99
lip = Vector((math.cos(EXIT_ANGLE) * lip_r, math.sin(EXIT_ANGLE) * lip_r, WATER))
waterfall("Edge falls", lip, (math.cos(EXIT_ANGLE), math.sin(EXIT_ANGLE)), CH_W * 1.6, 11.0,
          falls_material("Edge falls", fade_from=0.45), curve=0.45, spread=0.6)

# trees and rocks along the banks
_, t3 = load("island_tree_03", "1k")
_, t1 = load("island_tree_01", "1k")
_, sear = load("searsia_lucida", "1k")
for src, (x, y), rz, s in [(t3, (-5.0, 6.6), 0.5, 1.5), (t1, (5.8, 6.0), 1.2, 1.6), (t3, (-8.4, 1.4), 4.0, 1.3),
                           (t1, (8.0, 1.8), 3.6, 1.4), (t3, (6.4, -4.8), 5.2, 1.2), (t1, (-6.2, -5.4), 2.2, 1.2)]:
    if isl.surface_z(x, y) > WATER + 0.5:          # keep trees out of the water
        place(src[0], (x, y, isl.surface_z(x, y) - 0.1), rz, s, props)
for i, (x, y) in enumerate([(-6.6, -1.6), (7.4, -1.6), (-7.8, -3.2), (4.4, -8.0), (-6.8, 4.0), (7.6, -5.6)]):
    if isl.surface_z(x, y) > WATER + 0.5:
        place(sear[i % len(sear)], (x, y, isl.surface_z(x, y) - 0.05), random.uniform(0, 6.3), 1.2, props)
_, c5 = load("coast_rocks_05")
_, bould = load("boulder_01")
for f, side in [(0.35, 1), (0.5, -1), (0.62, 1), (0.75, -1)]:
    c = POOL + (EXIT - POOL) * f * 0.62
    n = Vector((-(EXIT - POOL).y, (EXIT - POOL).x)).normalized() * side * (CH_W + 0.2)
    x, y = c + n
    place(c5[0], (x, y, WATER - 0.4), random.uniform(0, 6.3), random.uniform(0.3, 0.45), props)
for a in (0.4, 1.3, 2.6, 3.5):
    x, y = POOL.x + math.cos(a) * POOL_R * 1.02, POOL.y + math.sin(a) * POOL_R * 0.95
    place(bould[0], (x, y, WATER - 0.5), random.uniform(0, 6.3), 0.6, props)

# the orca breaches: nose up, front half clear of the water, a ring of foam where it breaks the surface
HEAD = math.radians(-145)
orca = add_animal("killer_whale", "Take 001", 20, 6.2, (POOL.x - 0.4, POOL.y - 0.4, WATER + 1.1), HEAD,
           forward=(0, -1), pitch=math.radians(38), ground=False)
back = Vector((math.cos(HEAD), math.sin(HEAD))) * -1.6
bpy.ops.mesh.primitive_circle_add(vertices=48, radius=1, fill_type="NGON",
                                  location=(POOL.x - 0.4 + back.x, POOL.y - 0.4 + back.y, WATER + 0.03))
splash = bpy.context.object; splash.scale = (2.2, 1.6, 1); splash.rotation_euler.z = HEAD
splash.data.materials.append(foam.data.materials[0])

world_and_sun()
camera((20.0, -46.0, 18.5), (0.4, 0.0, -1.6))


def step(i, t):
    """The orca surges up out of the pool and into the leap held in the still."""
    bpy.context.scene.frame_set(1 + (i * 2) % 48)
    h = Vector((math.cos(HEAD), math.sin(HEAD)))
    if t <= 0.75:
        u = t / 0.75
        e = 1 - (1 - u) ** 2
        z, pitch, ahead = WATER - 1.8 + 2.9 * e, 60 - 22 * u, -1.5 + 1.5 * u
    else:
        u = (t - 0.75) / 0.25
        z, pitch, ahead = WATER + 1.1 + 0.35 * u, 38 - 10 * u, 0.4 * u
    c = Vector((POOL.x - 0.4, POOL.y - 0.4)) + h * ahead
    orca.place((c.x, c.y, z), HEAD, math.radians(pitch), ground=False)
    grow = 0.4 + 0.6 * min(1.0, t / 0.5)
    splash.scale = (2.2 * grow, 1.6 * grow, 1)


render("varunaa", step)
