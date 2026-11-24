"""Generates content/diagrams/neuron.svg: a multipolar neuron (signals flow left to right) with three kinds of glia."""
import math
from pathlib import Path
from curves import smooth, blob, f

OUT = Path(__file__).resolve().parents[2] / 'content/diagrams/neuron.svg'

def taper(pts, w0, w1):
    """Filled, tapering branch along a centerline."""
    n = len(pts)
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        w = (w0 + (w1 - w0) * i / (n - 1)) / 2
        L.append((x - dy / d * w, y + dx / d * w))
        R.append((x + dy / d * w, y - dx / d * w))
    tip = pts[-1]
    return smooth(L + [(tip[0] + (tip[0] - pts[-2][0]) * 0.08, tip[1] + (tip[1] - pts[-2][1]) * 0.08)] + list(reversed(R)), closed=True, t=0.4)

def point_on(pts, frac, side, off):
    """A point partway along a branch, pushed sideways (for spines)."""
    i = min(int(frac * (len(pts) - 1)), len(pts) - 2)
    u = frac * (len(pts) - 1) - i
    (x0, y0), (x1, y1) = pts[i], pts[i + 1]
    x, y = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
    d = math.hypot(x1 - x0, y1 - y0) or 1
    return x - (y1 - y0) / d * off * side, y + (x1 - x0) / d * off * side, (-(y1 - y0) / d * side, (x1 - x0) / d * side)

dendrites = [
    ([(176, 198), (146, 170), (114, 140), (80, 108)], 16, 3),
    ([(128, 156), (102, 158), (72, 166), (46, 178)], 7, 2),
    ([(176, 244), (144, 272), (112, 306), (78, 340)], 16, 3),
    ([(116, 300), (90, 300), (62, 294), (38, 288)], 7, 2),
    ([(202, 184), (194, 150), (180, 110), (156, 68)], 14, 3),
    ([(186, 128), (202, 106), (214, 82), (222, 56)], 6, 2),
    ([(216, 260), (222, 300), (216, 342), (196, 390)], 14, 3),
    ([(218, 330), (240, 352), (252, 382)], 5, 2),
]
dend_d = ' '.join(taper(p, a, b) for p, a, b in dendrites)

spines = []
spine_pts = []
for (pts, w0, w1), fr in [(dendrites[0], (0.45, 0.62, 0.8)), (dendrites[2], (0.5, 0.7, 0.86)), (dendrites[4], (0.55, 0.78))]:
    for k, fr_ in enumerate(fr):
        side = 1 if k % 2 else -1
        w = (w0 + (w1 - w0) * fr_) / 2
        x, y, (nx, ny) = point_on(pts, fr_, side, w * 0.7)
        hx, hy = x + nx * 10, y + ny * 10
        spine_pts.append((hx, hy))
        spines.append(f'<path d="M {f(x)} {f(y)} L {f(hx)} {f(hy)}" class="stroke-shape" style="stroke-width:3"/><circle cx="{f(hx + nx * 2.5)}" cy="{f(hy + ny * 2.5)}" r="4.2"/>')

soma = smooth([(160, 222), (172, 194), (200, 178), (230, 184), (252, 204), (256, 230), (236, 256), (204, 266), (172, 254)], closed=True)
nissl = ''.join(f'<circle cx="{x}" cy="{y}" r="2.2"/>' for x, y in [(180, 206), (186, 238), (232, 200), (236, 238), (200, 248), (222, 252), (176, 224), (214, 192)])
hillock = 'M 248 206 C 262 212 278 217 296 219 L 296 226 C 278 228 262 234 248 240 Z'
axon = 'M 292 219.5 L 716 219.5 L 716 225 L 292 225 Z'

segs = [310, 392, 474, 556, 638]
myelin = ''.join(f'<rect x="{x}" y="209" width="70" height="27" rx="12"/>' for x in segs)
wraps = ' '.join(f'M {x + 14} 211 C {x + 22} 220 {x + 22} 226 {x + 14} 234 M {x + 56} 211 C {x + 64} 220 {x + 64} 226 {x + 56} 234' for x in segs)
nodes = ''.join(f'<rect x="{x + 71}" y="215" width="10" height="15" rx="3"/>' for x in segs[:-1])

collateral = taper([(470, 226), (478, 262), (504, 296), (548, 320)], 5, 3)
terminals = ' '.join([
    taper([(712, 222), (744, 210), (776, 184), (802, 162)], 6, 3),
    taper([(712, 222), (760, 222), (800, 222), (830, 222)], 6, 3),
    taper([(712, 222), (744, 236), (776, 262), (802, 284)], 6, 3),
])
boutons = ''.join(f'<path d="{blob(x, y, 12, 11, 0.06, seed=i)}"/>' for i, (x, y) in enumerate([(812, 156), (842, 222), (812, 290)]))
bouton_v = ''.join(f'<circle cx="{x + dx}" cy="{y + dy}" r="2.4"/>' for x, y in [(812, 156), (842, 222), (812, 290)] for dx, dy in [(-3, -2), (3, 2), (2, -4)])

oligo_proc = ' '.join([
    taper([(552, 124), (540, 160), (522, 190), (509, 208)], 7, 4),
    taper([(566, 126), (578, 160), (588, 190), (591, 208)], 7, 4),
    taper([(576, 98), (612, 120), (650, 160), (673, 208)], 6, 4),
    taper([(546, 96), (500, 120), (440, 170), (427, 208)], 6, 4),
])
oligo_body = blob(560, 106, 21, 19, 0.05, seed=3)

