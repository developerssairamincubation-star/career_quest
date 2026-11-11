"""Builds the four low-poly clan islands with their looping animations and exports public/clans/<house>.glb.

Run:  Blender -b --factory-startup -P art/lowpoly/build_clans.py -- [veera,vaaranam,varunaa,vimaana] [preview]
"""
import bpy, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from mathutils import Vector
from lowpoly_lib import *

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
WHICH = (ARGS[0] if ARGS else "veera,vaaranam,varunaa,vimaana").split(",")
PREVIEW = "preview" in ARGS
PREVIEW_DIR = os.path.join(ART, "renders", "lowpoly")

lum = lambda c: float(np.asarray(c) @ np.array([0.2126, 0.7152, 0.0722]))
rgb = lambda h: np.array(hexc(h)[:3])


def tiger_colours(c):
    l = lum(c)
    if l < 0.05: return rgb("#1f1a17")
    if l > 0.32: return rgb("#f1e6cf")
    return rgb("#e0782a") * (0.85 + 1.0 * l)


def elephant_colours(c):
    l = lum(c)
    return rgb("#efe6d2") if l > 0.45 else rgb("#6f7378") * (0.8 + 1.2 * min(l, 0.25))


def dolphin_colours(c):
    return rgb("#3b5f8f") if lum(c) < 0.08 else rgb("#d3dde7")


def bird_colours(head, tail, body="#4a3324", light="#f5f3ee"):
    """Eagle/gull colouring by position: white head and tail, yellow beak and feet, body tone elsewhere."""
    def f(c, pos):
        r, g, b = c
        if r > 0.25 and r > g * 1.2 and g > b * 1.6:          # yellow beak / talons
            return rgb("#e9b62e")
        if (pos - head).length < 0.24 * scale_ref[0] or pos.y > tail * scale_ref[0]:
            return rgb(light)
        return rgb(body) * (0.85 + 0.4 * min(lum(c), 0.4))
    return f


scale_ref = [1.0]


def animal(folder, size, colours, frame=0, **kw):
    arm, body = lowpoly_animal(folder, 1400, recolour=colours, **kw)
    rig = normalize(arm, body, size, frame)
    return arm, body, rig


def ground_props(radius, avoid, seed, trees=5, pines=0, bushes=8, rocks=6, top="grass", z_fn=lambda x, y: 0.0):
    rnd = random.Random(seed)
    scatter_on(lambda i: tree(f"tree{i}", rnd.uniform(2.6, 3.6), seed + i), trees, radius * 0.85, avoid, seed, z_fn=z_fn)
    scatter_on(lambda i: pine(f"pine{i}", rnd.uniform(2.8, 3.8), seed + 20 + i), pines, radius * 0.88, avoid, seed + 1, z_fn=z_fn)
    scatter_on(lambda i: bush(f"bush{i}", rnd.uniform(0.35, 0.6), seed + 40 + i), bushes, radius * 0.9, avoid, seed + 2, z_fn=z_fn)
    scatter_on(lambda i: rock(f"stone{i}", rnd.uniform(0.25, 0.55), seed + 60 + i), rocks, radius * 0.92, avoid, seed + 3, z_fn=z_fn)


def floaters(radius, seed, n=4):
    """Small rock shards hanging under the island, as in the references."""
    rnd = random.Random(seed)
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi)
        o = rock(f"shard{i}", rnd.uniform(0.4, 0.8), seed + 90 + i, flat_base=False, palette="rock")
        o.location = (math.cos(a) * radius * rnd.uniform(1.05, 1.3), math.sin(a) * radius * rnd.uniform(1.05, 1.3), rnd.uniform(-5, -2.5))


def clouds(radius, seed, n=2):
    rnd = random.Random(seed)
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi)
        o = cloud(f"cloud{i}", rnd.uniform(1.4, 2.2), seed + 120 + i)
        o.location = (math.cos(a) * radius * 1.25, math.sin(a) * radius * 1.25, rnd.uniform(2.5, 5.5))


def meadow_spots(gz, R, n, rnd, near=None, spread=1.0, keep_out=()):
    """n ground points on the island top, scattered (or gathered round `near`), outside keep_out circles."""
    pts = []
    while len(pts) < n:
        if near:
            x, y = near[0] + rnd.gauss(0, spread), near[1] + rnd.gauss(0, spread)
        else:
            a = rnd.uniform(0, 2 * math.pi); r = R * 0.9 * math.sqrt(rnd.uniform(0.02, 1))
            x, y = math.cos(a) * r, math.sin(a) * r
        if x * x + y * y > (R * 0.88) ** 2 or any((x - ax) ** 2 + (y - ay) ** 2 < (ar * 0.8) ** 2 for ax, ay, ar in keep_out):
            continue
        pts.append((x, y, gz(x, y)))
    return pts


def butterflies(centre, gz, frames, looks, rx=1.7, ry=1.4, height=1.15):
    """Butterflies flitting in looping figure-eights over `centre`; looks = [(colour, phase)]."""
    end = frames[-1]
    for k, (colour, ph) in enumerate(looks):
        bf = butterfly(f"butterfly{k}", 0.34, colour)
        def flit(f, ph=ph):
            w = 2 * math.pi * (f - 1) / (end - 1)
            return Vector((centre.x + rx * math.sin(2 * w + ph), centre.y + ry * math.sin(3 * w + ph * 1.7),
                           gz(centre.x, centre.y) + height + 0.45 * math.sin(7 * w + ph)))
        def path(f, flit=flit):
            a, b = flit(f), flit(f + 1)
            return a, math.atan2(b.y - a.y, b.x - a.x) + math.pi / 2, 0, 0
        key_path(bf, frames, path)
        flap(bf, frames, (end - 1) / round((end - 1) / 6), ph / 6)


