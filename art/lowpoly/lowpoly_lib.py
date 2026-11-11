"""Low-poly kit for the clan islands (Blender 5.2, headless).

Style (from refs/): papercraft low poly. Flat-shaded facets, each facet one flat colour, a small
palette, soft daylight. Animals are the licensed rigged models cut down to <1500 triangles, with
each facet coloured from the original texture so markings (tiger stripes, eagle head) survive.
"""
import bpy, bmesh, math, os, random, sys
import numpy as np
from mathutils import Vector, Matrix, noise

ART = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ANIMALS = os.path.join(ART, "animals")
OUT = os.path.abspath(os.path.join(ART, "..", "public", "clans"))
FPS = 24


def reset(seed=1):
    random.seed(seed)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.fps = FPS
    return s


def hexc(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # palette is authored in sRGB; colour attributes are linear
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


# ---------------------------------------------------------------- facet colouring
def flat_material(name="Facets", rough=0.85):
    """One shared material: base colour from the per-facet colour attribute."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    N, L = m.node_tree.nodes, m.node_tree.links
    bsdf = N["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rough
    ca = N.new("ShaderNodeVertexColor"); ca.layer_name = "Col"
    L.new(ca.outputs["Color"], bsdf.inputs["Base Color"])
    return m


def glow_material(name, colour, strength=3.0, alpha=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    bsdf = m.node_tree.nodes["Principled BSDF"]
    c = hexc(colour)
    bsdf.inputs["Base Color"].default_value = c
    bsdf.inputs["Emission Color"].default_value = c
    bsdf.inputs["Emission Strength"].default_value = strength
    bsdf.inputs["Alpha"].default_value = alpha
    if alpha < 1 and hasattr(m, "surface_render_method"):
        m.surface_render_method = "BLENDED"
    return m


def paint_faces(me, colour_fn):
    """Give every face a single colour: colour_fn(face) -> RGBA (linear)."""
    attr = me.color_attributes.get("Col") or me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    data = attr.data
    for p in me.polygons:
        c = colour_fn(p)
        for li in p.loop_indices:
            data[li].color = c
        p.use_smooth = False


def _texture_of(mat):
    if not mat or not mat.use_nodes:
        return None
    bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if not bsdf:
        return None
    sock = bsdf.inputs["Base Color"]
    seen = [sock.links[0].from_node] if sock.is_linked else []
    while seen:
        n = seen.pop()
        if n.type == "TEX_IMAGE" and n.image:
            return n.image
        seen += [l.from_node for i in n.inputs for l in i.links]
    return None


class _Sampler:
    def __init__(self, img):
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = px.reshape(h, w, 4)
        if img.colorspace_settings.name == "sRGB":      # texture bytes are sRGB; colour attributes are linear
            rgb = px[..., :3]
            px[..., :3] = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
        self.px, self.w, self.h = px, w, h

    def __call__(self, u, v):
        x = int((u % 1.0) * (self.w - 1)); y = int((v % 1.0) * (self.h - 1))
        # small box average so a facet takes its area's tone, not one noisy texel
        x0, x1 = max(0, x - 2), min(self.w, x + 3); y0, y1 = max(0, y - 2), min(self.h, y + 3)
        return self.px[y0:y1, x0:x1, :3].reshape(-1, 3).mean(axis=0)


# ---------------------------------------------------------------- animals
def import_animal(folder, keep=lambda o: True):
    """Import a Sketchfab glTF; returns (armature, [skinned meshes], new objects)."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ANIMALS, folder, "scene.gltf"))
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == "ARMATURE")
    meshes, drop = [], []
    for o in new:
        if o.type != "MESH":
            continue
        (drop if o.name.startswith("Icosphere") or not keep(o) else meshes).append(o)
    for o in drop:
        new.remove(o)
        bpy.data.objects.remove(o, do_unlink=True)
    return arm, meshes, new


def lowpoly_animal(folder, tris=1400, recolour=None, palette_snap=0.06, keep=lambda o: True, rebuild=None, reshape=None):
    """Cut a rigged animal down to ~`tris` triangles and colour each facet from its texture.

    recolour(rgb) -> rgb optionally remaps sampled colours (e.g. orca black/white -> dolphin greys).
    rebuild=(thickness, voxel) closes card geometry (feathers) into a solid and remeshes it, then
    copies weights and colours back from the original; needed when the model is built from thin cards.
    reshape(Vector) -> Vector optionally edits rest-pose vertex positions (e.g. shorter dorsal fin).
    Returns (armature, mesh).
    """
    arm, meshes, new = import_animal(folder, keep)
    samplers = {}
    # bake each source facet's texture colour into a face-corner attribute before joining/decimating
    for o in meshes:
        me = o.data
        uv = me.uv_layers.active
        attr = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
        for p in me.polygons:
            mat = o.material_slots[p.material_index].material if o.material_slots else None
            img = _texture_of(mat)
            if img is not None and img.name not in samplers:
                samplers[img.name] = _Sampler(img)
            if img is not None and uv:
                u = sum(uv.data[li].uv.x for li in p.loop_indices) / p.loop_total
                v = sum(uv.data[li].uv.y for li in p.loop_indices) / p.loop_total
                rgb = samplers[img.name](u, v)
            else:
                bc = mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value if mat and mat.use_nodes and "Principled BSDF" in mat.node_tree.nodes else (0.5, 0.5, 0.5, 1)
                rgb = np.array(bc[:3])
            for li in p.loop_indices:
                attr.data[li].color = (*rgb, 1.0)
    # one skinned mesh
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active
    body.name = f"{folder}_lowpoly"
    if reshape:
        for v in body.data.vertices:
            v.co = reshape(v.co)
    if rebuild:
        _rebuild_solid(body, *rebuild)
    # weld seams, then collapse to the budget (before the armature modifier, so weights carry over)
    bm = bmesh.new(); bm.from_mesh(body.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4 * max(body.dimensions))
    bm.to_mesh(body.data); bm.free()
    cur = sum(len(p.vertices) - 2 for p in body.data.polygons)
    if cur > tris:
        dec = body.modifiers.new("Decimate", "DECIMATE")
        dec.ratio = tris / cur
        dec.use_collapse_triangulate = True
        while body.modifiers[0].name != "Decimate":
            bpy.ops.object.modifier_move_up(modifier="Decimate")
        bpy.ops.object.modifier_apply(modifier="Decimate")
    # flatten: one colour per facet (mean of its corners), lightly snapped so facets read as a palette
    me = body.data
    attr = me.color_attributes["Col"]
    snap = palette_snap
    def facet(p):
        c = np.mean([attr.data[li].color[:3] for li in p.loop_indices], axis=0)
        if recolour:
            if recolour.__code__.co_argcount == 2:
                pos = body.matrix_world @ (sum((me.vertices[v].co for v in p.vertices), Vector()) / p.loop_total)
                c = np.array(recolour(c, pos))
            else:
                c = np.array(recolour(c))
        if snap:
            c = np.round(c / snap) * snap
        return (*np.clip(c, 0, 1), 1.0)
    cols = {p.index: facet(p) for p in me.polygons}
    paint_faces(me, lambda p: cols[p.index])
    me.materials.clear()
    me.materials.append(flat_material())
    return arm, body


