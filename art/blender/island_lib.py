"""Shared building blocks for the house islands (Blender 5.2, Cycles).

Each build_<house>.py describes its terrain, planting and camera and calls these helpers.
"""
import bpy, math, os, random, sys
from mathutils import Vector, noise

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PH = os.path.join(ART, "polyhaven")
MODE = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "draft"


def smooth(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def periodic(theta, freq, seed):
    return noise.noise(Vector((math.cos(theta) * freq, math.sin(theta) * freq, seed)))


# ---------------------------------------------------------------- scene
def reset(seed):
    random.seed(seed)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    assets = bpy.data.collections.new("Assets")
    scene.collection.children.link(assets)
    props = bpy.data.collections.new("Props")
    scene.collection.children.link(props)
    return scene, props


class Island:
    """Floating island: a top surface from `top_fn(x, y, t)` over a craggy rock underside.

    `mask_fn(x, y, h, slope)` returns 0..1 plant cover; the clearing (where the animal acts)
    and the rim are kept free of the larger plants via the "scatter" vertex group.
    """

    def __init__(self, r0, depth, top_fn, mask_fn=None, clearing=(0, 0), clear_r=2.6,
                 shape_seed=1.0, tip_shift=(1.2, 0.6), taper=0.62, res=(384, 64, 140)):
        self.r0, self.depth, self.top_fn = r0, depth, top_fn
        self.mask_fn = mask_fn or (lambda x, y, h, s: 1.0)
        self.clearing, self.clear_r = Vector(clearing), clear_r
        self.seed, self.tip_shift, self.taper, self.res = shape_seed, Vector(tip_shift), taper, res

    def radius(self, th):
        return self.r0 * (1 + 0.11 * periodic(th, 1.3, self.seed) + 0.05 * periodic(th, 3.1, self.seed + 4))

    def surface_z(self, x, y):
        t = min(1.0, math.hypot(x, y) / self.radius(math.atan2(y, x)))
        return self.top_fn(x, y, t)

    def slope(self, x, y):
        e = 0.15
        dx = self.surface_z(x + e, y) - self.surface_z(x - e, y)
        dy = self.surface_z(x, y + e) - self.surface_z(x, y - e)
        return math.hypot(dx, dy) / (2 * e)

    def build(self, scene):
        S, T, U = self.res
        verts, faces, top_w, scat_w, rings = [], [], [], [], []

        def add(v, tw=0.0, sw=0.0):
            verts.append(v); top_w.append(tw); scat_w.append(sw)
            return len(verts) - 1

        thetas = [2 * math.pi * i / S for i in range(S)]
        Rs = [self.radius(th) for th in thetas]
        h0 = self.top_fn(0, 0, 0)
        cover0 = self.mask_fn(0, 0, h0, self.slope(0, 0))
        centre = add(Vector((0, 0, h0)), cover0, cover0)
        for j in range(1, T + 1):
            t = j / T
            ring = []
            for th, R in zip(thetas, Rs):
                x, y = math.cos(th) * R * t, math.sin(th) * R * t
                h = self.top_fn(x, y, t)
                cover = self.mask_fn(x, y, h, self.slope(x, y)) if t < 0.985 else 0.0
                d = (Vector((x, y)) - self.clearing).length
                clear = smooth(self.clear_r, self.clear_r + 1.8, d)
                edge = 1 - smooth(0.91, 0.97, t)
                ring.append(add(Vector((x, y, h)), cover, cover * clear * edge))
            rings.append(ring)
        first_lip = len(verts)

        rim_z = [verts[i].z for i in rings[-1]]
        for rs, dz in [(1.012, -0.18), (1.018, -0.55), (1.0, -0.95)]:
            ring = []
            for th, R, z in zip(thetas, Rs, rim_z):
                p = Vector((math.cos(th) * R * rs, math.sin(th) * R * rs, z + dz))
                p.xy *= 1 + 0.03 * noise.noise(p * 1.7)
                ring.append(add(p))
            rings.append(ring)
        lip_z = [verts[i].z for i in rings[-1]]

        for k in range(1, U + 1):
            s = k / U
            ring = []
            for th, R, z0 in zip(thetas, Rs, lip_z):
                lobe = 1 + 0.35 * s * periodic(th, 2.2, self.seed + 8)
                r = R * (1 - s) ** self.taper * lobe * (1 + 0.06 * math.sin(math.pi * s))
                depth = self.depth * (1 + 0.18 * periodic(th, 1.7, self.seed + 2))
                p = Vector((math.cos(th) * r, math.sin(th) * r, z0 - s * depth))
                p.xy += self.tip_shift * s * s
                q = Vector((p.x / 2.2, p.y / 2.2, p.z / 6.0))              # vertical strata
                n = noise.fractal(q, 0.5, 2.0, 5) * (0.55 + 0.9 * s)
                n += 0.18 * noise.fractal(p / 0.8, 0.6, 2.0, 3)
                n += 0.10 * math.sin(p.z * 2.6 + 2 * noise.noise(p / 3))   # ledges
                p += Vector((math.cos(th), math.sin(th), 0)) * n * (1 - s) ** 0.3
                ring.append(add(p))
            rings.append(ring)
        tip = add(sum((verts[i] for i in rings[-1]), Vector()) / S + Vector((0, 0, -0.6)))

        for i in range(S):
            faces.append((centre, rings[0][i], rings[0][(i + 1) % S]))
        for a, b in zip(rings[:-1], rings[1:]):
            for i in range(S):
                i2 = (i + 1) % S
                faces.append((a[i], b[i], b[i2], a[i2]))
        for i in range(S):
            faces.append((rings[-1][i], tip, rings[-1][(i + 1) % S]))

        me = bpy.data.meshes.new("Island")
        me.from_pydata([tuple(v) for v in verts], [], faces)
        me.update()
        ob = bpy.data.objects.new("Island", me)
        scene.collection.objects.link(ob)
        for name, w in (("top", top_w), ("scatter", scat_w)):
            vg = ob.vertex_groups.new(name=name)
            for i, val in enumerate(w):
                if val > 0:
                    vg.add([i], val, "REPLACE")
        for p in me.polygons:
            p.material_index = 0 if max(p.vertices) < first_lip else 1
            p.use_smooth = True
        self.ob = ob
        return ob


# ---------------------------------------------------------------- materials
def tex(name, kind):
    return os.path.join(PH, name, "textures", f"{name}_{kind}_2k.jpg")


def img(nodes, path, colour=True):
    n = nodes.new("ShaderNodeTexImage")
    n.image = bpy.data.images.load(path, check_existing=True)
    if not colour:
        n.image.colorspace_settings.name = "Non-Color"
    n.projection = "BOX"
    n.projection_blend = 0.35
    return n


def _mix(N, L, fac, a, b):
    m = N.new("ShaderNodeMix"); m.data_type = "RGBA"
    if isinstance(fac, float):
        m.inputs[0].default_value = fac
    else:
        L.new(fac, m.inputs[0])
    L.new(a, m.inputs[6]); L.new(b, m.inputs[7])
    return m.outputs[2]


def _hsv(N, L, colour, sat=1.0, val=1.0, hue=0.5):
    h = N.new("ShaderNodeHueSaturation")
    h.inputs["Hue"].default_value = hue
    h.inputs["Saturation"].default_value = sat; h.inputs["Value"].default_value = val
    L.new(colour, h.inputs["Color"])
    return h.outputs[0]


def _normal_z_ramp(N, L, lo, hi):
    geo = N.new("ShaderNodeNewGeometry"); sn = N.new("ShaderNodeSeparateXYZ")
    L.new(geo.outputs["Normal"], sn.inputs[0])
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = lo; mr.inputs["From Max"].default_value = hi
    L.new(sn.outputs["Z"], mr.inputs["Value"])
    return mr.outputs[0]


def _mapped(N, L, scale):
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale,) * 3
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    return tc, mp.outputs[0]