def arc(p0, p1, height, t):
    """Point on a jump arc from p0 to p1, rising `height` above the straight line at mid-jump."""
    p = p0.lerp(p1, t)
    p.z += height * 4 * t * (1 - t)
    return p


def ease(t):
    return t * t * (3 - 2 * t)


# =========================================================================== Veera: tiger
def paint_trails(obj, trails, ring=None, patch=None):
    """Wear dirt into the island's grass along `trails` [(a, b, width)], round the cubs' chase
    `ring` (centre, radius, width) and dry out a `patch` (centre, radius) where they play."""
    me = obj.data
    attr = me.color_attributes["Col"].data
    rnd = random.Random(7)
    dirt, dry = PAL["dirt"], PAL["grass_dry"]

    def seg_d(p, a, b):
        ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
        return (p - (a + ab * t)).length
    for poly in me.polygons:
        if poly.normal.z < 0.55 or poly.center.z < -0.7:
            continue
        p = Vector((poly.center.x, poly.center.y, 0))
        col = None
        if any(seg_d(p, a, b) < w for a, b, w in trails):
            col = rnd.choice(dirt)
        elif ring and abs((p - ring[0]).length - ring[1]) < ring[2]:
            col = rnd.choice(dirt)
        elif patch and (p - patch[0]).length < patch[1]:
            col = rnd.choice(dry)
        if col:
            for li in poly.loop_indices:
                attr[li].color = hexc(col)


