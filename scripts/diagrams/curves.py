"""Helpers for drawing the NeuroMap diagrams: smooth curves through points (Catmull-Rom → cubic Bézier),
offsets and parallel lines. The diagram generators in this folder write SVGs into content/diagrams/.
Run any of them with `python3 scripts/diagrams/<name>.py`."""
import math


def f(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith('.0') else s


def smooth(pts, closed=False, t=0.5, move=True):
    """Smooth path through pts. closed=True wraps around and adds Z."""
    n = len(pts)
    if n < 2:
        return ''
    out = [f"M {f(pts[0][0])} {f(pts[0][1])}"] if move else []
    segs = n if closed else n - 1
    for i in range(segs):
        p0 = pts[(i - 1) % n] if (closed or i > 0) else pts[0]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else pts[(i + 1) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3)
        out.append(f"C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}")
    if closed:
        out.append('Z')
    return ' '.join(out)


def shift(pts, dx=0, dy=0):
    return [(x + dx, y + dy) for x, y in pts]


def mirror(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def rev(pts):
    return list(reversed(pts))


def normal_offset(pts, d):
    """Offset an open polyline sideways by d (positive = left of travel direction)."""
    out = []
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        out.append((x - dy / L * d, y + dx / L * d))
    return out


def blob(cx, cy, rx, ry, wobble=0.08, n=9, seed=1, rot=0):
    """An organic closed shape: an ellipse with gentle deterministic wobble."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        w = 1 + wobble * math.sin(a * 3 + seed) * math.cos(a * 2 + seed * 0.7)
        x, y = rx * w * math.cos(a), ry * w * math.sin(a)
        r = math.radians(rot)
        pts.append((cx + x * math.cos(r) - y * math.sin(r), cy + x * math.sin(r) + y * math.cos(r)))
    return smooth(pts, closed=True)


def wiggle(pts, amp=3.5, step=16, seed=0):
    """Densify a polyline and add a gentle meander, so sulci read as folds rather than strokes."""
    dense = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0)
        k = max(1, int(L // step))
        for i in range(k):
            dense.append((x0 + (x1 - x0) * i / k, y0 + (y1 - y0) * i / k))
    dense.append(pts[-1])
    out = []
    n = len(dense)
    for i, (x, y) in enumerate(dense):
        a = dense[max(i - 1, 0)]
        b = dense[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        taper = max(0.0, math.sin(math.pi * i / max(n - 1, 1))) ** 0.5
        o = amp * taper * math.sin(i * 1.7 + seed) * (0.6 + 0.4 * math.cos(i * 0.9 + seed * 2))
        out.append((x - dy / L * o, y + dx / L * o))
    return out


def ribbon(center, widths, closed_ends=True):
    """A closed band of varying width around a centerline (widths: one per point)."""
    n = len(center)
    left, right = [], []
    for i, (x, y) in enumerate(center):
        a = center[max(i - 1, 0)]
        b = center[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        w = widths[i] / 2
        left.append((x - dy / L * w, y + dx / L * w))
        right.append((x + dy / L * w, y - dx / L * w))
    return smooth(left + list(reversed(right)), closed=True, t=0.45)


def band(inner, outer):
    """Closed shape between two roughly parallel lines (both listed in the same direction)."""
    return smooth(inner + list(reversed(outer)), closed=True, t=0.45)


def sample(pts, per=4, closed=False, t=0.5):
    """Dense points along the smooth Catmull-Rom curve through pts (per = samples per unit of 10px)."""
    n = len(pts)
    out = []
    segs = n if closed else n - 1
    for i in range(segs):
        p0 = pts[(i - 1) % n] if (closed or i > 0) else pts[0]
        p1, p2 = pts[i], pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3)
        L = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
        k = max(2, int(L / 10 * per))
        for j in range(k):
            u = j / k
            a, b, c, d = (1 - u) ** 3, 3 * (1 - u) ** 2 * u, 3 * (1 - u) * u ** 2, u ** 3
            out.append((a * p1[0] + b * c1[0] + c * c2[0] + d * p2[0], a * p1[1] + b * c1[1] + c * c2[1] + d * p2[1]))
    if not closed:
        out.append(pts[-1])
    return out


def poly_d(pts, closed=True):
    s = 'M ' + ' L '.join(f"{f(x)} {f(y)}" for x, y in pts)
    return s + (' Z' if closed else '')


def taper(pts, w0, w1, t=0.4):
    """Filled, tapering branch along a centerline (width w0 at the start, w1 at the end)."""
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
    return smooth(L + [(tip[0] + (tip[0] - pts[-2][0]) * 0.08, tip[1] + (tip[1] - pts[-2][1]) * 0.08)] + list(reversed(R)), closed=True, t=t)


def spindle(center, wmax, wend=3):
    """A cell body that is thin at both ends and widest in the middle, along a centerline."""
    n = len(center)
    widths = [wend + (wmax - wend) * math.sin(math.pi * i / (n - 1)) ** 0.8 for i in range(n)]
    return ribbon(center, widths)


def bow(p0, p1, bulge, n=7):
    """Points along a gentle arc from p0 to p1, bulging sideways by `bulge`."""
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    return [(x0 + dx * k / (n - 1) + nx * bulge * math.sin(math.pi * k / (n - 1)),
             y0 + dy * k / (n - 1) + ny * bulge * math.sin(math.pi * k / (n - 1))) for k in range(n)]
