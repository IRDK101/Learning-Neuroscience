# NeuroMap visual design

## Brief
- **Who:** a PSYC 6 student reviewing for exams, plus friends learning neuroscience from scratch.
- **Primary job:** make brain structures memorable and easy to find.
- **Fixed by the client:** a mostly blue palette, with brain regions in distinct colors when highlighted.

## Direction: stained slide & specimen plate
The course's own history section supplies the look:
- Nissl and methylene-blue stains on glass slides
- Cajal's ink drawings of neurons
- 19th-century anatomical plates with figure captions

So the site is Prussian and methylene blue ink on cool, slide-glass white. The diagrams are the plates, and everything around them stays quiet. Dark mode is the fluorescence microscope: deep blue-black with DAPI-blue light.

## Tokens

| Role | Light | Dark |
|---|---|---|
| Page (slide) | `#EEF3F9` | `#07101F` |
| Surface (glass) | `#FAFCFF` | `#0D1A30` |
| Ink (text) | `#0F2347` | `#DCE7FA` |
| Methylene (actions, links) | `#2346B8` | `#7FB0FF` |
| Cresyl violet (corrections, annotations) | `#5A3E9E` | `#B49BFF` |
| Rule (hairlines) | `#C7D3E4` | `#22355A` |

Region colors on the diagrams stay the Okabe-Ito families from PLAN.md §6; the blue UI never competes with them.

**Type**
- **Bodoni Moda** (variable, optical sizes) for page and lesson titles only, at 1.5rem and up. It's a Didone, the kind of high-contrast type used on Cajal-era scientific plates.
- **Atkinson Hyperlegible Next** for everything else: body, UI and diagram labels. It was designed by the Braille Institute for legibility, which suits beginners and small labels on a phone.
- Scale: 17px lessons / 16px UI; titles 2.7 / 1.7 / 1.2rem; small text 0.875rem.
- Line length is capped at 68ch, with 1.6 line-height for lesson text.

**Shape**
- Corner radius depends on role: plates (diagrams) 4px, controls 8px, on/off toggles fully rounded.
- No drop shadows except on things that float (popovers, the sticky header).

## Layout
- Everything is left-aligned.
- Content sits directly on the page, separated by hairline rules. Boxes are only for things you interact with: diagram plates, flashcards, questions, the game board.

```
Home
+--------------------------------------------------------------+
| NeuroMap                           Learn Map Cards Play  (◐) |
+------------------------------+-------------------------------+
| Learn the brain by           |  ┌ live NT overlay plate ──┐  |
| taking it apart.             |  │  tap any nucleus         │  |
| short paragraph              |  └──────────────────────────┘  |
| [Continue lesson] [12 due]   |  Figure. Locus coeruleus: …   |
+------------------------------+-------------------------------+
| Today: 12 cards due, 3-day streak.            (one prose line) |
+--------------------------------------------------------------+
| Exam 1          | Exam 2              | Exam 3                 |
| 1 History       | 8 Chemical senses   | 15 Emotion             |
| 2 Structure  ▔▔ | 9 Auditory…         | 16 Resting brain…      |  ← syllabus, numbered
| …               | …                   | …                      |    because it IS a sequence
+--------------------------------------------------------------+
```

## Principles
1. **The diagram is the hero.** One bold thing per page: the live plate on Home, the sticky figure in lessons.
2. **Structure must carry meaning.** Numbers only for real sequences (topics, lessons, pathway steps); figure captions under plates; rules between sections, not boxes.
3. **No template chrome.** Sentence-case labels, no ALL-CAPS kickers, no "A · B" meta strings, no arrows tacked onto link text, no big-number stat tiles.
4. **Motion only answers an action**, plus the one motion that carries meaning: the flowing dashes that show which way axons project.
5. **Quality floor, not announced:** responsive to 360px, visible focus, reduced motion respected, AA contrast in both themes.

## Review against the generic defaults (done before building)
- *Serif display + sans body* is a common pairing. I kept it, but the serif is a Didone tied to the subject's era instead of the usual soft display serif, and it's used only for titles.
- *Cool white + blue* is the client's requirement. It isn't the cream/terracotta default.
- The Phase 1 build used the SaaS card kit (identical rounded panels with soft shadows), a gradient progress meter, big-number KPI tiles, uppercase eyebrows, middot meta and "→" links. All of these are removed in this pass.

## Notes for later passes
- Tried: specimen-plate captions ("Figure. …") under diagrams; a blue-ruled index-card face for flashcards.
- If a later page needs a bold moment, take it from the slide/stain world (e.g., a stained-neuron drawing), not from generic decoration.