def build_veera():
    reset(3)
    R = 8.0
    PERIOD, END = 184, 369                 # the tiger's routine runs twice while the cubs play once
    TOR = Vector((2.0, 3.0, 0))
    hill = lambda x, y: 0.5 * math.exp(-((x - TOR.x) ** 2 + (y - TOR.y) ** 2) / 9)
    isl = island("island", R, 7, seed=3, top_height=hill, segments=34, n_rings=9)

    # ---- the tor: a granite boulder stack with a slab ledge jutting toward the island centre
    out = -TOR.normalized()
    base = rock("perch", 3.0, 11); base.location = (TOR.x, TOR.y, hill(TOR.x, TOR.y) - 0.2)
    rock("perch_b", 1.7, 12).location = (TOR.x + 1.9, TOR.y + 1.0, -0.1)
    rock("perch_c", 1.25, 13).location = (TOR.x - 1.9, TOR.y + 1.2, -0.1)
    rock("perch_d", 0.8, 14).location = (TOR.x + 1.4, TOR.y - 1.5, 0.0)
    bpy.context.view_layer.update()
    top_z = max((base.matrix_world @ v.co).z for v in base.data.vertices)
    ledge = rock("ledge", 1.45, 21, flat_base=False)
    ledge.scale = (1.15, 0.8, 0.3)
    ledge.location = TOR + out * 0.55 + Vector((0, 0, top_z - 0.2))
    ledge.rotation_euler.z = math.atan2(out.y, out.x)
    grounds = [isl, base, ledge] + [bpy.data.objects[n] for n in ("perch_b", "perch_c", "perch_d")]
    gz = ground_bvh(grounds)

    PLAY = Vector((-2.6, -2.8, 0))         # where the cubs play
    RAD = 1.75                             # their chase circle
    LOGA = math.pi / 2                     # the log lies across the circle here
    lg = log("log", 1.4, 0.19, 5)
    lp = PLAY + Vector((math.cos(LOGA), math.sin(LOGA), 0)) * RAD
    lg.location = (lp.x, lp.y, gz(lp.x, lp.y) - 0.05); lg.rotation_euler.z = LOGA
    grounds.append(lg)
    gz = ground_bvh(grounds)

    # ---- the mother: walk up, leap onto the ledge, roar, leap down the far side, walk back
    B = TOR + out * 1.55; B.z = gz(B.x, B.y)
    P_ = B + out * 1.5; P_.z = gz(P_.x, P_.y)
    Q = Vector((3.7, 0.4, 0)); Q.z = gz(Q.x, Q.y)
    A = Vector((-0.9, 0.1, 0)); A.z = gz(A.x, A.y)
    W1, J1, H, J2 = 34, 54, 118, 136
    head = lambda a, b: math.atan2(b.y - a.y, b.x - a.x)
    face_cam = math.radians(-115)
    on_ground = lambda v: Vector((v.x, v.y, gz(v.x, v.y)))

    def mother(f):
        f = (f - 1) % PERIOD + 1
        if f <= W1:
            t = (f - 1) / (W1 - 1); return on_ground(A.lerp(P_, t)), head(A, P_), 0, 0
        if f <= J1:
            t = ease((f - W1) / (J1 - W1)); return arc(P_, B, 1.3, t), head(P_, B), math.radians(-14) * math.sin(math.pi * t), 0
        if f <= H:
            t = (f - J1) / (H - J1)
            h0, h1 = head(P_, B), face_cam
            hd = h0 + (h1 - h0) * ease(min(1, t * 4)) if t < 0.85 else h1 + (head(B, Q) - h1) * ease((t - 0.85) / 0.15)
            return B, hd, 0, 0
        if f <= J2:
            t = ease((f - H) / (J2 - H)); return arc(B, Q, 0.8, t), head(B, Q), math.radians(12) * math.sin(math.pi * t), 0
        t = (f - J2) / (PERIOD + 1 - J2)
        return on_ground(Q.lerp(A, t)), head(Q, A) if t < 0.85 else head(Q, A) + (head(A, P_) - head(Q, A)) * ease((t - 0.85) / 0.15), 0, 0

    tiger_fwd = (-1, 0)
    tiger_keep = lambda o: o.data.materials and o.data.materials[0].name.startswith("Tiger")
    arm, body, rig = animal("tiger_rebuilt", 4.4, tiger_colours, 0, keep=tiger_keep)
    off = facing(rig, tiger_fwd)
    frames = range(1, END + 1)
    key_path(rig, frames, lambda f: (lambda p: (p[0], p[1] + off, p[2], p[3]))(mother(f)))
    seq = []
    for k in (0, PERIOD):
        seq += [("Walk", 1 + k, 0, 39, (W1 - 1) / 39), ("Run", W1 + k, 0, 12, (J1 - W1) / 12), ("Howl", J1 + k, 0, 63, 1),
                ("Run", H + k, 0, 12, (J2 - H) / 12), ("Walk Fast", J2 + k, 0, 18, 3, PERIOD + 1 - J2)]
    nla_sequence(arm, seq)
    airborne = lambda f: W1 < (f - 1) % PERIOD + 1 < J1 or H < (f - 1) % PERIOD + 1 < J2
    plant(rig, body, frames, gz, lambda f: not airborne(f))

    # ---- two cubs at play: standoff and swats, a leapfrog, a pounce and pin, wrestling, a tumble,
    # then a chase round the play circle (hopping the log) and the other cub leapfrogs home.
    S0, S1 = PLAY + Vector((-0.85, 0, 0)), PLAY + Vector((0.85, 0, 0))
    L0 = PLAY + Vector((2.35, 0.1, 0))
    L0b = L0 + Vector((0.3, 0, 0))
    ROLL = math.radians(88)

    def wrap(a):
        return (a + math.pi) % (2 * math.pi) - math.pi

    def circ(th):
        r = RAD + 0.15 * math.sin(3 * th)
        return PLAY + Vector((math.cos(th) * r, math.sin(th) * r, 0))

    def chase_th(f, f0, f1):
        t = min(1.0, max(0.0, (f - f0) / (f1 - f0)))
        return 3 * math.pi * (0.85 * t + 0.15 * ease(t))

    def hop(th):
        d = abs(wrap(th - LOGA)) * RAD
        return 0.62 * (1 - (d / 0.6) ** 2) if d < 0.6 else 0.0

    def bez(p0, p1, p2, p3, t):
        u = 1 - t
        return p0 * u ** 3 + p1 * 3 * u * u * t + p2 * 3 * u * t * t + p3 * t ** 3

    def dir_of(fn, t, eps=1e-3):
        a, b = fn(max(0, t - eps)), fn(min(1, t + eps))
        return math.atan2(b.y - a.y, b.x - a.x)

    END0 = circ(3 * math.pi)
    back0 = lambda t: bez(END0, END0 + Vector((0, -1.0, 0)), S0 + Vector((-1.0, -0.2, 0)), S0, t)

    def c0(f):
        """-> (xy point, heading, pitch, roll, lift above ground, grounded)"""
        if f <= 40:
            return S0, 0.15 * math.sin(f / 5), 0, 0, 0, True
        if f <= 62:                                        # leapfrog over the other cub
            t = (f - 40) / 22
            return S0.lerp(L0, t), 0, math.radians(-16) * math.cos(math.pi * t), 0, 1.35 * 4 * t * (1 - t), False
        if f <= 80:                                        # skid and wheel round
            t = (f - 62) / 18
            return L0.lerp(L0b, ease(min(1, t * 2))), math.pi * ease(t), 0, 0, 0, True
        if f <= 160:                                       # bowled over, then wrestling on its side
            r = ROLL * ease(min(1, max(0, (f - 94) / 10)))
            if f > 104:
                r += 0.22 * math.sin((f - 104) / 4.0)
            return L0b, math.pi + 0.1 * math.sin(f / 9), 0, r, 0, True
        if f <= 180:                                       # rights itself
            t = ease((f - 160) / 20)
            return L0b, math.pi, 0, (ROLL + 0.22 * math.sin(56 / 4.0)) * (1 - t), 0, True
        if f <= 330:                                       # races off round the circle
            th = chase_th(f, 180, 330)
            p = circ(th)
            k = ease(min(1, (f - 180) / 14))
            hd = math.pi + wrap(th + math.pi / 2 - math.pi) * k
            return L0b.lerp(p, k), hd, 0, 0, hop(th), hop(th) == 0
        t = (f - 330) / 39                                 # circles back to its spot, hops into a crouch
        if t < 0.55:
            u = ease(t / 0.55)
            return back0(u), dir_of(back0, u), 0, 0, 0, True
        u = (t - 0.55) / 0.45
        return S0, 2 * math.pi, 0, 0, 0.25 * math.sin(math.pi * u) if u < 0.6 else 0, u >= 0.6

    def c0_body(f):
        """Where the lying cub's flank is (for the other cub to stand on)."""
        p, hd, _, r, _, _ = c0(f)
        return p + Vector((-math.sin(hd), math.cos(hd), 0)) * 0.42 * math.sin(r)

    TOP_LIFT = 0.42
    T2 = PLAY + Vector((2.6, -1.45, 0))

    def c1(f):
        if f <= 40:                                        # lands home and spins to face its sibling
            return S1, math.pi * ease(min(1, f / 14)), 0, 0, 0, True
        if f <= 62:                                        # ducks as the sibling sails over
            return S1, math.pi, 0, 0, 0, True
        if f <= 80:                                        # turns to chase
            return S1, math.pi + math.pi * ease((f - 62) / 18), 0, 0, 0, True
        if f <= 96:                                        # pounces onto the sibling
            t = (f - 80) / 16
            tgt = c0_body(96)
            return S1.lerp(tgt, t), 2 * math.pi, math.radians(-14) * math.cos(math.pi * t), 0, 1.0 * 4 * t * (1 - t) + TOP_LIFT * t, False
        if f <= 150:                                       # pins it, swatting, rocking on top
            return c0_body(f), 2 * math.pi + 0.18 * math.sin(f / 7), 0, 0.1 * math.sin(f / 4), TOP_LIFT + 0.05 * math.sin(f / 3), False
        if f <= 175:                                       # tumbles off sideways, a full roll
            t = (f - 150) / 25
            p0 = c0_body(150)
            return p0.lerp(T2, ease(t)), 2 * math.pi, 0, -2 * math.pi * ease(t), TOP_LIFT * (1 - t) + 0.35 * math.sin(math.pi * t), False
        hd_to0 = head(T2, L0b)
        if f <= 196:                                       # crouches, bum wiggling, then gives chase
            return T2, hd_to0, 0, 0, 0, True
        if f <= 346:
            th = chase_th(f, 196, 346)
            p = circ(th)
            k = ease(min(1, (f - 196) / 14))
            hd = hd_to0 + wrap(th + math.pi / 2 - hd_to0) * k
            return T2.lerp(p, k), hd, 0, 0, hop(th), hop(th) == 0
        if f <= 352:                                       # run-up, turning for home
            t = (f - 346) / 6
            p = END0.lerp(END0 + Vector((0.4, 0.05, 0)), t)
            return p, 3.5 * math.pi + 0.5 * math.pi * ease(t), 0, 0, 0, True
        t = (f - 352) / 17                                 # leapfrogs its sibling to get home
        a = END0 + Vector((0.4, 0.05, 0))
        return a.lerp(S1, t), 4 * math.pi, math.radians(-16) * math.cos(math.pi * t), 0, 1.3 * 4 * t * (1 - t), False

    clips = {
        0: [("Attack", 1, 10, 58, 1, 39), ("Attack", 40, 0, 8, 1, 22), ("Walk Fast", 62, 0, 18, 1, 18), ("Attack", 80, 10, 40, 1, 14),
            ("Attack", 94, 10, 58, 1.5, 66), ("Walk Fast", 160, 0, 18, 1, 20), ("Run", 180, 0, 12, 12, 150),
            ("Run", 330, 0, 12, 1.5, 20), ("Attack", 350, 2, 10, 1, 19)],
        1: [("Attack", 1, 10, 58, 1, 39), ("Eat", 40, 40, 90, 1, 22), ("Walk Fast", 62, 0, 18, 1, 18), ("Attack", 80, 0, 8, 1, 16),
            ("Attack", 96, 10, 58, 1.5, 54), ("Attack", 150, 0, 4, 1, 25), ("Attack", 175, 10, 40, 1, 21),
            ("Run", 196, 0, 12, 12, 150), ("Run", 346, 0, 12, 0.5, 6), ("Attack", 352, 0, 10, 1, 17)],
    }
    for i, fn in enumerate((c0, c1)):
        carm, cbody, crig = animal("tiger_rebuilt", 2.1, tiger_colours, 0, keep=tiger_keep)
        coff = facing(crig, tiger_fwd)

        def keyed(f, fn=fn, coff=coff):
            p, hd, pitch, roll, lift, _ = fn(f)
            return Vector((p.x, p.y, gz(p.x, p.y) + lift)), hd + coff, pitch, roll
        key_path(crig, frames, keyed)
        nla_sequence(carm, clips[i], bone_scale={"Bip01 Head_06_14_11": 1.4})
        plant(crig, cbody, frames, gz, lambda f, fn=fn: fn(f)[5])

    # ---- dressing: worn trails, bamboo, grass tufts, wildflowers, butterflies over the cubs
    paint_trails(isl, [(A, P_, 0.55), (Q, A, 0.55)], ring=(PLAY, RAD, 0.42), patch=(PLAY, 1.1))
    avoid = [(TOR.x, TOR.y, 3.3), (P_.x, P_.y, 1.4), ((A.x + Q.x) / 2, (A.y + Q.y) / 2, 2.4), (A.x, A.y, 1.2),
             (PLAY.x, PLAY.y, RAD + 1.1), (Q.x, Q.y, 1.4)]
    tree_avoid = avoid + [(PLAY.x + 1.5, PLAY.y + 0.5, 3.0), (0, -4.5, 2.5),
                          (PLAY.x - 0.6, PLAY.y - 2.6, 2.6)]     # keep sightlines to the cubs clear
    for k, (x, y) in enumerate([(-5.3, 1.6), (4.9, -3.2), (-1.2, 5.6)]):
        b = bamboo(f"bamboo{k}", 4.2 - k * 0.5, 7 - k, 40 + k)
        b.location = (x, y, gz(x, y) - 0.05)
        avoid.append((x, y, 1.4))
    ground_props(R, tree_avoid, 30, trees=4, bushes=8, rocks=5, z_fn=gz)
    rnd = random.Random(31)
    meadow("grass", meadow_spots(gz, R, 70, rnd, keep_out=avoid), "grass", 1)
    fl = (meadow_spots(gz, R, 16, rnd, (PLAY.x - 0.6, PLAY.y + 2.9), 0.8, avoid[:4])
          + meadow_spots(gz, R, 12, rnd, (PLAY.x + 3.4, PLAY.y - 0.6), 0.6, avoid[:4]) + meadow_spots(gz, R, 16, rnd, keep_out=avoid))
    meadow("flowers", fl, "flower", 2)
    butterflies(PLAY, gz, list(frames), [("#f2a33a", 0.0), ("#f4f1e6", 2.1)])
    flock("finch", 4, (0, 0), 7.5, 8.0, list(frames), laps=2, seed=4)
    floaters(R, 3); clouds(R, 3)
    return END, (0, 0, 0.5)