def normalize(arm, body, size, frame=None, upright_axis="z"):
    """Parent the whole imported animal under one empty, scaled so its largest extent is `size`,
    standing on the origin. Returns the empty (move/rotate that to place the animal)."""
    if frame is not None:
        bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    e = body.evaluated_get(dg); m = e.to_mesh()
    pts = [e.matrix_world @ v.co for v in m.vertices]; e.to_mesh_clear()
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    s = size / max(mx - mn)
    rig = bpy.data.objects.new(f"{body.name}_rig", None)
    bpy.context.scene.collection.objects.link(rig)
    root = root_of(arm)
    root.parent = rig
    c = (mn + mx) / 2
    root.matrix_parent_inverse = Matrix.Scale(s, 4) @ Matrix.Translation(-Vector((c.x, c.y, mn.z)))
    return rig


def _rebuild_solid(body, thickness, voxel):
    """Solidify + voxel remesh a card-built mesh, then transfer vertex weights and facet colours
    back from a copy of the original so it still deforms with the rig."""
    src = body.copy(); src.data = body.data.copy()
    bpy.context.scene.collection.objects.link(src)
    for m in list(src.modifiers):
        src.modifiers.remove(m)
    arm_mods = [(m.name, m.object) for m in body.modifiers if m.type == "ARMATURE"]
    for m in list(body.modifiers):
        body.modifiers.remove(m)
    bpy.context.view_layer.objects.active = body
    sol = body.modifiers.new("Solid", "SOLIDIFY"); sol.thickness = thickness; sol.offset = 0
    bpy.ops.object.modifier_apply(modifier="Solid")
    body.data.remesh_voxel_size = voxel
    bpy.ops.object.voxel_remesh()
    body.vertex_groups.clear()
    for g in src.vertex_groups:
        body.vertex_groups.new(name=g.name)
    dt = body.modifiers.new("Transfer", "DATA_TRANSFER")
    dt.object = src
    dt.use_vert_data = True; dt.data_types_verts = {"VGROUP_WEIGHTS"}; dt.vert_mapping = "POLYINTERP_NEAREST"
    dt.layers_vgroup_select_src = "ALL"; dt.layers_vgroup_select_dst = "NAME"
    dt.use_loop_data = True; dt.data_types_loops = {"COLOR_CORNER"}; dt.loop_mapping = "POLYINTERP_NEAREST"
    if "Col" not in body.data.color_attributes:
        body.data.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    bpy.ops.object.modifier_apply(modifier="Transfer")
    for name, ob in arm_mods:
        a = body.modifiers.new(name, "ARMATURE"); a.object = ob
    bpy.data.objects.remove(src, do_unlink=True)


def slot_for(act, arm):
    """The action slot that animates this armature (glTF actions carry one slot per animated node)."""
    for sl in act.slots:
        if sl.target_id_type == "OBJECT" and arm.name in (sl.name_display, sl.identifier[2:]):
            return sl
    return next((sl for sl in act.slots if sl.target_id_type == "OBJECT"), act.slots[0])


def set_action(arm, name):
    act = bpy.data.actions[name]
    arm.animation_data_create()
    arm.animation_data.action = act
    if len(act.slots):
        arm.animation_data.action_slot = slot_for(act, arm)
    return act


def root_of(o):
    while o.parent:
        o = o.parent
    return o


# ---------------------------------------------------------------- preview render
def preview(path, cam_loc, target, lens=50, size=(1200, 800), transparent=False):
    s = bpy.context.scene
    cd = bpy.data.cameras.new("PreviewCam"); cd.lens = lens; cd.clip_end = 5000
    cam = bpy.data.objects.new("PreviewCam", cd); s.collection.objects.link(cam)
    cam.location = cam_loc
    cam.rotation_euler = (Vector(target) - Vector(cam_loc)).to_track_quat("-Z", "Y").to_euler()
    s.camera = cam
    if "Sun" not in bpy.data.objects:
        sd = bpy.data.lights.new("Sun", "SUN"); sd.energy = 3.0; sd.angle = math.radians(6)
        sun = bpy.data.objects.new("Sun", sd); s.collection.objects.link(sun)
        sun.rotation_euler = (math.radians(50), 0, math.radians(-40))
    w = s.world or bpy.data.worlds.new("W"); s.world = w
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.78, 0.86, 0.92, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
    s.render.engine = "BLENDER_EEVEE"
    s.render.resolution_x, s.render.resolution_y = size
    s.render.film_transparent = transparent
    s.view_settings.view_transform = "Standard"
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------- props (all flat-shaded, palette colours)
PAL = {
    "grass": ["#7fb53f", "#8cc34a", "#6fa437", "#97c95a"],
    "grass_dry": ["#b8b45a", "#c9bf6a", "#a9a24f"],
    "cliff": [["#9a7656", "#8a6748", "#a7805d"], ["#7d5a40", "#8c6749", "#715037"], ["#6a4a35", "#5f412f", "#76523a"]],
    "under": ["#5a4033", "#4f382d", "#634638"],
    "leaf": ["#5aa43a", "#6cb845", "#4c9032", "#7cc24e"],
    "pine": ["#2f6b3c", "#3a7a47", "#285d34"],
    "trunk": ["#7a5236", "#6b4730"],
    "rock": ["#9ea3a8", "#8d9297", "#b0b4b8", "#7f858b"],
    "sand": ["#e8d6a8", "#dcc795", "#f0e0b8"],
    "dirt": ["#c9a56c", "#bd975f", "#d3b47d"],
    "sea": ["#3f8fc4", "#4a9bd0", "#3683b8", "#5aa9da"],
    "sea_deep": ["#2c6f9f", "#2a6896", "#3277a8"],
    "foam": ["#e9f4fb", "#d7ebf7"],
    "cloud": ["#ffffff", "#f3f6f8", "#e9eef2"],
}


def pick(key, i=None):
    opts = PAL[key]
    return hexc(opts[i % len(opts)] if i is not None else random.choice(opts))


def mesh_object(name, bm, colour_fn, col=None):
    """colour_fn(face) -> colour, or None when the bmesh already carries a "Col" loop colour layer."""
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if colour_fn:
        paint_faces(me, colour_fn)
    else:
        for p in me.polygons:
            p.use_smooth = False
    me.materials.append(flat_material())
    o = bpy.data.objects.new(name, me)
    (col or bpy.context.scene.collection).objects.link(o)
    return o


