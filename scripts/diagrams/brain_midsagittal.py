"""Generates content/diagrams/brain-midsagittal.svg: the brain cut down the midline, anterior on the left.
Shared by `brain-midsagittal` and `nt-overlay`. The neurotransmitter layers (nuclei, projection arrows)
live in midsagittal_layers.svg.part and are pasted in unchanged; keep anatomy anchors where they are
(thalamus ≈ 425,266; midbrain ≈ 455,320; pons ≈ 460,385; locus coeruleus ≈ 499,377) so they still line up."""
from pathlib import Path
from curves import smooth, shift, blob, rev, wiggle, ribbon, band, normal_offset

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / 'content/diagrams/brain-midsagittal.svg'
LAYERS = (HERE / 'midsagittal_layers.svg.part').read_text()

cerebrum = [(84, 304), (70, 236), (90, 170), (138, 116), (208, 76), (300, 50), (400, 42), (500, 50),
            (592, 82), (656, 138), (696, 206), (710, 266), (696, 312), (662, 334), (616, 338), (574, 328),
            (540, 318), (515, 322), (420, 330), (330, 336), (230, 344), (150, 340), (104, 326)]

# corpus callosum: rostrum → genu → body → splenium
cc_c = [(304, 286), (272, 272), (256, 240), (268, 204), (316, 182), (400, 174), (472, 178), (520, 194), (546, 220), (540, 246)]
cc_w = [7, 12, 22, 22, 17, 16, 16, 18, 24, 22]
cc = ribbon(cc_c, cc_w)
cc_top = normal_offset(cc_c, -1)                    # helper lines for the cingulate band
cing_in = [(x, y) for x, y in normal_offset(cc_c, -9)][1:]
cing_out = normal_offset(cc_c, -50)[1:]
cing_out[-1] = (cing_out[-1][0] - 4, cing_out[-1][1] + 10)
cingulate = band(cing_in, cing_out)
cing_sulcus = wiggle(normal_offset(cc_c, -54)[2:-1] + [(510, 120), (488, 82), (480, 52)], amp=2.5, seed=3)

central_notch = [(440, 42), (442, 70), (448, 100), (452, 124)]
pos = [(630, 98), (612, 150), (594, 206), (574, 256), (560, 292)]      # parieto-occipital sulcus
calcarine = [(560, 292), (600, 302), (648, 304), (700, 290)]

def poly(*parts):
    d = []
    for i, p in enumerate(parts):
        if isinstance(p, str):
            d.append(p)
        else:
            seg = smooth(p, move=False)
            d.append(f"{'M' if i == 0 else 'L'} {p[0][0]} {p[0][1]} {seg}")
    return ' '.join(d) + ' Z'

frontal = poly('M 0 0 L 440 0', central_notch, 'L 300 170 L 250 300 L 250 430 L 0 430')
parietal = poly('M 440 0 L 636 0', pos, rev(central_notch))
occipital = poly('M 636 0 L 900 0 L 900 430 L 540 430 L 540 300', rev(pos))
prefrontal = poly('M 0 0 L 250 0', [(250, 0), (250, 60), (236, 140), (216, 240), (206, 345)], 'L 0 430')

sulci = [
    cing_sulcus,
    [(402, 46), (398, 80), (406, 110), (414, 124)],                      # paracentral
    wiggle(pos, 2.5, seed=1),
    wiggle(calcarine, 2.5, seed=2),
    [(150, 210), (196, 190), (250, 186)],
    [(160, 146), (216, 124), (268, 118)],
    [(116, 262), (168, 252), (222, 262)],
    [(304, 86), (348, 98), (384, 90)],
    [(124, 302), (170, 300)],
    [(530, 120), (552, 160), (560, 196)],
    [(588, 110), (600, 140)],
    [(640, 190), (666, 226), (674, 262)],
    [(610, 318), (650, 322), (684, 314)],
]
sulci_w = [s if len(s) > 6 else wiggle(s, 2.6, seed=i) for i, s in enumerate(sulci)]
gyri_dark = ' '.join(smooth(s) for s in sulci_w)
gyri_light = ' '.join(smooth(shift(s, -1.6, -2)) for s in sulci_w)

thalamus = smooth([(374, 262), (392, 240), (430, 234), (468, 244), (480, 266), (466, 290), (428, 298), (390, 290)], closed=True)
hypothal = smooth([(332, 292), (354, 280), (384, 284), (396, 302), (388, 320), (364, 328), (340, 318)], closed=True)
third_v = smooth([(370, 248), (360, 268), (366, 292), (384, 306), (390, 298), (376, 282), (374, 262), (380, 250)], closed=True)
midbrain = smooth([(398, 298), (430, 292), (472, 288), (502, 292), (506, 320), (504, 348), (462, 350), (418, 352), (404, 330)], closed=True)
pons = smooth([(420, 352), (462, 350), (504, 348), (508, 380), (508, 412), (472, 420), (436, 420), (408, 406), (396, 382), (404, 360)], closed=True)
medulla = smooth([(436, 418), (472, 418), (508, 412), (504, 444), (500, 472), (466, 478), (452, 458), (442, 438)], closed=True)
cord = smooth([(466, 476), (500, 470), (498, 512), (497, 556), (467, 556), (467, 512)], closed=True, t=0.3)
cbl = [(516, 374), (534, 352), (584, 338), (640, 342), (684, 358), (708, 392), (702, 430), (672, 460), (622, 476), (572, 470), (536, 450), (518, 420)]
fourth_v = smooth([(508, 360), (526, 372), (544, 392), (526, 410), (508, 424)], closed=True, t=0.3)