# =========================================================================== Vaaranam: elephant
def build_vaaranam():
    reset(5)
    R = 8.5
    POND = Vector((3.2, -2.6, 0))
    # the watering hole sits in a dip, so grass bumps never poke through the water
    dip = lambda x, y: -0.4 * min(1.0, max(0.0, (2.5 - math.hypot(x - POND.x, y - POND.y)) / 0.8))
    isl = island("island", R, 7.5, seed=5, top_height=dip)
    gz = ground_bvh([isl])
    # watering hole: a sunken blue disc on the grass
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=9, radius=1.6)
    jitter(bm, 0.12, 2)
    pond = mesh_object("pond", bm, lambda p: hexc(PAL["sea"][p.index % 4])); pond.location = (POND.x, POND.y, -0.08)
    ground_props(R, [(0, 0, 4.9), (3.2, -2.6, 2.0)], 50, trees=7, pines=5, bushes=10, rocks=4, z_fn=gz)
    floaters(R, 5); clouds(R, 5)

    arm, body, rig = animal("african_elephant", 4.0, elephant_colours, 0)
    bpy.context.view_layer.update()
    fwd = (arm.matrix_world @ arm.pose.bones["RigHead_039_49"].head) - (arm.matrix_world @ arm.pose.bones["RigPelvis_03_11"].head)
    off = facing(rig, (fwd.x, fwd.y))
    WALK, ROAR = 360, 53
    END = WALK + ROAR + 1
    r = 2.3

    def path(f):
        t = min(1.0, (f - 1) / WALK)
        a = -2 * math.pi * t + math.radians(-60)                    # clockwise circle; trumpets facing the pond
        x, y = math.cos(a) * r, math.sin(a) * r
        return Vector((x, y, gz(x, y))), a - math.pi / 2 + off, 0, 0

    key_path(rig, range(1, END + 1), path)
    nla_sequence(arm, [("Loco_WalkSlow", 1, 0, 60, WALK / 60), ("Roar", WALK + 1, 0, 53, 1)], overlap=10)
    plant(rig, body, range(1, END + 1), gz, lambda f: True)

    # the calf: trots just ahead of its parent with a skip in each stride, swings in round the pond,
    # lets the parent catch up, then trumpets beside it
    barm, bbody, brig = animal("african_elephant", 2.1, elephant_colours, 0)
    boff = off
    POND_A = math.atan2(-2.6, 3.2)
    STRIDE = 48                                                         # one Loco_Run cycle
    calf_hop = lambda f: 0.24 * math.sin(math.pi * ((f - 1) % STRIDE) / 14) if f <= WALK and (f - 1) % STRIDE < 14 else 0.0
    def calf(f):
        t = min(1.0, (f - 1) / WALK)
        settle = ease(min(1.0, max(0.0, (f - (WALK - 80)) / 80)))       # slows so the parent catches up
        lead = math.radians(55) * (1 - settle) + math.radians(15) * settle
        a = -2 * math.pi * t + math.radians(-60) - lead                 # same way round as the parent
        d = abs((a - POND_A + math.pi) % (2 * math.pi) - math.pi)
        dip = max(0.0, 1 - d / 0.8) ** 2                                # swing inside the pond, not through it
        rr = (3.3 + 0.2 * math.sin(3 * a)) * (1 - settle) + 3.2 * settle - 0.95 * dip
        x, y = math.cos(a) * rr, math.sin(a) * rr
        return Vector((x, y, gz(x, y) + calf_hop(f))), a - math.pi / 2 + boff, 0, 0
    key_path(brig, range(1, END + 1), calf)
    nla_sequence(barm, [("Loco_Run", 1, 0, 48, WALK / STRIDE, WALK), ("Roar", WALK + 1, 0, 53, 1)], overlap=10,
                 bone_scale={"RigHead_039_49": 1.3})
    plant(brig, bbody, range(1, END + 1), gz, lambda f: calf_hop(f) < 0.05)     # lands on each bounce
    rnd = random.Random(52)
    trampled = [(0, 0, 4.4), (POND.x, POND.y, 1.9)]           # the elephants' ring and the water
    shore = POND + POND.normalized() * 1.2                    # the far bank, away from the elephants
    fl = (meadow_spots(gz, R, 18, rnd, (shore.x, shore.y), 0.9, trampled)
          + meadow_spots(gz, R, 30, rnd, keep_out=trampled))
    meadow("flowers", fl, "flower", 12)
    meadow("grass", meadow_spots(gz, R, 40, rnd, keep_out=trampled), "grass", 13)
    butterflies(POND + POND.normalized() * 0.6, gz, list(range(1, END + 1)),
                [("#f2a33a", 0.0), ("#f4f1e6", 2.1), ("#7fb6e8", 4.0)], rx=1.9, ry=1.6, height=1.0)
    flock("sparrow", 5, (0, 0), 8.0, 9.5, list(range(1, END + 1)), laps=2, seed=6, colour="#5a4a3c")
    return END, (0, 0, 0.5)