def jitter(bm, amount, seed=0):
    for v in bm.verts:
        n = noise.noise(v.co * 1.7 + Vector((seed, seed * 0.5, 0)))
        v.co += Vector((noise.noise(v.co * 2.1 + Vector((seed, 0, 1))), noise.noise(v.co * 2.3 + Vector((0, seed, 2))), n)) * amount


def rock(name, size=1.0, seed=0, col=None, flat_base=True, palette="rock"):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    jitter(bm, 0.22, seed)
    for v in bm.verts:
        v.co = Vector((v.co.x * size, v.co.y * size * 0.9, v.co.z * size * 0.75))
        if flat_base and v.co.z < -0.25 * size:
            v.co.z = -0.25 * size
    rnd = random.Random(seed)
    return mesh_object(name, bm, lambda p: hexc(rnd.choice(PAL[palette])), col)


def tree(name, height=3.0, seed=0, col=None):
    """Broadleaf: bent faceted trunk with a cluster of icosahedron canopies (refs: tree on grass)."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.16 * height / 3, radius2=0.08 * height / 3, depth=height * 0.62)
    for v in bm.verts:
        v.co.z += height * 0.31
        v.co.x += 0.12 * math.sin(v.co.z * 1.7 + seed)
    trunk = len(bm.faces)
    for k in range(rnd.randint(3, 5)):
        r = height * rnd.uniform(0.2, 0.3)
        c = Vector((rnd.uniform(-0.45, 0.45) * height / 3, rnd.uniform(-0.45, 0.45) * height / 3, height * rnd.uniform(0.62, 0.9)))
        ico = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
        bmesh.ops.translate(bm, verts=ico["verts"], vec=c)
    shades = [hexc(rnd.choice(PAL["leaf"])) for _ in range(6)]
    return mesh_object(name, bm, lambda p: hexc(PAL["trunk"][p.index % 2]) if p.index < trunk else shades[p.index % 6], col)


def pine(name, height=3.2, seed=0, col=None):
    rnd = random.Random(seed)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.12, radius2=0.08, depth=height * 0.3)
    for v in bm.verts:
        v.co.z += height * 0.15
    trunk = len(bm.faces)
    for k, (z, r) in enumerate([(0.32, 0.36), (0.55, 0.28), (0.76, 0.19)]):
        cone = bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=height * r, radius2=0.0, depth=height * 0.36)
        bmesh.ops.translate(bm, verts=cone["verts"], vec=Vector((0, 0, height * z + height * 0.12)))
    jitter(bm, 0.03, seed)
    return mesh_object(name, bm, lambda p: hexc(PAL["trunk"][0]) if p.index < trunk else hexc(PAL["pine"][(p.index + seed) % 3]), col)


def bush(name, size=0.6, seed=0, col=None):
    rnd = random.Random(seed)
    bm = bmesh.new()
    for k in range(rnd.randint(2, 3)):
        ico = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=size * rnd.uniform(0.6, 1.0))
        bmesh.ops.translate(bm, verts=ico["verts"], vec=Vector((rnd.uniform(-0.5, 0.5) * size, rnd.uniform(-0.5, 0.5) * size, size * 0.5)))
    jitter(bm, 0.05, seed)
    return mesh_object(name, bm, lambda p: hexc(PAL["leaf"][(p.index * 7 + seed) % 4]), col)


def cloud(name, size=2.0, seed=0, col=None):
    rnd = random.Random(seed)
    bm = bmesh.new()
    for k in range(rnd.randint(3, 5)):
        r = size * rnd.uniform(0.35, 0.6)
        ico = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
        bmesh.ops.translate(bm, verts=ico["verts"], vec=Vector(((k - 2) * size * 0.45, rnd.uniform(-0.2, 0.2) * size, rnd.uniform(0, 0.25) * size)))
    for v in bm.verts:
        v.co.z = max(v.co.z, -size * 0.15)       # flat underside, like the reference clouds
    return mesh_object(name, bm, lambda p: hexc(PAL["cloud"][p.index % 3]), col)


def island(name, radius=8.0, depth=7.0, seed=0, top="grass", col=None, top_height=None, segments=22, n_rings=5):
    """Faceted floating island: grassy top, three cliff strata with small ledges, tapering underside."""
    rnd = random.Random(seed)
    top_height = top_height or (lambda x, y: 0.0)
    bm = bmesh.new()
    S = segments
    th = [2 * math.pi * i / S for i in range(S)]
    R = [radius * (1 + 0.12 * noise.noise(Vector((math.cos(a) * 1.3, math.sin(a) * 1.3, seed)))) for a in th]
    rings, kinds = [], []
    centre = bm.verts.new((0, 0, top_height(0, 0)))
    for k, t in enumerate([(i + 1) / n_rings for i in range(n_rings)]):   # top: staggered rings -> irregular facets
        ring = []
        for a, r in zip(th, R):
            a2 = a + (math.pi / S if k % 2 else 0) + rnd.uniform(-0.08, 0.08)
            tt = t * rnd.uniform(0.92, 1.05) if t < 1 else 1.0
            x, y = math.cos(a2) * r * tt, math.sin(a2) * r * tt
            bump = min(1.0, 5 / n_rings)          # denser tops get gentler bumps so they don't turn spiky
            ring.append(bm.verts.new((x, y, top_height(x, y) + rnd.uniform(-0.18, 0.14) * bump * (1 if t < 1 else 0.4))))
        rings.append(ring); kinds.append("top")
    z = 0.0
    for band, (dz, out) in enumerate([(0.9, 1.04), (1.0, 0.97), (0.9, 1.0)]):   # cliff strata
        z -= dz
        rings.append([bm.verts.new((math.cos(a) * r * out * rnd.uniform(0.97, 1.03), math.sin(a) * r * out * rnd.uniform(0.97, 1.03), z + rnd.uniform(-0.15, 0.15))) for a, r in zip(th, R)])
        kinds.append(f"cliff{band}")
    for k, f in enumerate((0.78, 0.52, 0.26)):                     # underside
        z -= depth * 0.25
        rings.append([bm.verts.new((math.cos(a) * r * f * rnd.uniform(0.85, 1.12) + 0.4 * k, math.sin(a) * r * f * rnd.uniform(0.85, 1.12), z + rnd.uniform(-0.4, 0.4))) for a, r in zip(th, R)])
        kinds.append("under")
    tip = bm.verts.new((1.2, 0.3, z - depth * 0.22))
    faces_kind = []
    for i in range(S):
        bm.faces.new((centre, rings[0][i], rings[0][(i + 1) % S])); faces_kind.append("top")
    kinds[0:n_rings] = ["top"] * n_rings
    for (a, b), kind in zip(zip(rings[:-1], rings[1:]), kinds[1:]):
        for i in range(S):
            i2 = (i + 1) % S
            bm.faces.new((a[i], b[i], b[i2])); bm.faces.new((a[i], b[i2], a[i2]))
            faces_kind += [kind, kind]
    for i in range(S):
        bm.faces.new((rings[-1][i], tip, rings[-1][(i + 1) % S])); faces_kind.append("under")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    rim = [tuple(v.co) for v in rings[n_rings - 1]]       # top edge, for meshes that must meet it (a sea)

    def colour(p):
        k = faces_kind[p.index]
        if k == "top":
            return hexc(rnd.choice(PAL[top]))
        if k.startswith("cliff"):
            return hexc(rnd.choice(PAL["cliff"][int(k[-1])]))
        return hexc(rnd.choice(PAL["under"]))
    o = mesh_object(name, bm, colour, col)
    o["radius"] = radius
    o["rim"] = [c for v in rim for c in v]
    return o


def scatter_on(objs_fn, n, radius, avoid=(), seed=0, min_r=0.0, z_fn=lambda x, y: 0.0):
    """Place n props on an island's top at random spots outside `avoid` (list of (x, y, r))."""
    rnd = random.Random(seed)
    placed = []
    tries = 0
    while len(placed) < n and tries < n * 40:
        tries += 1
        a = rnd.uniform(0, 2 * math.pi); r = radius * math.sqrt(rnd.uniform((min_r / radius) ** 2, 1))
        x, y = math.cos(a) * r, math.sin(a) * r
        if any((x - ax) ** 2 + (y - ay) ** 2 < ar ** 2 for ax, ay, ar in avoid):
            continue
        o = objs_fn(len(placed))
        o.location = (x, y, z_fn(x, y) - 0.05)
        o.rotation_euler.z = rnd.uniform(0, 2 * math.pi)
        placed.append(o)
    return placed