def ground_material(ground, rock="aerial_rocks_02", tint=(0.55, 0.75, 0.35), tint_amt=0.35,
                    rock_sat=0.6, rock_val=0.95, steep=(0.62, 0.8), shore=None):
    """Top surface: `ground` on flat areas, `rock` on steep slopes.

    `shore=(texture, z_lo, z_hi)` blends a beach texture in below z_hi (object space).
    """
    m = bpy.data.materials.new("Ground")
    N, L = m.node_tree.nodes, m.node_tree.links
    bsdf = N["Principled BSDF"]
    _, uv = _mapped(N, L, 0.3)
    gd, gr = img(N, tex(ground, "diff")), img(N, tex(ground, "rough"), False)
    gn = img(N, tex(ground, "nor_gl"), False)
    rd, rn = img(N, tex(rock, "diff")), img(N, tex(rock, "nor_gl"), False)
    for n in (gd, gr, gn, rd, rn):
        L.new(uv, n.inputs[0])
    tinted = N.new("ShaderNodeMix"); tinted.data_type = "RGBA"; tinted.blend_type = "MULTIPLY"
    tinted.inputs[0].default_value = tint_amt; tinted.inputs[7].default_value = (*tint, 1)
    L.new(gd.outputs[0], tinted.inputs[6])
    flat_col = tinted.outputs[2]
    if shore:
        sand = img(N, tex(shore[0], "diff")); L.new(uv, sand.inputs[0])
        tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ")
        L.new(tc.outputs["Object"], sep.inputs[0])
        nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.8
        L.new(tc.outputs["Object"], nz.inputs["Vector"])
        wob = N.new("ShaderNodeMath"); wob.operation = "MULTIPLY_ADD"; wob.inputs[1].default_value = 0.5
        L.new(nz.outputs["Fac"], wob.inputs[0]); L.new(sep.outputs["Z"], wob.inputs[2])
        band = N.new("ShaderNodeMapRange")
        band.inputs["From Min"].default_value = shore[1] + 0.25; band.inputs["From Max"].default_value = shore[2] + 0.25
        L.new(wob.outputs[0], band.inputs["Value"])
        flat_col = _mix(N, L, band.outputs[0], _hsv(N, L, sand.outputs[0], 0.8, 1.25), flat_col)
    flat = _normal_z_ramp(N, L, *steep)
    col = _mix(N, L, flat, _hsv(N, L, rd.outputs[0], rock_sat, rock_val), flat_col)
    L.new(col, bsdf.inputs["Base Color"])
    L.new(gr.outputs[0], bsdf.inputs["Roughness"])
    nm = N.new("ShaderNodeMix"); nm.data_type = "RGBA"
    L.new(flat, nm.inputs[0]); L.new(rn.outputs[0], nm.inputs[6]); L.new(gn.outputs[0], nm.inputs[7])
    nmap = N.new("ShaderNodeNormalMap"); L.new(nm.outputs[2], nmap.inputs["Color"])
    L.new(nmap.outputs[0], bsdf.inputs["Normal"])
    return m