# =========================================================================== Varunaa: ocean
def lighthouse(col=None):
    bm = bmesh.new()
    z = 0.0
    for i in range(6):
        h = 0.45
        r0, r1 = 0.55 - i * 0.05, 0.55 - (i + 1) * 0.05
        c = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=r0, radius2=r1, depth=h)
        bmesh.ops.translate(bm, verts=c["verts"], vec=Vector((0, 0, z + h / 2)))
        z += h
    n_body = len(bm.faces)
    c = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.32, radius2=0.32, depth=0.35)
    bmesh.ops.translate(bm, verts=c["verts"], vec=Vector((0, 0, z + 0.17)))
    n_lamp = len(bm.faces)
    c = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.42, radius2=0.0, depth=0.45)
    bmesh.ops.translate(bm, verts=c["verts"], vec=Vector((0, 0, z + 0.57)))
    per_band = n_body // 6

    def colour(p):
        if p.index < n_body:
            return hexc("#d8433a" if (p.index // per_band) % 2 == 0 else "#f4f1ea")
        return hexc("#ffd75e") if p.index < n_lamp else hexc("#b8322b")
    return mesh_object("lighthouse", bm, colour, col)


def ship(name, seed):
    rnd = random.Random(seed)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * 1.4, v.co.y * 0.55, v.co.z * 0.3 + 0.15))
        if v.co.z < 0.1:
            v.co.y *= 0.55; v.co.x *= 0.8
        if v.co.x > 0.6:
            v.co.y *= 0.3                                   # bow
    n_hull = len(bm.faces)
    m = bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.04, radius2=0.04, depth=1.4)
    bmesh.ops.translate(bm, verts=m["verts"], vec=Vector((0, 0, 0.95)))
    n_mast = len(bm.faces)
    for side in (0.01, -0.01):                     # two thin faces so the sail shows from both sides
        v1 = bm.verts.new((0.05, side, 1.6)); v2 = bm.verts.new((0.05, side, 0.4)); v3 = bm.verts.new((0.85, side, 0.45))
        bm.faces.new((v1, v2, v3) if side > 0 else (v1, v3, v2))
    sail = rnd.choice(["#f6f2e8", "#f0d9a8"])
    return mesh_object(name, bm, lambda p: hexc("#8a5a3b") if p.index < n_hull else hexc("#5c3d27") if p.index < n_mast else hexc(sail))