# ---------------------------------------------------------------- animation helpers
def nla_sequence(arm, clips, overlap=6, bone_scale=None):
    """Bake clips played back to back into one looping action on the armature.

    clips: [(action, start_frame, action_start, action_end, repeat)]. Each loop frame samples the
    clip that covers it; for `overlap` frames after a clip starts, its pose is blended from the
    previous clip's so changes don't pop. The result is a single action, so nothing depends on
    NLA stacking at export time.
    """
    from mathutils import Quaternion
    s = bpy.context.scene
    ad = arm.animation_data_create()
    for tr in list(ad.nla_tracks):        # the glTF importer stashes every clip as a live track
        ad.nla_tracks.remove(tr)
    bones = arm.pose.bones
    for b in bones:
        b.rotation_mode = "QUATERNION"
    spans = []
    for clip in clips:
        name, start, a0, a1, repeat = clip[:5]
        dur = clip[5] if len(clip) > 5 else (a1 - a0) * repeat      # optional: squeeze whole cycles into dur
        spans.append((name, start, start + dur, a0, a1, (a1 - a0) * repeat / dur))
    last = int(math.ceil(spans[-1][2]))

    def sample(name, a0, a1, start, f, rate=1.0):
        local = a0 + (((f - start) * rate) % (a1 - a0))
        set_action(arm, name)
        s.frame_set(int(local), subframe=local - int(local))
        return {b.name: (b.location.copy(), b.rotation_quaternion.copy(), b.scale.copy()) for b in bones}

    frames = {}
    for f in range(int(spans[0][1]), last + 1):
        i = max(k for k, sp in enumerate(spans) if sp[1] <= f)
        name, start, stop, a0, a1, rate = spans[i]
        pose = sample(name, a0, a1, start, f, rate)
        if i and f - start < overlap:
            pn, ps, pe, p0, p1, pr = spans[i - 1]
            prev = sample(pn, p0, p1, ps, min(f, pe), pr)
            w = (f - start + 1) / (overlap + 1)
            pose = {k: (prev[k][0].lerp(v[0], w), prev[k][1].slerp(v[1], w), prev[k][2].lerp(v[2], w)) for k, v in pose.items()}
        frames[f] = pose
    if bone_scale:
        for pose in frames.values():
            for bname, k in bone_scale.items():
                l, r, sc = pose[bname]
                pose[bname] = (l, r, sc * k)
    loop = bpy.data.actions.new(f"{arm.name}_loop")
    ad.action = loop
    for f, pose in frames.items():
        for b in bones:
            b.location, b.rotation_quaternion, b.scale = pose[b.name]
            b.keyframe_insert("location", frame=f)
            b.keyframe_insert("rotation_quaternion", frame=f)
            b.keyframe_insert("scale", frame=f)
    return loop


def key_path(obj, frames, fn):
    """Key obj location/heading every frame from fn(frame) -> (Vector loc, heading, pitch, roll)."""
    prev = None
    for f in frames:
        loc, heading, pitch, roll = fn(f)
        if prev is not None:                       # keep heading continuous so it never spins the long way
            while heading - prev > math.pi: heading -= 2 * math.pi
            while heading - prev < -math.pi: heading += 2 * math.pi
        prev = heading
        obj.location = loc
        obj.rotation_euler = (roll, pitch, heading)
        obj.keyframe_insert("location", frame=f)
        obj.keyframe_insert("rotation_euler", frame=f)


def facing(rig, fwd):
    """Offset so that heading 0 means the animal faces +X (fwd = model's own nose direction)."""
    return -math.atan2(fwd[1], fwd[0])


def tidy_for_export():
    """Drop what the Sketchfab imports leave behind: childless empty nodes (feather sockets etc.)
    and every action no object is actually playing, so the GLB carries one clip and a lean tree."""
    for o in bpy.data.objects:
        if o.animation_data:
            for tr in list(o.animation_data.nla_tracks):
                o.animation_data.nla_tracks.remove(tr)
    changed = True
    while changed:
        changed = False
        for o in list(bpy.data.objects):
            if o.type == "EMPTY" and not o.children:
                bpy.data.objects.remove(o, do_unlink=True)
                changed = True
    # imported node hierarchy (root, scene root...) should not carry the source clips either
    ours = lambda a: a.name.endswith("_loop") or a.name.endswith("Action") or a.name.startswith("Key")
    for o in bpy.data.objects:
        if o.animation_data and o.animation_data.action and not ours(o.animation_data.action):
            o.animation_data.action = None
    used = {o.animation_data.action for o in bpy.data.objects if o.animation_data and o.animation_data.action}
    used |= {k.animation_data.action for k in bpy.data.shape_keys if k.animation_data and k.animation_data.action}
    for a in list(bpy.data.actions):
        if a not in used:
            bpy.data.actions.remove(a)