def rock_material(rock="cliff_side", soil="forest_ground_04", moss="mossy_rock",
                  sat=0.45, val=0.85, hue=0.5, soil_tint=(0.55, 0.42, 0.32), moss_amt=1.0):
    """Underside: rock with a soil band under the rim and moss on up-facing ledges."""
    m = bpy.data.materials.new("Rock")
    N, L = m.node_tree.nodes, m.node_tree.links
    bsdf = N["Principled BSDF"]
    tc, uv = _mapped(N, L, 0.22)
    rd, rn = img(N, tex(rock, "diff")), img(N, tex(rock, "nor_gl"), False)
    ra = img(N, tex(rock, "arm"), False)
    sd, md = img(N, tex(soil, "diff")), img(N, tex(moss, "diff"))
    for n in (rd, rn, ra, sd, md):
        L.new(uv, n.inputs[0])
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.6
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    add = N.new("ShaderNodeMath"); add.operation = "MULTIPLY_ADD"; add.inputs[1].default_value = 1.2
    L.new(nz.outputs["Fac"], add.inputs[0]); L.new(sep.outputs["Z"], add.inputs[2])
    soil_f = N.new("ShaderNodeMapRange")
    soil_f.inputs["From Min"].default_value = -1.3; soil_f.inputs["From Max"].default_value = 0.2
    L.new(add.outputs[0], soil_f.inputs["Value"])
    dark = N.new("ShaderNodeMix"); dark.data_type = "RGBA"; dark.blend_type = "MULTIPLY"
    dark.inputs[0].default_value = 1.0; dark.inputs[7].default_value = (*soil_tint, 1)
    L.new(sd.outputs[0], dark.inputs[6])
    moss_f = N.new("ShaderNodeMath"); moss_f.operation = "MULTIPLY"; moss_f.inputs[1].default_value = moss_amt
    L.new(_normal_z_ramp(N, L, 0.35, 0.75), moss_f.inputs[0])
    c1 = _mix(N, L, moss_f.outputs[0], _hsv(N, L, rd.outputs[0], sat, val, hue), md.outputs[0])
    L.new(_mix(N, L, soil_f.outputs[0], c1, dark.outputs[2]), bsdf.inputs["Base Color"])
    sp = N.new("ShaderNodeSeparateColor"); L.new(ra.outputs[0], sp.inputs[0])
    L.new(sp.outputs["Green"], bsdf.inputs["Roughness"])
    nmap = N.new("ShaderNodeNormalMap"); nmap.inputs["Strength"].default_value = 1.4
    L.new(rn.outputs[0], nmap.inputs["Color"]); L.new(nmap.outputs[0], bsdf.inputs["Normal"])
    return m