def build_varunaa():
    reset(7)
    R = 9.0
    SEA = 0.0
    # the top is a sunken bowl whose rim sits at sea level; the sea fills it right out to the edge
    bowl = lambda x, y: -0.6 if math.hypot(x, y) < R * 0.85 else 0.0
    isl = island("island", R, 7.5, seed=7, top="sand", top_height=bowl)
    sea = sea_to_rim("sea", isl)
    sea.location.z = SEA
    # islet with a lighthouse
    islet = rock("islet", 2.2, 70, palette="rock"); islet.location = (-1.0, 1.2, -0.6)
    rock("islet_b", 1.4, 71).location = (0.4, 2.2, -0.5)
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=10, radius=2.6); jitter(bm, 0.15, 4)
    sand = mesh_object("beach", bm, lambda p: hexc(PAL["sand"][p.index % 3])); sand.location = (-0.6, 1.4, 0.06)
    lh = lighthouse(); lh.location = (-1.1, 1.4, 0.75)
    LAMP = Vector((-1.1, 1.4, 0.75 + 6 * 0.45 + 0.17))
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.3, radius2=0.3, depth=0.3)
    lamp = mesh_object("lamp", bm, None); lamp.data.materials.clear(); lamp.data.materials.append(glow_material("Lamp", "#ffe08a", 6.0))
    lamp.location = LAMP
    # two light beams sweeping round: long cones with their tips at the lamp
    bm = bmesh.new()
    for s in (1, -1):
        c = bmesh.ops.create_cone(bm, cap_ends=False, segments=10, radius1=0.0, radius2=1.4, depth=7.0)
        bmesh.ops.rotate(bm, verts=c["verts"], cent=Vector(), matrix=Matrix.Rotation(s * math.pi / 2, 3, "Y"))
        bmesh.ops.translate(bm, verts=c["verts"], vec=Vector((s * 3.5, 0, 0)))
    beam = mesh_object("beam", bm, None); beam.data.materials.clear(); beam.data.materials.append(glow_material("Beam", "#fff1b8", 2.0, 0.28))
    beam.location = LAMP
    tree("palm", 2.4, 77).location = (0.6, 0.6, 0.05)
    bush("shrub", 0.5, 78).location = (-2.4, 0.4, 0.05)
    floaters(R, 7); clouds(R, 7)

    END = 480
    # boats circling the islet, rocking on the swell
    for i, (r, ph, d) in enumerate([(5.2, 0.0, 1), (6.6, 2.4, -1)]):
        b = ship(f"ship{i}", 80 + i)
        key_path(b, range(1, END + 1), lambda f, r=r, ph=ph, d=d: (
            Vector((-0.6 + math.cos(ph + d * 2 * math.pi * (f - 1) / (END - 1)) * r, 1.0 + math.sin(ph + d * 2 * math.pi * (f - 1) / (END - 1)) * r, SEA + 0.03 * math.sin(f * 0.2))),
            ph + d * 2 * math.pi * (f - 1) / (END - 1) + d * math.pi / 2, 0.05 * math.sin(f * 0.13), 0.08 * math.sin(f * 0.17 + i)))
    # dolphins: swim a ring, breaking the surface three times a loop
    for i, (r, ph) in enumerate([(4.4, 0.0), (5.4, 0.35), (6.3, 0.75)]):
        arm, body, rig = animal("killer_whale", 2.7, dolphin_colours, 20,
                                reshape=lambda v: Vector((v.x * 0.82, v.y, v.z * (0.5 if v.z > 60 else 0.85))))
        off = facing(rig, (0, -1))
        rig.name = f"dolphin{i}"
        def path(f, r=r, ph=ph):
            th = ph + 2 * math.pi * (f - 1) / (END - 1)
            z = -0.9 + 2.0 * math.sin(4 * th - ph * 4)                    # four leaps a lap, clear of the water
            dz = 2.0 * 4 * math.cos(4 * th - ph * 4) / r
            return Vector((-0.6 + math.cos(-th) * r, 1.0 + math.sin(-th) * r, SEA + z)), -th - math.pi / 2 + off, 0, -math.atan(dz) * 0.8
        key_path(rig, range(1, END + 1), path)
        nla_sequence(arm, [("Take 001", 1, 1, 48, 10, END - 1)])
    # seagulls wheeling round the lighthouse, flapping and gliding
    for i, (r, h, ph, laps) in enumerate([(3.2, 5.6, 0.0, 2), (4.4, 6.6, 2.1, 3), (2.6, 7.4, 4.0, 2), (5.0, 5.0, 1.0, 3)]):
        g = make_bird(f"gull{i}", 1.5, "gull", talons=False)
        key_path(g, range(1, END + 1), lambda f, r=r, h=h, ph=ph, laps=laps: (
            Vector((LAMP.x + math.cos(ph + laps * 2 * math.pi * (f - 1) / (END - 1)) * r,
                    LAMP.y + math.sin(ph + laps * 2 * math.pi * (f - 1) / (END - 1)) * r, h + 0.4 * math.sin(f * 0.05 + ph))),
            ph + laps * 2 * math.pi * (f - 1) / (END - 1) + math.pi, math.radians(-20), 0))
        flap(g, list(range(1, END + 1)), (END - 1) / 40, ph / 6, glide=lambda f, ph=ph: max(0.0, math.sin(f * 0.03 + ph)) ** 2)
    key_path(beam, range(1, END + 1), lambda f: (LAMP, 4 * 2 * math.pi * (f - 1) / (END - 1), 0, 0))
    # waves: blend the three shapes so their sum stays 1 and the swell travels
    keys = sea.data.shape_keys.key_blocks
    for f in range(1, END + 1, 4):
        for k in range(3):
            keys[f"wave{k}"].value = (1 + math.cos(2 * math.pi * (6 * (f - 1) / (END - 1) - k / 3))) / 3
            keys[f"wave{k}"].keyframe_insert("value", frame=f)
    return END, (0, 1, 0.5)