def export_glb(name, frames):
    tidy_for_export()
    s = bpy.context.scene
    s.name = "Loop"
    s.frame_start, s.frame_end = 1, frames
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", export_animation_mode="SCENE", export_force_sampling=True,
        export_frame_range=True, export_anim_single_armature=True, export_yup=True, export_apply=False,
        export_lights=False, export_cameras=False, export_morph=True, export_morph_animation=True,
        export_optimize_animation_size=True, export_anim_scene_split_object=False,
    )
    print("EXPORTED", path, os.path.getsize(path) // 1024, "KB")
    return path


# ---------------------------------------------------------------- birds (shape-key flapping)
def _wing_keys(body, x0, span, fwd_axis="Y"):
    """Add flap shape keys to a bird mesh whose wings run along ±X: 'up', 'down' and 'fold'.
    Vertices beyond the shoulder (|x| > x0) rotate about the body's long axis."""
    me = body.data
    if not me.shape_keys:
        body.shape_key_add(name="Basis")
    zs = sorted(v.co.z for v in me.vertices)
    z0 = zs[len(zs) // 2]
    half = span / 2

    def key(name, deg, fold=0.0):
        k = body.shape_key_add(name=name)
        for i, v in enumerate(me.vertices):
            x, y, z = v.co
            if abs(x) <= x0:
                continue
            s = 1 if x > 0 else -1
            d = (abs(x) - x0) / max(1e-6, half - x0)
            a = math.radians(deg) * min(1.0, d) ** 0.8
            r = abs(x) - x0
            if fold:
                r *= 1 - fold * min(1.0, d)
            nx = s * (x0 + r * math.cos(a)) - s * 0
            nz = z0 + (z - z0) + r * math.sin(a)
            ny = y + (fold * 0.25 * span * min(1.0, d) if fold else 0)
            k.data[i].co = Vector((nx, ny, nz))
        return k
    key("up", 55)
    key("down", -45)
    key("fold", -70, fold=0.72)


def bird_from_rig(folder, size, colours, frame, rebuild=None, tris=1200):
    """A low-poly bird posed at `frame` (wings spread), frozen to a plain mesh with flap shape keys.
    Returns (rig_empty, mesh); the empty faces -Y like the source eagle."""
    arm, body = lowpoly_animal(folder, tris, recolour=colours, rebuild=rebuild)
    set_action(arm, "GltfAnimation 0")
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    e = body.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(e)            # bake the posed shape
    world = body.matrix_world.copy()
    me.transform(world)
    root = root_of(arm)
    doomed = [root] + list(root.children_recursive)
    for o in doomed:
        bpy.data.objects.remove(o, do_unlink=True)
    for p in me.polygons:
        p.use_smooth = False
    pts = [v.co for v in me.vertices]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    s = size / (mx.x - mn.x)                            # size = wingspan
    c = (mn + mx) / 2
    me.transform(Matrix.Scale(s, 4) @ Matrix.Translation(-c))
    me.materials.clear(); me.materials.append(flat_material())
    bird = bpy.data.objects.new(f"{folder}_bird", me)
    bpy.context.scene.collection.objects.link(bird)
    _wing_keys(bird, x0=0.12 * size, span=size)
    rig = bpy.data.objects.new(f"{folder}_bird_rig", None)
    bpy.context.scene.collection.objects.link(rig)
    bird.parent = rig
    return rig, bird


def tiny_bird(name, size=0.5, colour="#3d3a3f", belly="#e8e2d6"):
    """Small songbird for flocks: faceted body, head, tail and two wings, with flap keys."""
    bm = bmesh.new()
    body = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    for v in body["verts"]:
        v.co = Vector((v.co.x * 0.16, v.co.y * 0.36, v.co.z * 0.14)) * size
    head = bmesh.ops.create_icosphere(bm, subdivisions=0, radius=0.11 * size)
    bmesh.ops.translate(bm, verts=head["verts"], vec=Vector((0, -0.34 * size, 0.07 * size)))
    n_body = len(bm.faces)
    for s in (1, -1):                                   # wings: two triangles each
        a = bm.verts.new((s * 0.12 * size, -0.12 * size, 0.02 * size))
        b = bm.verts.new((s * 0.12 * size, 0.12 * size, 0.02 * size))
        c = bm.verts.new((s * 0.55 * size, 0.08 * size, 0.03 * size))
        d = bm.verts.new((s * 0.36 * size, -0.05 * size, 0.03 * size))
        bm.faces.new((a, b, d) if s > 0 else (a, d, b)); bm.faces.new((b, c, d) if s > 0 else (b, d, c))
        a2 = bm.verts.new((s * 0.12 * size, -0.12 * size, 0.0)); b2 = bm.verts.new((s * 0.12 * size, 0.12 * size, 0.0))
        c2 = bm.verts.new((s * 0.55 * size, 0.08 * size, 0.01 * size)); d2 = bm.verts.new((s * 0.36 * size, -0.05 * size, 0.01 * size))
        bm.faces.new((a2, d2, b2) if s > 0 else (a2, b2, d2)); bm.faces.new((b2, d2, c2) if s > 0 else (b2, c2, d2))
    t1 = bm.verts.new((0.07 * size, 0.3 * size, 0.0)); t2 = bm.verts.new((-0.07 * size, 0.3 * size, 0.0)); t3 = bm.verts.new((0, 0.55 * size, 0.02 * size))
    bm.faces.new((t1, t2, t3))
    rnd = random.Random(hash(name) & 0xffff)
    def col(p):
        if p.index < n_body:
            return hexc(belly) if p.normal.z < -0.3 else hexc(colour)
        return hexc(colour)
    o = mesh_object(name, bm, col)
    _wing_keys(o, x0=0.12 * size, span=1.1 * size)
    return o


def flap(obj, frames, period, phase=0.0, glide=None, fold=None, amp=1.0):
    """Key the bird's wing shapes: a sine flap with optional glide spans (wings held level)
    and fold spans (wings closed). glide/fold: callables frame -> 0..1 weight."""
    keys = obj.data.shape_keys.key_blocks
    for f in frames:
        w = amp * (1 - (glide(f) if glide else 0)) * (1 - (fold(f) if fold else 0))
        s = math.sin(2 * math.pi * (f / period + phase))
        keys["up"].value = max(0.0, s) * w
        keys["down"].value = max(0.0, -s) * w
        keys["fold"].value = fold(f) if fold else 0.0
        for k in ("up", "down", "fold"):
            keys[k].keyframe_insert("value", frame=f)


def flock(name, n, centre, radius, height, frames, laps=1, seed=0, size=0.45, colour="#3d3a3f"):
    """A loose flock of small birds circling `centre`, each flapping on its own beat."""
    rnd = random.Random(seed)
    end = frames[-1]
    for i in range(n):
        b = tiny_bird(f"{name}{i}", size * rnd.uniform(0.85, 1.15), colour)
        r = radius * rnd.uniform(0.8, 1.2); h = height + rnd.uniform(-0.8, 0.8); ph = rnd.uniform(0, 2 * math.pi)
        d = 1 if seed % 2 == 0 else -1
        def path(f, r=r, h=h, ph=ph):
            th = ph + d * laps * 2 * math.pi * (f - 1) / (end - 1)
            return (Vector((centre[0] + math.cos(th) * r, centre[1] + math.sin(th) * r, h + 0.4 * math.sin(3 * th + ph))),
                    th + d * math.pi / 2 + math.pi / 2, d * math.radians(-15), 0)
        key_path(b, frames, path)
        period = (end - 1) / max(1, round((end - 1) / rnd.uniform(8, 11)))      # whole beats per loop
        flap(b, frames, period, rnd.uniform(0, 1))


BIRD_LOOKS = {
    # body, wing shades, primaries, head, tail, beak
    "eagle": dict(body=["#4a3324", "#563b29", "#3f2b1e"], wing=["#4f3626", "#5d402c", "#45301f"], tip="#2c1f16",
                  head="#f4f1ea", tail="#f1eee6", beak="#e9b62e", slim=1.0),
    "gull": dict(body=["#eef1f3", "#e2e7ea"], wing=["#a3adb5", "#97a2ab", "#aeb7be"], tip="#2a2b2e",
                 head="#f6f7f8", tail="#eef1f3", beak="#f0b53a", slim=0.72),
}


def make_bird(name, span, kind="eagle", talons=True):
    """Hand-built low-poly bird facing -Y with wings along ±X (papercraft style, see refs/)."""
    L = BIRD_LOOKS[kind]
    k = span
    bm = bmesh.new()
    col_layer = bm.loops.layers.float_color.new("Col")
    painted = set()
    pending = [None]

    def mark(fn):
        """Colour every face made since the last mark with the previous picker, then switch."""
        flush()
        pending[0] = fn

    def flush():
        if pending[0] is None:
            return
        for i, f in enumerate(x for x in bm.faces if x not in painted):
            c = hexc(pending[0](i))
            for lp in f.loops:
                lp[col_layer] = c
            painted.add(f)

    rnd = random.Random(hash(name) & 0xffff)
    mark(lambda i: L["body"][i % len(L["body"])])
    b = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    for v in b["verts"]:
        v.co = Vector((v.co.x * 0.11 * k * L["slim"] ** 0.5, v.co.y * 0.34 * k, v.co.z * 0.11 * k))
    mark(lambda i: L["head"])
    h = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.075 * k)
    bmesh.ops.translate(bm, verts=h["verts"], vec=Vector((0, -0.33 * k, 0.05 * k)))
    mark(lambda i: L["beak"])
    c = bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.03 * k, radius2=0.0, depth=0.09 * k)
    bmesh.ops.rotate(bm, verts=c["verts"], cent=Vector(), matrix=Matrix.Rotation(math.radians(-100), 3, "X"))
    bmesh.ops.translate(bm, verts=c["verts"], vec=Vector((0, -0.42 * k, 0.03 * k)))
    mark(lambda i: L["tail"])
    tail = [Vector((-0.05, 0.28, 0.0)), Vector((0.05, 0.28, 0.0)), Vector((0.14, 0.55, 0.01)), Vector((0.0, 0.6, 0.02)), Vector((-0.14, 0.55, 0.01))]
    tv = [bm.verts.new(p * k) for p in tail]
    bm.faces.new((tv[0], tv[1], tv[3])); bm.faces.new((tv[1], tv[2], tv[3])); bm.faces.new((tv[0], tv[3], tv[4]))
    # wings: leading and trailing edges, quads between them, splayed primaries at the tip
    lead = [(0.08, -0.07), (0.24, -0.11), (0.38, -0.1), (0.5, -0.04)]
    trail = [(0.08, 0.12), (0.24, 0.17), (0.37, 0.15), (0.47, 0.07)]
    for s in (1, -1):
        mark(lambda i: L["wing"][i % len(L["wing"])])
        lv = [bm.verts.new((s * x * k, y * k * L["slim"], 0.02 * k + 0.03 * k * (x / 0.5))) for x, y in lead]
        tv2 = [bm.verts.new((s * x * k, y * k * L["slim"], 0.015 * k + 0.02 * k * (x / 0.5))) for x, y in trail]
        for i in range(3):
            q = (lv[i], lv[i + 1], tv2[i + 1], tv2[i])
            bm.faces.new(q if s > 0 else q[::-1])
        mark(lambda i: L["tip"])
        tipx, tipy = 0.5, -0.04
        for j, (fx, fy) in enumerate([(0.62, -0.02), (0.63, 0.04), (0.6, 0.1), (0.55, 0.14)]):
            a = lv[3] if j == 0 else bm.verts.new((s * (0.48 + 0.005 * j) * k, (-0.02 + 0.03 * j) * k * L["slim"], 0.05 * k))
            b2 = bm.verts.new((s * fx * k, fy * k * L["slim"], 0.055 * k))
            c2 = bm.verts.new((s * (0.47 + 0.006 * j) * k, (0.01 + 0.03 * j) * k * L["slim"], 0.05 * k))
            bm.faces.new((a, b2, c2) if s > 0 else (a, c2, b2))
    if talons:
        mark(lambda i: L["beak"])
        for s in (1, -1):
            t = bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.022 * k, radius2=0.012 * k, depth=0.08 * k)
            bmesh.ops.translate(bm, verts=t["verts"], vec=Vector((s * 0.04 * k, 0.08 * k, -0.11 * k)))
    flush()
    o = mesh_object(name, bm, None)
    _wing_keys(o, x0=0.08 * k, span=1.26 * k)
    return o