def water_material(deep=(0.02, 0.32, 0.38), wave_scale=1.4, density=0.6):
    m = bpy.data.materials.new("Water")
    N, L = m.node_tree.nodes, m.node_tree.links
    bsdf = N["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.9, 1, 1, 1)
    bsdf.inputs["Roughness"].default_value = 0.04
    bsdf.inputs["IOR"].default_value = 1.333
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    tc = N.new("ShaderNodeTexCoord")
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = wave_scale
    nz.inputs["Detail"].default_value = 6
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.12
    L.new(nz.outputs["Fac"], bump.inputs["Height"]); L.new(bump.outputs[0], bsdf.inputs["Normal"])
    vol = N.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = (*deep, 1); vol.inputs["Density"].default_value = density
    L.new(vol.outputs[0], N["Material Output"].inputs["Volume"])
    return m


FLOWS = []          # waterfall texture mappings, advanced each frame of a sequence


def falls_material(name="Falls", fade_from=0.7):
    """Falling water: clear water streaked with white foam; fades out at the sides and,
    from `fade_from` (0..1 down the sheet), into mist."""
    m = bpy.data.materials.new(name)
    N, L = m.node_tree.nodes, m.node_tree.links
    out = N["Material Output"]
    water = N["Principled BSDF"]
    water.inputs["Base Color"].default_value = (0.85, 1, 1, 1)
    water.inputs["Roughness"].default_value = 0.08
    water.inputs["Transmission Weight"].default_value = 1.0
    water.inputs["IOR"].default_value = 1.333
    foam = N.new("ShaderNodeBsdfPrincipled")
    foam.inputs["Base Color"].default_value = (0.95, 0.97, 0.98, 1)
    foam.inputs["Roughness"].default_value = 0.55
    foam.inputs["Subsurface Weight"].default_value = 0.3
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (26, 2.2, 1)   # vertical streaks
    FLOWS.append(mp)
    L.new(tc.outputs["UV"], mp.inputs["Vector"])
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Detail"].default_value = 8
    nz.inputs["Scale"].default_value = 1.0; nz.inputs["Roughness"].default_value = 0.6
    L.new(mp.outputs[0], nz.inputs["Vector"])
    uv = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["UV"], uv.inputs[0])
    more = N.new("ShaderNodeMath"); more.operation = "MULTIPLY_ADD"; more.inputs[1].default_value = 0.25
    L.new(uv.outputs["Y"], more.inputs[0]); L.new(nz.outputs["Fac"], more.inputs[2])
    ff = N.new("ShaderNodeMapRange")
    ff.inputs["From Min"].default_value = 0.42; ff.inputs["From Max"].default_value = 0.62
    L.new(more.outputs[0], ff.inputs["Value"])
    body = N.new("ShaderNodeMixShader")
    L.new(ff.outputs[0], body.inputs[0]); L.new(water.outputs[0], body.inputs[1]); L.new(foam.outputs[0], body.inputs[2])
    # opacity: soft side edges, ragged mist toward the bottom
    def ramp(sock, lo, hi):
        r = N.new("ShaderNodeMapRange"); r.inputs["From Min"].default_value = lo; r.inputs["From Max"].default_value = hi
        L.new(sock, r.inputs["Value"]); return r.outputs[0]
    inv = N.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1.0
    L.new(uv.outputs["X"], inv.inputs[1])
    side = N.new("ShaderNodeMath"); side.operation = "MINIMUM"
    L.new(ramp(uv.outputs["X"], 0.0, 0.12), side.inputs[0]); L.new(ramp(inv.outputs[0], 0.0, 0.12), side.inputs[1])
    vjit = N.new("ShaderNodeMath"); vjit.operation = "MULTIPLY_ADD"; vjit.inputs[1].default_value = 0.3
    L.new(nz.outputs["Fac"], vjit.inputs[0]); L.new(uv.outputs["Y"], vjit.inputs[2])
    bottom = N.new("ShaderNodeMath"); bottom.operation = "SUBTRACT"; bottom.inputs[0].default_value = 1.0
    L.new(ramp(vjit.outputs[0], fade_from + 0.15, max(1.25, fade_from + 0.4)), bottom.inputs[1])
    alpha = N.new("ShaderNodeMath"); alpha.operation = "MULTIPLY"
    L.new(side.outputs[0], alpha.inputs[0]); L.new(bottom.outputs[0], alpha.inputs[1])
    final = N.new("ShaderNodeMixShader")
    L.new(alpha.outputs[0], final.inputs[0]); L.new(N.new("ShaderNodeBsdfTransparent").outputs[0], final.inputs[1])
    L.new(body.outputs[0], final.inputs[2])
    L.new(final.outputs[0], out.inputs["Surface"])
    return m