astro_c = (330, 352)
astro_tips = [(262, 258), (286, 418), (392, 404), (404, 324), (362, 290), (274, 334)]
astro_proc = ' '.join(taper([astro_c, ((astro_c[0] + x) / 2 + (y - astro_c[1]) * 0.06, (astro_c[1] + y) / 2 - (x - astro_c[0]) * 0.06), (x, y)], 9, 3) for x, y in astro_tips)
astro_feet = '<path d="M 276 414 C 282 406 294 406 300 414 L 296 420 C 290 416 284 416 280 420 Z"/>'
capillary = 'M 230 422 C 270 414 330 418 380 432 L 380 450 L 230 450 Z'

mg_c = (640, 380)
mg_proc = ' '.join(taper([mg_c, (x, y)], 4, 1.5) for x, y in [(612, 362), (670, 368), (628, 410), (664, 404), (646, 350), (604, 392)])
mg_body = blob(640, 380, 14, 9, 0.08, seed=6, rot=-10)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 450" class="shade-sm" role="img" aria-label="A neuron with its parts, and three kinds of glial cells">
  <!-- Original drawing for NeuroMap, generated by scripts/diagrams/neuron.py (edit that, not this).
       Stylized multipolar neuron; signals flow left (dendrites) to right (terminals). -->
  <g class="base">
    <path class="deco capillary" d="{capillary}"/>
    <g data-ref="astrocyte" data-fill="var(--cell-glia)"><path d="{astro_proc}"/>{astro_feet}<path d="{blob(330, 352, 17, 15, 0.06, seed=2)}"/></g>
    <g data-ref="dendrite" data-fill="#86aecb"><path d="{dend_d}"/></g>
    <g data-ref="dendritic-spine" data-fill="#4f7fa3">{''.join(spines)}</g>
    <path data-ref="axon" data-fill="#9aa8ba" d="{axon}"/>
    <path data-ref="axon-collateral" data-fill="#9aa8ba" d="{collateral} {blob(556, 324, 8, 7, 0.05, seed=1)}"/>
    <g data-ref="axon-terminal" data-fill="#2a9d8f"><path d="{terminals}"/>{boutons}</g>
    <g class="deco vesicle-dots">{bouton_v}</g>
    <path data-ref="soma" d="{soma}"/>
    <g class="deco nissl">{nissl}</g>
    <path data-ref="axon-hillock" data-fill="#e0a64a" d="{hillock}"/>
    <g data-ref="myelin-sheath">{myelin}</g>
    <path class="deco wraps" d="{wraps}"/>
    <g data-ref="node-of-ranvier" data-fill="#d55e00">{nodes}</g>
    <g data-ref="oligodendrocyte"><path d="{oligo_proc}"/><path d="{oligo_body}"/></g>
    <path data-ref="cell-nucleus" data-fill="#5b6f9a" d="{blob(206, 218, 17, 16, 0.04, seed=4)}"/>
    <circle class="deco nucleolus" cx="211" cy="214" r="5"/>
    <g data-ref="microglia" data-fill="#b48ead"><path d="{mg_proc}"/><path d="{mg_body}"/></g>

    <g class="labels lbl-base">
      <text data-label-for="dendrite" x="20" y="40">Dendrites</text>
      <line data-label-for="dendrite" class="leader" x1="60" y1="46" x2="104" y2="128"/>
      <text data-label-for="dendritic-spine" x="20" y="232">Dendritic spines</text>
      <line data-label-for="dendritic-spine" class="leader" x1="60" y1="222" x2="{f(spine_pts[0][0])}" y2="{f(spine_pts[0][1])}"/>
      <text text-anchor="middle" data-label-for="soma" x="205" y="300">Soma (cell body)</text>
      <line data-label-for="soma" class="leader" x1="205" y1="286" x2="205" y2="266"/>
      <text text-anchor="middle" data-label-for="cell-nucleus" x="206" y="162">Nucleus</text>
      <text text-anchor="middle" data-label-for="axon-hillock" x="276" y="190">Axon hillock</text>
      <text text-anchor="middle" data-label-for="myelin-sheath" x="345" y="266">Myelin sheath</text>
      <text text-anchor="middle" data-label-for="node-of-ranvier" x="420" y="190">Node of Ranvier</text>
      <line data-label-for="node-of-ranvier" class="leader" x1="432" y1="194" x2="466" y2="214"/>
      <text text-anchor="middle" data-label-for="axon" x="560" y="262">Axon</text>
      <text data-label-for="axon-collateral" x="572" y="334">Axon collateral</text>
      <text text-anchor="middle" data-label-for="axon-terminal" x="840" y="334">Axon terminals</text>
      <text data-label-for="oligodendrocyte" x="590" y="96">Oligodendrocyte</text>
      <text data-label-for="astrocyte" x="356" y="372">Astrocyte</text>
      <text data-label-for="microglia" x="662" y="424">Microglia</text>
      <text class="small deco-label" x="232" y="444">Capillary</text>
    </g>
  </g>
</svg>
'''
OUT.write_text(svg)
print('wrote', OUT)