# ---------------------------------------------------------------- ground contact
def ground_bvh(objs):
    """One BVH of the walkable surfaces (island top, rocks, logs) in world space."""
    from mathutils.bvhtree import BVHTree
    bpy.context.view_layer.update()
    bm = bmesh.new()
    for o in objs:
        tmp = bmesh.new(); tmp.from_mesh(o.data); tmp.transform(o.matrix_world)
        me = bpy.data.meshes.new("_g"); tmp.to_mesh(me); tmp.free()
        bm.from_mesh(me); bpy.data.meshes.remove(me)
    tree = BVHTree.FromBMesh(bm); bm.free()

    def gz(x, y, above=None):
        """Height of the first surface below (x, y, above); `above` defaults to high in the sky."""
        hit = tree.ray_cast(Vector((x, y, 60.0 if above is None else above)), Vector((0, 0, -1)))
        return hit[0].z if hit[0] else -0.35
    return gz


def plant(rig, body, frames, gz, grounded, sink=0.03, stride=2):
    """Re-key the rig's height so the animal's lowest point touches the ground on `grounded` frames
    (feet on uneven terrain, a flank when it lies on its side). Other frames (leaps, riding on a
    sibling) take the correction interpolated from the grounded frames around them, then are only
    lifted where they would cut into the ground."""
    s = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    need = {}
    for f in frames:
        s.frame_set(f)
        e = body.evaluated_get(dg); m = e.to_mesh()
        co = np.empty(len(m.vertices) * 3, dtype=np.float32); m.vertices.foreach_get("co", co)
        mw = np.array(e.matrix_world)
        w = co.reshape(-1, 3)[::stride] @ mw[:3, :3].T + mw[:3, 3]
        pts = [Vector(p) for p in w]
        e.to_mesh_clear()
        low = min(p.z for p in pts)
        clear = min(p.z - gz(p.x, p.y, p.z + 1.5) for p in pts if p.z < low + 0.6)
        need[f] = sink - clear              # shift that puts the lowest point on the ground
    fl = list(frames)
    g = {f for f in fl if grounded(f)}
    n = len(fl)
    delta = {}
    for i, f in enumerate(fl):
        if f in g and g:
            delta[f] = need[f]
            continue
        # nearest grounded frames either side, wrapping round the loop
        prev = next((fl[(i - k) % n] for k in range(1, n) if fl[(i - k) % n] in g), None)
        nxt = next((fl[(i + k) % n] for k in range(1, n) if fl[(i + k) % n] in g), None)
        if prev is None:
            delta[f] = max(0.0, need[f]); continue
        a = (f - prev) % n or n; b = (nxt - f) % n or n
        d = need[prev] + (need[nxt] - need[prev]) * a / (a + b)
        delta[f] = max(d, need[f])          # any shift >= need keeps it above the ground
    # light smoothing on grounded runs so gait bobbing reads as weight, not jitter
    sm = {}
    for i, f in enumerate(fl):
        w = [delta[fl[(i + k) % n]] for k in (-1, 0, 1)]
        sm[f] = max(sum(w) / 3, need[f]) if f in g else delta[f]
    zs = {}
    for f in fl:
        s.frame_set(f); zs[f] = rig.location.z
    for f in fl:
        rig.location.z = zs[f] + sm[f]
        rig.keyframe_insert("location", index=2, frame=f)


