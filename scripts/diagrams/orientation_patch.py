"""One-time patch (already applied): redrew the silhouettes and brain icons in content/diagrams/orientation.svg. Kept as a record of how they were made; arrows and planes are hand-written in the SVG.
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from curves import smooth, shift, wiggle

P = Path(__file__).resolve().parents[2] / 'content/diagrams/orientation.svg'
s = P.read_text()

cerebrum = [(94, 262), (100, 196), (138, 132), (200, 90), (282, 60), (380, 45), (480, 50), (568, 72), (640, 112), (692, 172),
            (718, 240), (716, 300), (694, 336), (648, 362), (596, 384), (520, 410), (430, 426), (350, 424), (290, 410), (250, 386),
            (234, 356), (246, 330), (228, 326), (178, 322), (132, 308), (104, 290)]
sulci = [[(150, 150), (260, 128), (392, 112)], [(128, 226), (240, 212), (380, 196)], [(432, 47), (424, 140), (382, 290)],
         [(246, 330), (378, 294), (505, 270), (548, 252)], [(480, 196), (570, 160), (650, 196)], [(268, 372), (410, 336), (560, 318)]]
cb = [(566, 404), (612, 384), (660, 372), (706, 350), (738, 384), (742, 424), (720, 458), (676, 480), (620, 486), (578, 474), (556, 446)]

def brain_icon(cx, cy, w, flip=False, stem=True):
    sc = w / 650
    def T(pts):
        return [((cx + ((x - 405) * sc) * (-1 if flip else 1)), cy + (y - 260) * sc) for x, y in pts]
    out = f'<path class="brain-deco" d="{smooth(T(cb), closed=True)}"/>'
    if stem:
        out += f'<path class="brain-deco" d="{smooth(T([(452, 412), (540, 414), (530, 500), (500, 560), (480, 500)]), closed=True)}"/>'
    out += f'<path class="brain-deco" d="{smooth(T(cerebrum), closed=True)}"/>'
    out += f'<path class="brain-gyri" d="{" ".join(smooth(T(wiggle(q, 3, seed=i))) for i, q in enumerate(sulci))}"/>'
    return out

rat = smooth([(36, 214), (56, 196), (88, 174), (118, 160), (138, 150), (150, 132), (162, 150), (196, 170), (260, 176), (320, 182),
              (366, 204), (384, 236), (376, 262), (356, 278), (362, 334), (346, 340), (332, 300), (316, 284), (260, 286), (200, 284),
              (180, 296), (182, 336), (166, 340), (158, 298), (138, 276), (96, 256), (66, 238), (42, 226)], closed=True, t=0.45)
tail = 'M 380 244 C 410 238 432 220 452 186'
eye = '<circle class="eye-dot" cx="72" cy="200" r="3.5"/>'
human = smooth([(612, 72), (570, 86), (548, 114), (546, 138), (534, 160), (548, 170), (546, 188), (552, 204), (574, 214), (582, 234),
                (552, 250), (540, 300), (546, 464), (692, 464), (700, 300), (690, 252), (654, 234), (656, 208), (676, 188),
                (686, 148), (672, 102), (646, 80)], closed=True, t=0.45)

sil1 = f'''<g class="deco silhouette">
    <path class="body" d="{rat}"/>
    <path class="tail" d="{tail}"/>
    {eye}
    <path class="body" d="{human}"/>
    <circle class="eye-dot" cx="562" cy="140" r="3.5"/>
  </g>'''
neuraxis = f'''<g class="deco neuraxis">
    {brain_icon(100, 196, 62, stem=False)}
    <path class="cord" d="M 124 200 C 180 196 280 196 372 214"/>
    {brain_icon(612, 132, 108, stem=False)}
    <path class="cord" d="M 638 160 C 652 186 660 214 660 260 L 660 456"/>
  </g>'''
s = re.sub(r'<g class="deco silhouette">\s*<ellipse cx="240".*?</g>', sil1, s, count=1, flags=re.S)
s = re.sub(r'<g class="deco neuraxis">.*?</g>', neuraxis, s, count=1, flags=re.S)

top_half = lambda pts: smooth(pts, closed=True)
left = [(436, 556), (404, 560), (376, 576), (360, 606), (360, 640), (372, 668), (400, 686), (436, 690)]
right = [(444, 556), (476, 560), (504, 576), (520, 606), (520, 640), (508, 668), (480, 686), (444, 690)]
top_gyri = ' '.join(smooth(wiggle(q, 3, seed=i)) for i, q in enumerate([
    [(380, 590), (410, 600), (430, 596)], [(370, 630), (400, 624), (428, 634)], [(380, 664), (410, 660), (430, 668)],
    [(500, 590), (470, 600), (450, 596)], [(510, 630), (480, 624), (452, 634)], [(500, 664), (470, 660), (450, 668)]]))
sil2 = f'''<g class="deco silhouette">
      {brain_icon(150, 612, 170)}
      <path class="brain-deco" d="{top_half(left)}"/>
      <path class="brain-deco" d="{top_half(right)}"/>
      <path class="brain-gyri" d="{top_gyri}"/>
      {brain_icon(730, 612, 170)}
    </g>'''
s = re.sub(r'<g class="deco silhouette">\s*<ellipse class="brain-deco" cx="150".*?</g>', sil2, s, count=1, flags=re.S)
P.write_text(s)
print('patched', P)