def foam_material():
    """White churn where falling water hits a pool; ragged, see-through edges."""
    m = bpy.data.materials.new("Foam")
    N, L = m.node_tree.nodes, m.node_tree.links
    bsdf = N["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.95, 0.97, 0.98, 1)
    bsdf.inputs["Roughness"].default_value = 0.6
    tc = N.new("ShaderNodeTexCoord")
    grad = N.new("ShaderNodeTexGradient"); grad.gradient_type = "SPHERICAL"
    L.new(tc.outputs["Object"], grad.inputs[0])
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.5; nz.inputs["Detail"].default_value = 10
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    a = N.new("ShaderNodeMath"); a.operation = "MULTIPLY_ADD"; a.inputs[1].default_value = 1.4
    L.new(grad.outputs["Fac"], a.inputs[0]); L.new(nz.outputs["Fac"], a.inputs[2])
    r = N.new("ShaderNodeMapRange"); r.inputs["From Min"].default_value = 0.9; r.inputs["From Max"].default_value = 1.2
    L.new(a.outputs[0], r.inputs["Value"])
    mix = N.new("ShaderNodeMixShader")
    L.new(r.outputs[0], mix.inputs[0]); L.new(N.new("ShaderNodeBsdfTransparent").outputs[0], mix.inputs[1])
    L.new(bsdf.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def waterfall(name, top, out_dir, width, drop, mat, curve=0.35, spread=0.25, segs=(16, 48)):
    """Curved ribbon of falling water starting at `top`, leaving in `out_dir` (2D) and falling `drop` m."""
    import bmesh
    d = Vector((out_dir[0], out_dir[1], 0)).normalized()
    side = Vector((-d.y, d.x, 0))
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    nu, nv = segs
    grid = []
    for j in range(nv + 1):
        v = j / nv
        z = -drop * v
        fwd = curve * math.sqrt(drop * v) + 0.6 * v * v
        w = width * (1 + spread * v)
        row = []
        for i in range(nu + 1):
            u = i / nu
            wob = 0.08 * noise.noise(Vector((u * 4, v * 6, 3.3)))
            p = Vector(top) + d * (fwd + wob) + side * (u - 0.5) * w + Vector((0, 0, z))
            row.append(bm.verts.new(p))
        grid.append(row)
    for j in range(nv):
        for i in range(nu):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            for loop, (uu, vv) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                loop[uvl].uv = (uu / nu, vv / nv)
            f.smooth = True
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    me.materials.append(mat)
    return o


def island_water(isl, z, mat, name="Water", res=192):
    """Water sheet the shape of the island's top; terrain above `z` hides it, so it only
    shows in hollows (pools, rivers) and ends at the rim where a channel cuts through."""
    import bmesh
    bm = bmesh.new()
    ring = [bm.verts.new((math.cos(t) * isl.radius(t) * 0.995, math.sin(t) * isl.radius(t) * 0.995, z))
            for t in [2 * math.pi * i / res for i in range(res)]]
    bm.faces.new(ring)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    me.materials.append(mat)
    return o


def tint_materials(objs, hue=0.5, sat=1.0, val=1.0):
    """Re-colour imported plant materials (e.g. green grass -> dry golden grass)."""
    done = set()
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not m or m.name in done or not m.use_nodes:
                continue
            done.add(m.name)
            N, L = m.node_tree.nodes, m.node_tree.links
            bsdf = next((n for n in N if n.type == "BSDF_PRINCIPLED"), None)
            if not bsdf or not bsdf.inputs["Base Color"].is_linked:
                continue
            src = bsdf.inputs["Base Color"].links[0].from_socket
            L.new(_hsv(N, L, src, sat, val, hue), bsdf.inputs["Base Color"])


# ---------------------------------------------------------------- assets
def load(name, res="2k"):
    """Import a Poly Haven glTF into its own (hidden) collection; returns (collection, meshes)."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(PH, name, f"{name}_{res}.gltf"))
    objs = [o for o in bpy.data.objects if o not in before]
    col = bpy.data.collections.new(name)
    bpy.data.collections["Assets"].children.link(col)
    for o in objs:
        for c in o.users_collection:
            c.objects.unlink(o)
        col.objects.link(o)
    meshes = [o for o in objs if o.type == "MESH"]
    for o in meshes:
        if o.parent:
            mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
        o.location = (0, 0, 0)
    return col, meshes


def center_base(o):
    """Move a mesh's origin to the centre of its footprint at its lowest point."""
    xs, ys, zs = zip(*(v.co for v in o.data.vertices))
    off = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    for v in o.data.vertices:
        v.co -= off


def place(src, loc, rot_z, scale, col, rot_xy=(0, 0)):
    o = src.copy()
    col.objects.link(o)
    o.location = loc; o.rotation_euler = (rot_xy[0], rot_xy[1], rot_z)
    o.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
    return o


def summit(o, band=0.4):
    """World-space (x, y, z) of the highest part of a placed mesh."""
    mw = o.matrix_world
    pts = [mw @ v.co for v in o.data.vertices]
    zmax = max(p.z for p in pts)
    top = [p for p in pts if p.z > zmax - band]
    return (sum(p.x for p in top) / len(top), sum(p.y for p in top) / len(top), zmax)


ANIMALS = os.path.join(ART, "animals")


def add_animal(folder, action, frame, length, loc, heading, forward=(-1, 0), pitch=0.0, ground=True):
    """Import a rigged Sketchfab animal, pose it at `frame` of `action`, scale it so it is
    `length` m along its heading, turn it to `heading` (radians, world), raise its nose by
    `pitch`, and stand it on `loc` (or centre it there when `ground` is False).

    `forward` is the model's own nose direction: an (x, y) vector, or (tail_bone, head_bone).
    """
    from mathutils import Matrix
    scene = bpy.context.scene
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ANIMALS, folder, "scene.gltf"))
    new = [o for o in bpy.data.objects if o not in before]
    col = bpy.data.collections.new(folder); scene.collection.children.link(col)
    for o in new:
        for c in o.users_collection:
            c.objects.unlink(o)
        col.objects.link(o)
        if o.name.startswith("Icosphere"):          # bone-shape widget, not part of the animal
            o.hide_render = o.hide_viewport = True
    arm = next(o for o in new if o.type == "ARMATURE")
    act = bpy.data.actions[action]
    arm.animation_data_create(); arm.animation_data.action = act
    if arm.animation_data.action_slot is None and len(act.slots):
        arm.animation_data.action_slot = act.slots[0]
    scene.frame_set(frame)
    rig = bpy.data.objects.new(f"{folder}_rig", None); col.objects.link(rig)
    for o in new:
        if o.parent is None:
            o.parent = rig
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in new:
        if o.type == "MESH" and not o.hide_render:
            e = o.evaluated_get(dg); m = e.to_mesh()
            pts += [e.matrix_world @ v.co for v in m.vertices]
            e.to_mesh_clear()
    if isinstance(forward[0], str):
        tail, head = (arm.matrix_world @ arm.pose.bones[b].head for b in forward)
        fwd = Vector((head.x - tail.x, head.y - tail.y, 0)).normalized()
    else:
        fwd = Vector((forward[0], forward[1], 0)).normalized()
    along = [p.dot(fwd) for p in pts]
    animal = Animal(rig, arm, pts[::25], length / (max(along) - min(along)), fwd)
    animal.place(loc, heading, pitch, ground)
    return animal