# ---------------------------------------------------------------- meadow dressing (one mesh each)
def _blade(bm, base, h, w, ang, lean, put):
    d = Vector((math.cos(ang), math.sin(ang), 0))
    side = Vector((-d.y, d.x, 0)) * w
    tip = base + d * lean + Vector((0, 0, h))
    a, b, c = bm.verts.new(base - side), bm.verts.new(base + side), bm.verts.new(tip)
    put(bm.faces.new((a, b, c)))


def meadow(name, spots, kind="grass", seed=0):
    """Grass tufts or wildflowers at world `spots` [(x, y, z)], baked into one flat-shaded mesh."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    lay = bm.loops.layers.float_color.new("Col")

    def painter(col):
        def put(face):
            for l in face.loops:
                l[lay] = col
        return put
    for x, y, z in spots:
        base = Vector((x, y, z - 0.02))
        if kind == "grass":
            shades = PAL["grass"] + PAL["grass_dry"][:1]
            for k in range(rnd.randint(5, 8)):
                _blade(bm, base + Vector((rnd.uniform(-0.08, 0.08), rnd.uniform(-0.08, 0.08), 0)),
                       rnd.uniform(0.28, 0.55), 0.045, rnd.uniform(0, 2 * math.pi), rnd.uniform(0.05, 0.18),
                       painter(hexc(rnd.choice(shades))))
        else:
            petal = hexc(rnd.choice(["#f6f1e4", "#f2c84b", "#ef8a3c", "#e86f7d", "#b88be0"]))
            h = rnd.uniform(0.22, 0.4)
            _blade(bm, base, h, 0.02, rnd.uniform(0, 6.3), 0.02, painter(hexc("#5c9a35")))
            c = base + Vector((0, 0, h))
            ring = [bm.verts.new(c + Vector((math.cos(a) * 0.09, math.sin(a) * 0.09, 0.02 * (k % 2))))
                    for k, a in enumerate(i * 2 * math.pi / 5 + rnd.uniform(0, 1) for i in range(5))]
            mid = bm.verts.new(c + Vector((0, 0, 0.03)))
            for i in range(5):
                painter(petal)(bm.faces.new((mid, ring[i], ring[(i + 1) % 5])))
            eye = bm.verts.new(c + Vector((0, 0, 0.045)))
            for i in range(0, 5, 2):
                painter(hexc("#e8a12a"))(bm.faces.new((eye, ring[i], ring[(i + 1) % 5])))
    return mesh_object(name, bm, None)


def bamboo(name, height=4.0, stalks=7, seed=0):
    """A clump of faceted bamboo: segmented, slightly leaning culms with leaf sprays near the top."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    lay = bm.loops.layers.float_color.new("Col")

    def paint(faces, col):
        for f in faces:
            for l in f.loops:
                l[lay] = col
    for k in range(stalks):
        a = rnd.uniform(0, 2 * math.pi); r = rnd.uniform(0, 0.35)
        base = Vector((math.cos(a) * r, math.sin(a) * r, -0.05))
        h = height * rnd.uniform(0.7, 1.05)
        lean = Vector((math.cos(a), math.sin(a), 0)) * rnd.uniform(0.15, 0.45)
        segs = rnd.randint(5, 7)
        green = rnd.choice(["#8fb94a", "#7faa3f", "#9cc458", "#a7b84c"])
        for s in range(segs):
            t0, t1 = s / segs, (s + 1) / segs
            p0 = base + lean * t0 * t0 + Vector((0, 0, h * t0)); p1 = base + lean * t1 * t1 + Vector((0, 0, h * t1))
            cone = bmesh.ops.create_cone(bm, cap_ends=False, segments=5, radius1=0.075, radius2=0.065, depth=(p1 - p0).length * 0.96)
            rot = (p1 - p0).to_track_quat("Z", "Y").to_matrix().to_4x4()
            bmesh.ops.transform(bm, matrix=Matrix.Translation((p0 + p1) / 2) @ rot, verts=cone["verts"])
            paint({f for v in cone["verts"] for f in v.link_faces}, hexc(green))
            node = bmesh.ops.create_cone(bm, cap_ends=False, segments=5, radius1=0.085, radius2=0.085, depth=0.04)
            bmesh.ops.transform(bm, matrix=Matrix.Translation(p1) @ rot, verts=node["verts"])
            paint({f for v in node["verts"] for f in v.link_faces}, hexc("#6d8a34"))
        top = base + lean + Vector((0, 0, h))
        for j in range(rnd.randint(4, 6)):                     # leaf sprays: long thin drooping triangles
            t = rnd.uniform(0.6, 1.0)
            at = base + lean * t * t + Vector((0, 0, h * t))
            ang = rnd.uniform(0, 2 * math.pi); d = Vector((math.cos(ang), math.sin(ang), 0))
            side = Vector((-d.y, d.x, 0)) * 0.09
            tip = at + d * rnd.uniform(0.6, 0.9) + Vector((0, 0, -0.25))
            mid = at + d * 0.3 + Vector((0, 0, 0.06))
            f1 = bm.faces.new((bm.verts.new(at), bm.verts.new(mid + side), bm.verts.new(tip)))
            f2 = bm.faces.new((bm.verts.new(at), bm.verts.new(tip), bm.verts.new(mid - side)))
            paint((f1, f2), hexc(rnd.choice(["#5f9e3a", "#6fae43", "#4f8a30"])))
    return mesh_object(name, bm, None)


