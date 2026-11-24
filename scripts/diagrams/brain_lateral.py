"""Generates content/diagrams/brain-lateral.svg: the left hemisphere seen from the side, anterior on the left.
Shared by the `brain-lateral` and `brain-arteries` diagrams (the arteries layer)."""
from pathlib import Path
from curves import smooth, shift, normal_offset, blob, rev, wiggle

OUT = Path(__file__).resolve().parents[2] / 'content/diagrams/brain-lateral.svg'

# ---- the cerebrum's outline (clockwise from the frontal pole)
cerebrum = [
    (94, 262), (100, 196), (138, 132), (200, 90), (282, 60), (380, 45), (480, 50), (568, 72),
    (640, 112), (692, 172), (718, 240), (716, 300), (694, 336), (648, 362), (596, 384),
    (520, 410), (430, 426), (350, 424), (290, 410), (250, 386), (234, 356), (246, 330),
    (228, 326), (178, 322), (132, 308), (104, 290),
]
# ---- landmark lines
fissure = [(246, 330), (300, 312), (378, 294), (446, 282), (505, 270), (548, 252)]   # lateral (Sylvian) fissure
fiss_ext = [(505, 270), (560, 286), (630, 300)]                                       # temporal/parietal border
central = [(432, 47), (428, 82), (438, 108), (424, 140), (414, 172), (420, 200), (404, 232), (398, 262), (382, 290)]
po_line = [(640, 108), (630, 170), (640, 240), (628, 310), (622, 380), (618, 430)]   # parieto-occipital / preoccipital
pf_line = [(262, 40), (262, 110), (250, 190), (236, 260), (226, 330)]                 # prefrontal / premotor
pre = shift(central, -30, 2)
post = shift(central, 30, -2)

def region(*parts):
    """Join point lists into one closed smooth-ish polygon (straight joins between parts)."""
    d = []
    for i, p in enumerate(parts):
        if isinstance(p, str):
            d.append(p)
        else:
            seg = smooth(p, move=(i == 0))
            if i > 0:
                seg = f"L {p[0][0]} {p[0][1]} " + seg
            d.append(seg)
    return ' '.join(d) + ' Z'

frontal = region([(0, 0), (0, 0)], 'L 432 0', central, rev(fissure[:3]), 'L 0 460')
parietal = region([(432, 0), (432, 0)], 'L 640 0', po_line[:4], rev(fiss_ext), rev(fissure[2:5]), rev(central))
temporal = region([(0, 460), (0, 460)], 'L 246 330', fissure[:5], fiss_ext[1:], po_line[3:], 'L 618 620 L 0 620')
occipital = region([(640, 0), (640, 0)], 'L 820 0 L 820 620 L 618 620', rev(po_line))
prefrontal = region([(0, 0), (0, 0)], 'L 262 0', pf_line, 'L 0 460')
m1 = region(central, rev(pre))
s1 = region(post, rev(central))

# ---- gyri: (dark sulcus line, light highlight above it)
sulci = [
    # frontal
    [(150, 150), (200, 132), (260, 128), (330, 120), (392, 112)],      # superior frontal sulcus
    [(128, 226), (180, 214), (240, 212), (300, 206), (380, 196)],      # inferior frontal sulcus
    shift(central, -60, 6)[1:8],                                      # precentral sulcus
    [(150, 96), (190, 104), (222, 98)],
    [(118, 182), (150, 176), (190, 178)],
    [(180, 268), (220, 262), (250, 270)],
    [(286, 300), (300, 278), (292, 258)],                              # anterior ascending ramus (Broca's)
    [(262, 312), (232, 300), (200, 300)],                              # anterior horizontal ramus
    # parietal
    shift(central, 62, -4)[1:7],                                      # postcentral sulcus
    [(480, 196), (520, 170), (570, 160), (612, 178), (650, 196)],      # intraparietal sulcus
    [(540, 100), (575, 120), (600, 150)],
    [(548, 252), (572, 232), (590, 236)],                              # supramarginal around the fissure tip
    # temporal
    [(268, 372), (330, 352), (410, 336), (490, 322), (560, 318), (610, 330)],   # superior temporal sulcus
    [(300, 404), (380, 394), (460, 380), (540, 366), (600, 360)],               # inferior temporal sulcus
    # occipital
    [(660, 200), (680, 240), (690, 270)],
    [(650, 300), (676, 316), (700, 316)],
    [(664, 140), (690, 180)],
    # extra folds for texture
    [(200, 176), (236, 168), (262, 178)],
    [(330, 150), (360, 160), (380, 150)],
    [(302, 246), (340, 238), (372, 244)],
    [(110, 250), (140, 254)],
    [(250, 64), (282, 84), (300, 76)],
    [(470, 80), (500, 104), (512, 136)],
    [(500, 224), (520, 210), (548, 214)],
    [(600, 230), (620, 260)],
    [(350, 400), (400, 412), (440, 410)],
    [(470, 352), (520, 346), (556, 350)],
    [(686, 120), (706, 160)],
]