class Animal:
    """A posed, imported animal that can be re-placed per frame (for scroll sequences)."""

    def __init__(self, rig, arm, pts, scale, fwd):
        self.rig, self.arm, self.pts, self.scale, self.fwd = rig, arm, pts, scale, fwd

    def place(self, loc, heading, pitch=0.0, ground=True):
        from mathutils import Matrix
        turn = Matrix.Rotation(heading - math.atan2(self.fwd.y, self.fwd.x), 4, "Z")
        axis = Vector((-math.sin(heading), math.cos(heading), 0))
        M = Matrix.Rotation(-pitch, 4, axis) @ turn @ Matrix.Scale(self.scale, 4)
        q = [M @ p for p in self.pts]
        lo = Vector([min(p[i] for p in q) for i in range(3)]); hi = Vector([max(p[i] for p in q) for i in range(3)])
        base = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z if ground else (lo.z + hi.z) / 2))
        self.rig.matrix_world = Matrix.Translation(Vector(loc) - base) @ M


def mark(name, loc):
    """Empty where the house animal goes."""
    e = bpy.data.objects.new(name, None)
    e.location = loc
    bpy.context.scene.collection.objects.link(e)
    return e


def _socket(sockets, name, kind):
    return next(s for s in sockets if s.name == name and s.type == kind and s.enabled)