# =========================================================================== Vimaana: eagle
def build_vimaana():
    reset(9)
    R = 6.5
    island("island", R, 8, seed=9, top="grass_dry")
    # the spire: stacked, jittered rock drums
    bm = bmesh.new()
    z = 0.0
    for i in range(5):
        h = 1.3
        r0, r1 = 1.7 - i * 0.22, 1.7 - (i + 1) * 0.22
        c = bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=r0, radius2=r1, depth=h)
        bmesh.ops.translate(bm, verts=c["verts"], vec=Vector((0.15 * math.sin(i), 0.12 * math.cos(i * 1.3), z + h / 2)))
        z += h * 0.96
    jitter(bm, 0.1, 9)
    spire = mesh_object("spire", bm, lambda p: hexc(PAL["cliff"][p.index % 3][(p.index // 3) % 3]))
    spire.location = (0.3, 0.6, -0.1)
    top = z - 0.1
    NEST = Vector((0.3 + 0.15 * math.sin(4), 0.6 + 0.12 * math.cos(5.2), top + 0.1))
    bm = bmesh.new()
    bowl = bmesh.ops.create_cone(bm, cap_ends=True, segments=9, radius1=0.55, radius2=0.95, depth=0.35)
    for k in range(14):                                    # sticks laid round the rim
        a = 2 * math.pi * k / 14
        st = bmesh.ops.create_cube(bm, size=1.0)
        for v in st["verts"]:
            v.co = Vector((v.co.x * 0.9, v.co.y * 0.08, v.co.z * 0.08))
        bmesh.ops.rotate(bm, verts=st["verts"], cent=Vector(), matrix=Matrix.Rotation(a + math.pi / 2 + 0.3 * math.sin(k), 3, "Z") @ Matrix.Rotation(0.25 * math.cos(k * 1.7), 3, "X"))
        bmesh.ops.translate(bm, verts=st["verts"], vec=Vector((math.cos(a) * 0.85, math.sin(a) * 0.85, 0.12 + 0.06 * (k % 3))))
    jitter(bm, 0.03, 3)
    nest = mesh_object("nest", bm, lambda p: hexc(["#7a5236", "#8f6440", "#5f3f29", "#a07448"][p.index % 4]))
    nest.location = NEST
    for k, (dx, dy) in enumerate([(-0.18, 0.05), (0.15, -0.08)]):
        bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
        for v in bm.verts:
            v.co = Vector((v.co.x * 0.16, v.co.y * 0.13, v.co.z * 0.13))
        egg = mesh_object(f"egg{k}", bm, lambda p: hexc(["#f3efe6", "#e8e2d4"][p.index % 2]))
        egg.location = NEST + Vector((dx, dy, 0.2))
    ground_props(R, [(0.3, 0.6, 2.4)], 90, trees=3, pines=2, bushes=6, rocks=5, top="grass_dry")
    floaters(R, 9); clouds(R, 9, 3)

    END = 288
    C = Vector((0.3, 0.6, top - 1.6))         # round the upper spire, below the nest
    r = 4.6
    eagle = make_bird("eagle", 3.2, "eagle")
    CIRCLE, LAND, PERCH, LIFT = 150, 196, 246, END
    rest = NEST + Vector((0, 0, 0.62))
    start = C + Vector((r, 0, 0))

    def bez(p0, p1, p2, p3, t):
        u = 1 - t
        return p0 * u ** 3 + p1 * 3 * u * u * t + p2 * 3 * u * t * t + p3 * t ** 3

    def path(f):
        if f <= CIRCLE:                                     # wide circle round the spire, banking
            th = 2 * math.pi * (f - 1) / (CIRCLE - 1)
            p = C + Vector((math.cos(th) * r, math.sin(th) * r, 0.5 * math.sin(2 * th)))
            return p, th + math.pi, math.radians(-24), 0
        if f <= LAND:                                       # glide in and flare onto the nest
            t = ease((f - CIRCLE) / (LAND - CIRCLE))
            p = bez(start, start + Vector((0, r * 0.9, 0.6)), rest + Vector((2.2, 1.2, 1.4)), rest, t)
            d = bez(start, start + Vector((0, r * 0.9, 0.6)), rest + Vector((2.2, 1.2, 1.4)), rest, min(1, t + 0.02)) - p
            return p, math.atan2(d.y, d.x) + math.pi / 2, math.radians(-14) * (1 - t), -math.radians(25) * t * t
        if f <= PERCH:                                      # perched: look about
            t = (f - LAND) / (PERCH - LAND)
            return rest + Vector((0, 0, 0.03 * math.sin(f * 0.4))), math.radians(200) + 0.6 * math.sin(2 * math.pi * t), 0, 0
        t = ease((f - PERCH) / (LIFT - PERCH))              # lift off back into the circle
        p = bez(rest, rest + Vector((0.4, -1.6, 1.8)), start + Vector((0, -r * 0.6, 0)), start, t)
        d = bez(rest, rest + Vector((0.4, -1.6, 1.8)), start + Vector((0, -r * 0.6, 0)), start, min(1, t + 0.02)) - p
        return p, math.atan2(d.y, d.x) + math.pi / 2, math.radians(-10) * t, -math.radians(15) * (1 - t)
    key_path(eagle, range(1, END + 1), path)
    perched = lambda f: 0.0 if f < LAND - 6 or f > PERCH + 4 else min(1.0, (f - (LAND - 6)) / 8, (PERCH + 4 - f) / 6)
    gliding = lambda f: (0.85 * max(0.0, math.sin(2 * math.pi * f / 75)) ** 2) if f <= CIRCLE else 0.0
    flap(eagle, list(range(1, END + 1)), (END - 1) / 24, glide=gliding, fold=perched)
    flock("swift", 3, (0.3, 0.6), 6.5, top - 1.5, list(range(1, END + 1)), laps=2, seed=8, colour="#4a4652")
    return END, (0.3, 0.6, 3.0)


BUILDERS = {"veera": build_veera, "vaaranam": build_vaaranam, "varunaa": build_varunaa, "vimaana": build_vimaana}

for house in WHICH:
    frames, look = BUILDERS[house]()
    bpy.context.scene.frame_set(frames // 2)
    if PREVIEW:
        os.makedirs(PREVIEW_DIR, exist_ok=True)
        for k, fr in enumerate((frames // 5, frames // 2)):
            bpy.context.scene.frame_set(fr)
            preview(os.path.join(PREVIEW_DIR, f"{house}_{k}.png"), (17, -21, 11), look, lens=38, size=(1100, 760))
    if os.environ.get("SHOTS"):          # review stills: SHOTS=f1,f2,... CAM=x,y,z TARGET=x,y,z
        cam = tuple(float(v) for v in os.environ.get("CAM", "17,-21,11").split(","))
        tgt = tuple(float(v) for v in os.environ.get("TARGET", ",".join(map(str, look))).split(","))
        for fr in map(int, os.environ["SHOTS"].split(",")):
            bpy.context.scene.frame_set(fr)
            preview(os.path.join(PREVIEW_DIR, "shots", f"{house}_{fr:03d}.png"), cam, tgt, lens=float(os.environ.get("LENS", 38)), size=tuple(int(v) for v in os.environ.get("SIZE", "640,440").split(",")),
                    transparent=bool(os.environ.get("TRANSPARENT")))
    if "noexport" not in ARGS:
        export_glb(house, frames)