def gyri():
    w = [wiggle(s, amp=3.2 if len(s) > 3 else 2, seed=i) for i, s in enumerate(sulci)]
    dark = ' '.join(smooth(s) for s in w)
    light = ' '.join(smooth(shift(s, -1.8, -2.2)) for s in w)
    return dark, light

# ---- cerebellum, brainstem
cb = [(566, 404), (612, 384), (660, 372), (706, 350), (738, 384), (742, 424), (720, 458), (676, 480), (620, 486), (578, 474), (556, 446)]
folia = []
for k in range(9):
    y0 = 392 + k * 11
    folia.append(smooth([(548, y0 + 10), (600, y0 - 6 + k), (660, y0 - 12 + k * 1.5), (720, y0 - 26 + k * 2.6), (760, y0 - 30 + k * 3)]))

pons = [(452, 412), (500, 404), (540, 414), (556, 440), (552, 470), (536, 488), (494, 494), (468, 486), (452, 458)]
medulla = [(470, 484), (536, 486), (532, 512), (524, 538), (494, 540), (484, 516)]
cord = [(494, 536), (524, 536), (522, 566), (496, 566)]

dark, light = gyri()
outline = smooth(cerebrum, closed=True)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 20 740 550" class="shade-lg" role="img" aria-label="Left side of the brain, front of the head on the left">
  <!-- Original drawing for NeuroMap, generated by scripts/diagrams/brain_lateral.py (edit that, not this).
       Lateral (side) view of the LEFT hemisphere; anterior is LEFT. Stylized, not to scale. -->
  <defs>
    <clipPath id="lat-cortex-clip"><path d="{outline}"/></clipPath>
    <clipPath id="lat-cb-clip"><path d="{smooth(cb, closed=True)}"/></clipPath>
  </defs>

  <g class="base">
    <!-- tucked under the cerebrum: cerebellum and brainstem -->
    <path data-ref="spinal-cord" d="{smooth(cord, closed=True, t=0.2)}"/>
    <path data-ref="medulla" d="{smooth(medulla, closed=True)}"/>
    <path data-ref="pons" d="{smooth(pons, closed=True)}"/>
    <path class="deco folia" d="M 470 440 C 500 446 530 446 552 440 M 466 462 C 498 468 528 468 550 462"/>
    <path data-ref="cerebellum" d="{smooth(cb, closed=True)}"/>
    <g clip-path="url(#lat-cb-clip)" class="deco"><path class="folia" d="{' '.join(folia)}"/></g>

    <!-- soft shadow the hemisphere casts on what lies beneath it -->
    <path class="cast-shadow" d="{smooth(shift(cerebrum, 4, 9), closed=True)}"/>

    <g class="shade"><g clip-path="url(#lat-cortex-clip)">
      <path data-ref="frontal-lobe" class="no-shade" d="{frontal}"/>
      <path data-ref="parietal-lobe" class="no-shade" d="{parietal}"/>
      <path data-ref="temporal-lobe" class="no-shade" d="{temporal}"/>
      <path data-ref="occipital-lobe" class="no-shade" d="{occipital}"/>
      <path data-ref="prefrontal-cortex" class="no-shade" data-tone="2" d="{prefrontal}"/>
      <path data-ref="primary-motor-cortex" class="no-shade" data-tone="2" d="{m1}"/>
      <path data-ref="primary-somatosensory-cortex" class="no-shade" data-tone="2" d="{s1}"/>
      <path data-ref="brocas-area" d="{blob(300, 282, 36, 21, seed=2, rot=-12)}"/>
      <path data-ref="primary-auditory-cortex" d="{blob(420, 300, 36, 11, seed=4, rot=-9)}"/>
      <path data-ref="wernickes-area" d="{blob(540, 302, 40, 17, seed=5, rot=-2)}"/>
      <path data-ref="primary-visual-cortex" d="{blob(706, 292, 30, 50, seed=3, rot=8)}"/>
      <path class="gyri" d="{dark}"/>
      <path class="gyri-hl" d="{light}"/>
    </g></g>
    <path class="contour" d="{outline}"/>
    <path data-ref="central-sulcus" class="line-hotspot sulcus-line" data-fill="#2b3a5c" d="{smooth(central)}"/>
    <path data-ref="lateral-fissure" class="line-hotspot sulcus-line" data-fill="#2b3a5c" d="{smooth(fissure)}"/>

    <g class="labels lbl-base">
      <text text-anchor="middle" data-label-for="frontal-lobe" x="330" y="168">Frontal lobe</text>
      <text text-anchor="middle" data-label-for="prefrontal-cortex" x="170" y="244"><tspan x="170">Prefrontal</tspan><tspan x="170" dy="17">cortex</tspan></text>
      <text text-anchor="middle" data-label-for="parietal-lobe" x="540" y="136">Parietal lobe</text>
      <text text-anchor="middle" data-label-for="temporal-lobe" x="430" y="372">Temporal lobe</text>
      <text text-anchor="middle" data-label-for="occipital-lobe" x="668" y="222"><tspan x="668">Occipital</tspan><tspan x="668" dy="17">lobe</tspan></text>
      <text text-anchor="end" data-label-for="primary-motor-cortex" x="330" y="36">Primary motor cortex (M1)</text>
      <line data-label-for="primary-motor-cortex" class="leader" x1="332" y1="40" x2="404" y2="84"/>
      <text data-label-for="primary-somatosensory-cortex" x="474" y="36">Primary somatosensory cortex (S1)</text>
      <line data-label-for="primary-somatosensory-cortex" class="leader" x1="478" y1="40" x2="452" y2="80"/>
      <text data-label-for="central-sulcus" x="446" y="238">Central sulcus</text>
      <line data-label-for="central-sulcus" class="leader" x1="444" y1="234" x2="410" y2="224"/>
      <text text-anchor="end" data-label-for="brocas-area" x="214" y="372">Broca's area</text>
      <line data-label-for="brocas-area" class="leader" x1="216" y1="366" x2="282" y2="292"/>
      <text text-anchor="end" data-label-for="lateral-fissure" x="230" y="420">Lateral (Sylvian) fissure</text>
      <line data-label-for="lateral-fissure" class="leader" x1="232" y1="412" x2="300" y2="314"/>
      <text text-anchor="middle" data-label-for="primary-auditory-cortex" x="404" y="330">A1</text>
      <text data-label-for="wernickes-area" x="560" y="350">Wernicke's area</text>
      <line data-label-for="wernickes-area" class="leader" x1="566" y1="338" x2="548" y2="314"/>
      <text text-anchor="middle" data-label-for="primary-visual-cortex" x="745" y="356">V1</text>
      <line data-label-for="primary-visual-cortex" class="leader" x1="740" y1="342" x2="716" y2="322"/>
      <text text-anchor="middle" data-label-for="cerebellum" x="664" y="436">Cerebellum</text>
      <text text-anchor="end" data-label-for="pons" x="444" y="462">Pons</text>
      <text text-anchor="end" data-label-for="medulla" x="462" y="522">Medulla</text>
      <text data-label-for="spinal-cord" x="534" y="560">Spinal cord</text>
    </g>
  </g>

  <!-- blood supply territories (the cortex each artery feeds) -->
  <g data-layer="arteries">
    <g clip-path="url(#lat-cortex-clip)">
      <path class="territory" data-ref="middle-cerebral-artery" data-fill="#c8403a" d="M 0 0 L 820 0 L 820 620 L 0 620 Z"/>
      <path class="territory" data-ref="anterior-cerebral-artery" data-fill="#e8907a" d="M 0 0 L 700 0 L 690 60 L 660 120 {smooth([(660, 120), (600, 96), (520, 82), (430, 80), (330, 88), (240, 108), (170, 148), (118, 206), (90, 260)], move=False)} L 0 300 Z"/>
      <path class="territory" data-ref="posterior-cerebral-artery" data-fill="#8f3b78" d="M 700 0 L 820 0 L 820 620 L 300 620 L 300 440 {smooth([(300, 440), (380, 414), (470, 400), (550, 384), (610, 352), (636, 290), (640, 210), (660, 120)], move=False)} L 690 60 Z"/>
    </g>
    <path class="contour" d="{outline}"/>
    <g class="labels">
      <text text-anchor="middle" data-label-for="anterior-cerebral-artery" x="370" y="72">ACA territory</text>
      <text text-anchor="middle" data-label-for="middle-cerebral-artery" x="380" y="230">MCA territory</text>
      <text text-anchor="middle" data-label-for="posterior-cerebral-artery" x="680" y="270">PCA territory</text>
    </g>
  </g>
</svg>
'''
OUT.write_text(svg)
print('wrote', OUT)