def scatter(ob, label, col, density, vgroup, smin, smax, seed, tilt=0.08):
    """Geometry-nodes scatter of a collection's objects over `vgroup`, density per m²."""
    ng = bpy.data.node_groups.new(label, "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N, L = ng.nodes, ng.links
    gi, go = N.new("NodeGroupInput"), N.new("NodeGroupOutput")
    dist = N.new("GeometryNodeDistributePointsOnFaces")
    dist.inputs["Seed"].default_value = seed
    na = N.new("GeometryNodeInputNamedAttribute"); na.data_type = "FLOAT"
    na.inputs["Name"].default_value = vgroup
    dens = N.new("ShaderNodeMath"); dens.operation = "MULTIPLY"; dens.inputs[1].default_value = density
    L.new(gi.outputs[0], dist.inputs["Mesh"])
    L.new(na.outputs["Attribute"], dens.inputs[0]); L.new(dens.outputs[0], dist.inputs["Density"])
    ci = N.new("GeometryNodeCollectionInfo")
    ci.inputs["Collection"].default_value = col
    ci.inputs["Separate Children"].default_value = True
    ci.inputs["Reset Children"].default_value = True
    iop = N.new("GeometryNodeInstanceOnPoints")
    iop.inputs["Pick Instance"].default_value = True
    L.new(dist.outputs["Points"], iop.inputs["Points"]); L.new(ci.outputs[0], iop.inputs["Instance"])
    ri = N.new("FunctionNodeRandomValue"); ri.data_type = "INT"
    _socket(ri.inputs, "Max", "INT").default_value = 999
    _socket(ri.inputs, "Seed", "INT").default_value = seed + 1
    L.new(_socket(ri.outputs, "Value", "INT"), iop.inputs["Instance Index"])
    rr = N.new("FunctionNodeRandomValue"); rr.data_type = "FLOAT_VECTOR"
    _socket(rr.inputs, "Min", "VECTOR").default_value = (-tilt, -tilt, 0)
    _socket(rr.inputs, "Max", "VECTOR").default_value = (tilt, tilt, 2 * math.pi)
    _socket(rr.inputs, "Seed", "INT").default_value = seed + 2
    e2r = N.new("FunctionNodeEulerToRotation")
    L.new(_socket(rr.outputs, "Value", "VECTOR"), e2r.inputs[0]); L.new(e2r.outputs[0], iop.inputs["Rotation"])
    rs = N.new("FunctionNodeRandomValue"); rs.data_type = "FLOAT"
    _socket(rs.inputs, "Min", "VALUE").default_value = smin
    _socket(rs.inputs, "Max", "VALUE").default_value = smax
    _socket(rs.inputs, "Seed", "INT").default_value = seed + 3
    L.new(_socket(rs.outputs, "Value", "VALUE"), iop.inputs["Scale"])
    join = N.new("GeometryNodeJoinGeometry")
    L.new(gi.outputs[0], join.inputs[0]); L.new(iop.outputs[0], join.inputs[0])
    L.new(join.outputs[0], go.inputs[0])
    ob.modifiers.new(label, "NODES").node_group = ng


def disc(name, centre, radius, z, mat, res=96):
    """Flat water disc; its rim tucks under the surrounding terrain."""
    bpy.ops.mesh.primitive_circle_add(vertices=res, radius=radius, fill_type="NGON",
                                      location=(centre[0], centre[1], z))
    o = bpy.context.object; o.name = name
    o.data.materials.append(mat)
    return o


# ---------------------------------------------------------------- light, camera, render
def world_and_sun(sun_energy=4.6, sun_rot=(55, 0, -50), sun_colour=(1.0, 0.93, 0.82), hdri_strength=1.1):
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Sky"); scene.world = world
    N, L = world.node_tree.nodes, world.node_tree.links
    bg = N["Background"]
    env = N.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(os.path.join(PH, "kloofendal_48d_partly_cloudy_puresky",
                                                  "kloofendal_48d_partly_cloudy_puresky_2k.exr"))
    L.new(env.outputs[0], bg.inputs["Color"]); bg.inputs["Strength"].default_value = hdri_strength
    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = sun_energy; sun_data.angle = math.radians(3); sun_data.color = sun_colour
    sun = bpy.data.objects.new("Sun", sun_data); scene.collection.objects.link(sun)
    sun.rotation_euler = tuple(math.radians(a) for a in sun_rot)


def camera(loc, target, lens=42):
    scene = bpy.context.scene
    cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = lens
    cam = bpy.data.objects.new("Cam", cam_data); scene.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam["target"] = tuple(target)
    scene.camera = cam
    return cam


def render(house, step=None, frames=48, orbit=22):
    """Render a still (draft/final), or with `-- seq` a scroll sequence: the camera swings
    `orbit` degrees around the island while `step(i, t)` advances the animal (t: 0..1)."""
    scene = bpy.context.scene
    bpy.context.view_layer.layer_collection.children["Assets"].exclude = True
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"; prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    draft = MODE == "draft"
    scene.cycles.samples = 48 if draft else 256
    scene.render.resolution_x, scene.render.resolution_y = (1280, 720) if draft else (1920, 1080)
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True     # the page's own sky shows through
    os.makedirs(os.path.join(ART, "renders"), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ART, "blender", f"{house}_island.blend"))
    if MODE != "seq":
        scene.render.filepath = os.path.join(ART, "renders", f"{house}_{MODE}.png")
        bpy.ops.render.render(write_still=True)
        print("RENDERED", scene.render.filepath)
        return
    scene.cycles.samples = 64
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.render.use_persistent_data = True
    out = os.path.join(ART, "renders", "seq", house)
    os.makedirs(out, exist_ok=True)
    cam = scene.camera
    target = Vector(cam["target"])
    start = cam.location.copy()
    only = [int(a) for a in os.environ.get("SEQ_FRAMES", "").split(",") if a]
    for i in range(frames):
        if only and i not in only:
            continue
        t = i / (frames - 1)
        ang = math.radians(orbit) * (t - 0.5)
        rel = start - Vector((target.x, target.y, start.z))
        cam.location = Vector((target.x, target.y, start.z)) + Vector((
            rel.x * math.cos(ang) - rel.y * math.sin(ang), rel.x * math.sin(ang) + rel.y * math.cos(ang), 0))
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        for mp in FLOWS:
            mp.inputs["Location"].default_value[1] = 0.09 * i
        if step:
            step(i, t)
        scene.render.filepath = os.path.join(out, f"f{i:03d}.png")
        bpy.ops.render.render(write_still=True)
        print("FRAME", house, i, flush=True)