def log(name, length=1.8, radius=0.22, seed=0):
    """Fallen log lying along X: faceted bark, pale cut ends, a broken branch stub."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    lay = bm.loops.layers.float_color.new("Col")
    cyl = bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=radius, radius2=radius * 0.85, depth=length)
    bmesh.ops.rotate(bm, verts=cyl["verts"], matrix=Matrix.Rotation(math.pi / 2, 3, "Y"))
    jitter(bm, 0.025, seed)
    for f in bm.faces:
        n = f.normal
        col = hexc(rnd.choice(["#f0d9a8", "#e6cb94"])) if abs(n.x) > 0.9 else hexc(rnd.choice(["#7a5236", "#6b4730", "#86603f"]))
        for l in f.loops:
            l[lay] = col
    stub = bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.07, radius2=0.04, depth=0.45)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((length * 0.2, 0.1, radius + 0.15)) @ Matrix.Rotation(0.5, 4, "X"), verts=stub["verts"])
    for f in {f for v in stub["verts"] for f in v.link_faces}:
        for l in f.loops:
            l[lay] = hexc("#6b4730")
    for v in bm.verts:
        v.co.z += radius * 0.85
    return mesh_object(name, bm, None)


def butterfly(name, size=0.32, colour="#f2a33a", edge="#2b2420"):
    """Two-winged papercraft butterfly facing -Y, with the same up/down shape keys as the birds."""
    bm = bmesh.new()
    lay = bm.loops.layers.float_color.new("Col")
    k = size

    def face(vs, col):
        f = bm.faces.new([bm.verts.new(v) for v in vs])
        for l in f.loops:
            l[lay] = hexc(col)
    face([(0.02 * k, -0.25 * k, 0), (-0.02 * k, -0.25 * k, 0), (0, 0.25 * k, 0.01 * k)], edge)   # body
    for s in (1, -1):
        fw = [(s * 0.03 * k, -0.18 * k, 0), (s * 0.55 * k, -0.42 * k, 0.01 * k), (s * 0.62 * k, -0.05 * k, 0.01 * k), (s * 0.03 * k, 0.02 * k, 0)]
        hw = [(s * 0.03 * k, 0.0, 0), (s * 0.42 * k, 0.05 * k, 0.01 * k), (s * 0.3 * k, 0.36 * k, 0.01 * k), (s * 0.03 * k, 0.16 * k, 0)]
        face(fw if s > 0 else fw[::-1], colour)
        face(hw if s > 0 else hw[::-1], colour)
        face([(s * 0.48 * k, -0.4 * k, 0.012 * k), (s * 0.6 * k, -0.08 * k, 0.012 * k), (s * 0.56 * k, -0.3 * k, 0.012 * k)][::s], edge)
    o = mesh_object(name, bm, None)
    _wing_keys(o, x0=0.03 * k, span=1.25 * k)
    return o


def sea_to_rim(name, island_obj, rings=8, wave_amp=(0.16, 0.09), fade_from=0.75, skirt=0.75):
    """A faceted sea filling the island's top out to its rim (so no shore shows), with three
    phase-shifted wave shape keys that calm to nothing at the rim, and a band of deep water
    wrapping the top of the cliff so the island reads as a cut-out piece of ocean."""
    flat = list(island_obj["rim"])
    rim = [Vector(flat[i:i + 3]) for i in range(0, len(flat), 3)]
    S = len(rim)
    bm = bmesh.new()
    lay = bm.loops.layers.float_color.new("Col")
    rnd = random.Random(5)
    centre = bm.verts.new((0, 0, 0))
    grid = [[bm.verts.new((p.x * j / rings, p.y * j / rings, 0 if j < rings else p.z)) for p in rim] for j in range(1, rings + 1)]

    def face(vs, col):
        f = bm.faces.new(vs)
        for l in f.loops:
            l[lay] = col
    for i in range(S):
        face((centre, grid[0][i], grid[0][(i + 1) % S]), hexc(rnd.choice(PAL["sea"])))
    for j in range(rings - 1):
        for i in range(S):
            i2 = (i + 1) % S
            a, b, c, d = grid[j][i], grid[j + 1][i], grid[j + 1][i2], grid[j][i2]
            face((a, b, c), hexc(rnd.choice(PAL["sea"]))); face((a, c, d), hexc(rnd.choice(PAL["sea"])))
    n_top = len(bm.faces)
    low = [bm.verts.new((p.x * 1.075, p.y * 1.075, p.z - skirt)) for p in rim]   # clear of the cliff face
    for i in range(S):                                  # skirt: deep water down the cliff edge
        i2 = (i + 1) % S
        top_a, top_b = grid[-1][i], grid[-1][i2]
        face((top_a, low[i], low[i2]), hexc(rnd.choice(PAL["sea_deep"])))
        face((top_a, low[i2], top_b), hexc(rnd.choice(PAL["sea_deep"])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_object(name, bm, None)
    o.shape_key_add(name="Basis")
    rmax = max(p.xy.length for p in rim)
    for k in range(3):
        key = o.shape_key_add(name=f"wave{k}")
        ph = 2 * math.pi * k / 3
        for i, v in enumerate(o.data.vertices):
            x, y = v.co.x, v.co.y
            # the wave calms toward the rim and the skirt never moves, so the edge stays sealed
            frac = math.hypot(x, y) / rmax
            calm = 1.0 if frac < fade_from else max(0.0, 1 - (frac - fade_from) / (0.97 - fade_from)) ** 2
            if v.co.z < -0.3:
                calm = 0.0
            key.data[i].co = v.co + Vector((0, 0, calm * (wave_amp[0] * math.sin(0.9 * x + 0.5 * y + ph) + wave_amp[1] * math.sin(1.4 * y - 0.6 * x + ph * 2))))
    return o