# arbor vitae: white-matter tree inside the cerebellum; grey folia between the branches
root = (536, 404)
tips = [(566, 358), (610, 352), (652, 360), (686, 386), (692, 420), (664, 448), (620, 462), (574, 456)]
branches, twigs = [], []
for i, (tx, ty) in enumerate(tips):
    mx, my = (root[0] + tx) / 2, (root[1] + ty) / 2
    branches.append(f"M {root[0]} {root[1]} Q {mx + (ty - root[1]) * 0.06:.0f} {my - (tx - root[0]) * 0.06:.0f} {tx} {ty}")
    for frac in (0.5, 0.75):
        bx, by = root[0] + (tx - root[0]) * frac, root[1] + (ty - root[1]) * frac
        for sgn in (-1, 1):
            twigs.append(f"M {bx:.0f} {by:.0f} L {bx + (ty - root[1]) * 0.16 * sgn + (tx - root[0]) * 0.16:.0f} {by - (tx - root[0]) * 0.16 * sgn + (ty - root[1]) * 0.16:.0f}")
fissures = []
for (ax, ay), (bx, by) in zip(tips, tips[1:]):
    mx, my = (ax + bx) / 2, (ay + by) / 2
    ox, oy = mx + (mx - root[0]) * 0.32, my + (my - root[1]) * 0.32
    fissures.append(f"M {ox:.0f} {oy:.0f} L {mx + (mx - root[0]) * -0.1:.0f} {my + (my - root[1]) * -0.1:.0f}")

fornix = smooth([(536, 236), (500, 222), (440, 214), (380, 222), (356, 244), (360, 276), (384, 300), (392, 318)])
deep = smooth([(286, 250), (300, 220), (350, 204), (430, 198), (500, 206), (530, 236), (520, 270), (480, 262), (430, 244), (376, 250), (330, 280), (300, 286)], closed=True)

outline = smooth(cerebrum, closed=True)
labels = (HERE / 'midsagittal_labels.svg.part').read_text()

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 30 720 530" class="shade-lg" role="img" aria-label="Midsagittal view of the brain, front of the head on the left">
  <!-- Original drawing for NeuroMap, generated by scripts/diagrams/brain_midsagittal.py (edit that, not this).
       Anterior (front) is on the LEFT. Stylized, not to scale.
       Hotspots: any element with data-ref="<entity-id>". Labels: <text data-label-for="<entity-id>">.
       Layers: <g data-layer="…"> are hidden unless the diagram turns them on. -->
  <defs>
    <clipPath id="ms-cortex-clip"><path d="{outline}"/></clipPath>
    <clipPath id="ms-cb-clip"><path d="{smooth(cbl, closed=True)}"/></clipPath>
    <marker id="arr-ach" class="arrow arrow-ach" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arr-da" class="arrow arrow-da" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arr-ne" class="arrow arrow-ne" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arr-serotonin" class="arrow arrow-serotonin" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
  </defs>

  <!-- ===================== base anatomy ===================== -->
  <g class="base">
    <path data-ref="spinal-cord" d="{cord}"/>
    <path data-ref="cerebellum" d="{smooth(cbl, closed=True)}"/>
    <g clip-path="url(#ms-cb-clip)" class="deco">
      <path class="folia" d="{' '.join(fissures)}"/>
      <path class="arbor trunk" d="{' '.join(branches)}"/>
      <path class="arbor" d="{' '.join(twigs)}"/>
    </g>
    <path class="cast-shadow" d="{smooth(shift(cerebrum, 3, 8), closed=True)}"/>

    <g class="shade"><g clip-path="url(#ms-cortex-clip)">
      <path data-ref="frontal-lobe" class="no-shade" d="{frontal}"/>
      <path data-ref="parietal-lobe" class="no-shade" d="{parietal}"/>
      <path data-ref="occipital-lobe" class="no-shade" d="{occipital}"/>
      <path data-ref="prefrontal-cortex" class="no-shade" data-tone="2" d="{prefrontal}"/>
      <path class="gyri" d="{gyri_dark}"/>
      <path class="gyri-hl" d="{gyri_light}"/>
    </g></g>
    <path class="contour" d="{outline}"/>
    <path data-ref="cingulate-cortex" data-tone="2" d="{cingulate}"/>
    <path class="deco deep" d="{deep}"/>
    <path class="deco fornix" d="{fornix}"/>
    <path data-ref="corpus-callosum" data-fill="#d9c89a" d="{cc}"/>
    <path data-ref="midbrain" d="{midbrain}"/>
    <path data-ref="superior-colliculus" d="{blob(510, 306, 10, 9, 0.05, seed=1)}"/>
    <path data-ref="inferior-colliculus" d="{blob(511, 330, 9, 8, 0.05, seed=2)}"/>
    <path data-ref="thalamus" d="{thalamus}"/>
    <path data-ref="third-ventricle" d="{third_v}"/>
    <path data-ref="hypothalamus" d="{hypothal}"/>
    <circle class="deco mammillary" cx="394" cy="322" r="6"/>
    <path class="deco chiasm" d="M 318 318 C 326 312 340 314 344 322 C 338 328 324 328 318 318 Z"/>
    <g data-ref="pituitary-gland">
      <path d="M 358 326 C 356 334 352 340 350 346 L 344 346 C 346 338 348 332 350 326 Z"/>
      <path d="{blob(349, 355, 15, 10, 0.04, seed=4)}"/>
    </g>
    <path data-ref="pons" d="{pons}"/>
    <path class="deco folia" d="M 410 372 C 440 380 480 382 506 378 M 408 392 C 440 400 480 402 506 398"/>
    <path data-ref="medulla" d="{medulla}"/>
    <path data-ref="fourth-ventricle" d="{fourth_v}"/>

{labels}
  </g>

{LAYERS}</svg>
'''
OUT.write_text(svg)
print('wrote', OUT)
