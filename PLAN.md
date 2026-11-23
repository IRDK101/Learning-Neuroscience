# NeuroMap: Phase 0 Plan

Status: **draft for approval**. Nothing is built yet. Corrections to the notes are logged separately in [`CORRECTIONS.md`](./CORRECTIONS.md).

Source: `notes/PSYC6_notes.pdf` (66 pages, about 27k words, text only with no figures). The notes run in the order Exam 3 → Exam 2 → Exam 1. The site re-orders them into course order.

---

## 1. Changes I'd make to the brief

These are small. The constraints stay as written.

1. **Add one topic and move some content.**
   - The notes include a **"Neuroscience: Past, Present, and Future"** section (trepanation → Cajal) that isn't in the topic inventory. I'd make it Lesson 1 of Exam 1.
   - **Smell** sits under the "Somatosensory System" heading in the notes. I'll move it to **Chemical Senses**, where it belongs.
   - **Molecular Mechanisms of Learning and Memory** becomes its own lesson inside the Memory topic.
2. **Write lessons in Markdown, not YAML.** Lessons are mostly prose, so each one is a `.md` file with a few directives (`::diagram`, `::check`, `::practice`). Entities, cards and questions stay in YAML.
3. **Let the SVGs decide which regions each diagram shows.** Each clickable shape in an SVG carries `data-region="amygdala"`, and the build reads these to work out which diagrams a region appears on. This replaces listing `views` by hand in the region YAML. Having one source of truth means the two can't drift apart, and the validator fails if an SVG names a region that doesn't exist.
4. **Two extra entity types: `drug` and `person`.**
   - Drugs appear in many places: cocaine, amphetamine, L-DOPA, MAOIs, SSRIs, benzodiazepines, alcohol, lithium, PCP/ketamine, TTX, antipsychotics. As shared entities they can power "which drug…" questions and appear on every NT's page.
   - People (Broca, Wernicke, Cajal, Golgi, Galvani, Gall, Brodmann…) are needed for the history lesson.
5. **Every entity has a one-line `short` definition, and that's what hover/tap definitions show.** `glossary.yaml` then only holds pure vocabulary that isn't an entity (ipsilateral, EPSP, saltatory…), so the same definition never lives in two places.
6. **Generated cards and questions get stable, deterministic IDs** (e.g. `gen:region→function:amygdala`). Saved spaced-repetition progress then survives rebuilds. Any entity can opt out with `generate: false`.
7. **Show a "Corrected" badge.** Anything marked `source: corrected` gets a small badge, and tapping it shows your original wording and the reason. This matters for exams: if your professor taught a simplified version, you'll know where the site differs from the lecture.
8. **Stack additions:**
   - `yaml` to parse content
   - `remark` + `remark-directive` for lessons (no MDX, so content files never contain code)
   - `@dnd-kit` for drag-and-drop, since it has a built-in keyboard sensor
   - FSRS via `ts-fsrs`

   Everything else is as you suggested.
9. **Licensing for the 3D model (Phase 3).** BodyParts3D is CC BY-SA 2.1 JP. That's fine for us with a credit, but the mesh files keep the share-alike license. They'll also need heavy decimation for mobile. The container's network may block the download. If it does, I'll ask, or fall back to a stylized model and tell you.

---

## 2. File and folder structure

```
/
├─ notes/PSYC6_notes.pdf          # source material (committed)
├─ content/                       # ALL learning content lives here, no code
│  ├─ units.yaml                  # exam1/2/3: titles, order, colors
│  ├─ topics.yaml                 # topic → unit, order, lessons, summary
│  ├─ shared/
│  │  ├─ regions/                 # one file per system (the color family)
│  │  │  ├─ cortex-frontal.yaml   cortex-parietal.yaml   cortex-temporal.yaml
│  │  │  ├─ cortex-occipital.yaml limbic.yaml  basal-ganglia.yaml
│  │  │  ├─ diencephalon.yaml     brainstem.yaml cerebellum.yaml
│  │  │  ├─ spinal-cord.yaml      eye.yaml  ear.yaml  periphery.yaml  ...
│  │  ├─ neurotransmitters.yaml
│  │  ├─ drugs.yaml
│  │  ├─ people.yaml
│  │  └─ glossary.yaml
│  └─ topics/
│     └─ nt-systems/              # one folder per topic
│        ├─ entities.yaml         # pathways, concepts, cases, experiments introduced here
│        ├─ cards.yaml            # hand-written flashcards
│        ├─ questions.yaml        # hand-written quiz questions
│        └─ lessons/
│           ├─ 01-cholinergic.md
│           └─ 02-catecholamines.md
├─ src/
│  ├─ diagrams/                   # hand-drawn SVGs + a small meta file each
│  │  ├─ brain-midsagittal.svg
│  │  └─ brain-midsagittal.meta.yaml   # title, description, label positions
│  ├─ content/                    # zod schemas, loader, graph, generators
│  ├─ features/                   # lessons, map, flashcards, games, explorer3d
│  ├─ progress/                   # localStorage store, export/import, FSRS
│  └─ ui/                         # shared components, theme tokens
├─ scripts/
│  ├─ build-content.ts            # YAML/MD → validated graph → src/generated/content.json
│  └─ validate.ts                 # same pipeline, no output; exit 1 on any error
├─ tests/                         # vitest
├─ .github/workflows/deploy.yml   # validate → test → build → Pages
├─ .claude/commands/add-notes.md  # Phase 3
├─ CLAUDE.md  CONTENT_GUIDE.md  CORRECTIONS.md
```

**How content gets into the app.** `scripts/build-content.ts` does the following:

1. Loads every YAML and Markdown file.
2. Validates each one against its Zod schema.
3. Resolves every ID reference (it fails on dangling references, duplicate IDs, or a type mismatch such as `cases: [amygdala]`).
4. Reads the `data-region` IDs out of the SVGs.
5. Generates cards and questions from the graph.
6. Writes one JSON file.

`npm run validate` runs steps 1–5 and also checks:

- every hotspot maps to a real region
- every region on a diagram can be reached by keyboard
- every `::check` points at a real question
- every `corrected` item cites a `CORRECTIONS.md` ID that exists

### ID conventions

- IDs are kebab-case, **unique across all entity types**, and named for the thing itself: `amygdala`, `basolateral-amygdala`, `dopamine`, `corticospinal-tract`, `hm-henry-molaison`, `schachter-singer`.
- Abbreviations go in `aliases`, never in the ID. So the ID is `vta` only if that's the common name; here it's `ventral-tegmental-area` with alias `VTA`.
- Hand-written cards are `c-<topic>-<slug>`, questions are `q-<topic>-<slug>`, and corrections are `C-001`, `C-002`, ….
- Tags: `unit: exam1|exam2|exam3`, `topic: <topic-id>`, `difficulty: 1|2|3`, `source: notes|corrected|added`.

---

## 3. Content schema: one real example of each type, from your notes

### Region
```yaml
# content/shared/regions/limbic.yaml
- id: amygdala
  type: region
  name: Amygdala
  aliases: [amygdaloid complex]
  parent: limbic-system
  system: limbic                 # picks the color family
  short: Almond-shaped cluster of nuclei deep in the temporal lobe that detects threats and learns fear.
  location: Deep in the medial temporal lobe, just in front of the hippocampus. There is one in each hemisphere.
  functions:
    - text: Detects threat and fear, including reading fear in other people's faces (especially the whites of the eyes).
      source: notes
    - text: Learns fear by pairing a neutral stimulus with a dangerous one (Pavlovian fear conditioning).
      source: corrected
      corrections: [C-062]       # notes called this the "Garcia effect"
    - text: Affective (not predatory) aggression and social rank.
      source: notes
    - text: Drives the HPA stress axis up (the hippocampus brakes it).
      source: notes
  connections:
    - { to: hypothalamus, dir: out, note: "Central nucleus → hypothalamus → autonomic fear response" }
    - { to: sensory-thalamus, dir: in, note: "Fast route for threat cues" }
    - { to: prefrontal-cortex, dir: both, note: "PFC supplies context: snake in the wild vs. at the zoo" }
  cases: [kluver-bucy-syndrome, urbach-wiethe-disease]
  mesh: null                     # too small for the 3D view; 2D only
  topics: [emotion, memory, mental-illness]
  source: notes

- id: basolateral-amygdala
  type: region
  name: Basolateral nuclei
  parent: amygdala
  system: limbic
  short: Amygdala input hub that receives sensory information and pairs it into fear associations.
  functions:
    - { text: "Receives input from the sensory systems; the site where cue–danger associations form.", source: notes }
    - { text: "Sends some outputs to the cortex.", source: notes }
  source: notes
```

### Pathway (anatomical, and a synthesis chain)
```yaml
- id: corticospinal-tract
  type: pathway
  kind: anatomical               # anatomical | synthesis | circuit | signaling
  name: Corticospinal tract
  short: The main voluntary-movement highway; one upper motor neuron axon runs from cortex to spinal cord.
  steps:
    - { label: "Upper motor neuron cell body in M1 (and premotor area 6)", ref: primary-motor-cortex }
    - { label: "Axon descends through the brainstem", ref: brainstem }
    - { label: "Crosses the midline at the pyramidal decussation", ref: medulla, note: "This is why each hemisphere moves the opposite side of the body" }
    - { label: "Runs down the lateral column of the contralateral spinal cord", ref: lateral-column }
    - { label: "Synapses on a lower (alpha) motor neuron in the ventral horn", ref: ventral-horn }
    - { label: "Alpha motor neuron releases ACh onto the muscle fiber", ref: neuromuscular-junction }
  diagrams: [spinal-cord-section, brain-lateral]
  topics: [brain-control-of-movement]
  source: corrected
  corrections: [C-052]

- id: catecholamine-synthesis
  type: pathway
  kind: synthesis
  name: Catecholamine synthesis
  short: Tyrosine is converted step by step into dopamine, then norepinephrine, then epinephrine.
  steps:
    - { label: Tyrosine, ref: tyrosine }
    - { label: L-DOPA, via: tyrosine-hydroxylase, note: "Rate-limiting step for all catecholamines" }
    - { label: Dopamine, ref: dopamine, via: dopa-decarboxylase, source: corrected, corrections: [C-022] }
    - { label: Norepinephrine, ref: norepinephrine, via: dopamine-beta-hydroxylase, note: "DBH sits inside the vesicle" }
    - { label: Epinephrine, ref: epinephrine, via: pnmt, note: "NE must leave the vesicle; PNMT is in the cytosol" }
  topics: [nt-systems]
  source: notes
```

### Neurotransmitter
```yaml
- id: dopamine
  type: neurotransmitter
  name: Dopamine
  aliases: [DA]
  class: amine
  subclass: catecholamine
  short: Catecholamine neuromodulator for movement, reward learning and motivation.
  precursor: tyrosine
  synthesis: catecholamine-synthesis      # the chain up to the DA step
  rateLimiting: { enzyme: tyrosine-hydroxylase, note: "Tyrosine → L-DOPA" }
  sources:
    - { nucleus: substantia-nigra, targets: [striatum], note: "Movement; lost in Parkinson's" }
    - { nucleus: ventral-tegmental-area, targets: [prefrontal-cortex], note: "Reward learning, motivation, addiction" }
  functions:
    - { text: "Learning what is rewarding (incentive), not producing pleasure itself.", source: notes }
    - { text: "Initiating movement through the basal ganglia direct/indirect pathways.", source: notes }
  deactivation:
    reuptake: { transporter: dopamine-transporter, note: "Back into the terminal, then repackaged or broken down" }
    enzymes: [mao]
  drugs: [cocaine, amphetamine, l-dopa, mao-inhibitors, antipsychotics]
  disorders: [parkinsons-disease, schizophrenia, addiction]
  source: notes
```

### Drug
```yaml
- id: cocaine
  type: drug
  name: Cocaine
  short: Stimulant that blocks the dopamine transporter so DA stays in the synapse longer.
  acts_on: [dopamine]
  target: dopamine-transporter
  action: reuptake-inhibitor     # agonist | antagonist | reuptake-inhibitor | enzyme-inhibitor | releaser
                                 # | channel-blocker | allosteric-modulator | precursor
  net_effect: increases          # increases | decreases signaling
  mechanism: Blocks DAT, so dopamine lingers and keeps activating receptors. Receptors eventually desensitize.
  source: notes
```

### Case / disorder
```yaml
- id: hm-henry-molaison
  type: case
  kind: patient                  # patient | syndrome | disorder
  name: H.M. (Henry Molaison)
  short: Patient who lost the ability to form new declarative memories after medial temporal lobe surgery.
  damage:
    regions: [hippocampus, entorhinal-cortex, amygdala]
    cause: Bilateral medial temporal lobe removal to treat epilepsy
  deficits:
    - { text: "Severe anterograde amnesia: no new episodic memories after surgery", source: notes }
    - { text: "Some (temporally graded) retrograde amnesia", source: notes }
  spared:
    - { text: "Procedural memory: could still learn new motor skills", source: notes }
  teaches: Declarative memory depends on the medial temporal lobe; procedural memory does not.
  topics: [memory]
  source: notes
```

### Concept
```yaml
- id: long-term-potentiation
  type: concept
  name: Long-term potentiation
  aliases: [LTP]
  short: A long-lasting strengthening of a synapse after strong, correlated activity.
  body: |
    Strong (tetanic) stimulation depolarizes the postsynaptic cell, which pushes the Mg²⁺ plug out of
    NMDA receptors. Ca²⁺ flows in and activates CaMKII and PKC. These kinases phosphorylate AMPA
    receptors and insert new ones, so the same input now produces a bigger EPSP.
  properties:
    - Input-specific (only the stimulated synapse changes)
    - Associative ("cells that fire together wire together")
  related: [hebbian-learning, nmda-receptor, ampa-receptor, long-term-depression, camkii]
  regions: [hippocampus]
  source: notes
```

### Experiment
```yaml
- id: schachter-singer
  type: experiment
  name: Epinephrine-injection ("vitamin") studies
  aliases: [Schachter & Singer (1962)]
  short: Arousal from an adrenaline injection was felt as anger or happiness depending on the situation.
  setup: Participants were told they were getting a vitamin but received epinephrine or saline. They then waited with an angry or a euphoric confederate.
  findings:
    - { text: "Epinephrine-injected participants who were NOT told about side effects reported more of the confederate's emotion.", source: notes }
    - { text: "Participants told to expect racing heart and tremor did not; they had an explanation for their arousal.", source: notes }
  shows: Emotion = bodily arousal + a cognitive label for it (two-factor theory). It supports the idea that the body matters (James-Lange), but adds the label.
  supports: [two-factor-theory]
  source: corrected
  corrections: [C-058]
```

### Person
```yaml
- id: santiago-ramon-y-cajal
  type: person
  name: Santiago Ramón y Cajal
  years: "1852–1934"
  short: Used the Golgi stain to show the brain is made of separate neurons (the neuron doctrine).
  contributions: [neuron-doctrine]
  source: notes
```

### Glossary term (vocabulary only; entities define themselves)
```yaml
- id: ipsilateral
  type: term
  name: Ipsilateral
  short: On the same side of the body (opposite of contralateral).
  source: added
```

### Flashcards (three kinds)
```yaml
- id: c-nt-da-sources
  kind: basic
  front: Which two midbrain areas are the main sources of dopamine, and where does each project?
  back: Substantia nigra → striatum (movement). VTA → frontal cortex (reward and motivation).
  refs: [dopamine, substantia-nigra, ventral-tegmental-area]
  tags: { topic: nt-systems, unit: exam1, difficulty: 2 }
  source: notes

- id: c-nt-occ-lc
  kind: occlusion                # the region is highlighted on the diagram, labels hidden
  diagram: nt-overlay-midsagittal
  target: locus-coeruleus
  front: Name the highlighted nucleus and the transmitter it makes.
  back: Locus coeruleus, the brain's main source of norepinephrine.
  tags: { topic: nt-systems, unit: exam1, difficulty: 2 }
  source: notes

# reverse cards are mostly GENERATED, e.g. from amygdala.functions[0]:
#   id: gen:fn→region:amygdala:0
#   front: "Which region: detects threat and fear, including reading fear in faces?"  back: Amygdala
```

### Questions
```yaml
- id: q-nt-amphetamine-vs-cocaine
  kind: mcq
  stem: Amphetamine raises synaptic dopamine more than cocaine does. Why?
  answer: It also enters the terminal and releases DA from vesicles without an action potential.
  distractors:
    - { text: "It inhibits tyrosine hydroxylase.", why: "That would lower DA production." }
    - { text: "It blocks MAO on the postsynaptic cell.", why: "MAO sits in the presynaptic terminal (on mitochondria). That's how MAOIs work, not amphetamine." }
    - { text: "It is a direct D2 receptor agonist.", why: "Amphetamine acts on the transporter and vesicles, not on the receptor." }
  refs: [amphetamine, cocaine, dopamine]
  lesson: nt-systems/02-catecholamines#dopamine
  tags: { topic: nt-systems, unit: exam1, difficulty: 3 }
  source: notes

- id: q-lang-split-brain-case
  kind: case                     # "which region would be damaged if…"
  stem: After surgery, a patient can't name an object held in the left hand, but can pick the same object out of a bag with that hand. What was cut?
  answer: corpus-callosum        # answer may be an entity ID; distractors are then auto-picked from same type + topic
  explain: Touch from the left hand reaches the right hemisphere, but language is in the left hemisphere. Without the corpus callosum the information can't cross over.
  tags: { topic: language, unit: exam3, difficulty: 2 }
  source: notes
```

**Auto-generated question templates.** Each template draws distractors from the same entity type and topic.

- region → function, and function → region
- NT → source nucleus, and nucleus → NT
- NT → precursor and rate-limiting enzyme
- drug → mechanism, and mechanism → drug
- case → damaged region, and damaged region → deficit
- pathway → next step
- experiment → what it shows

---

## 4. Topics → lessons (learning path)

Each lesson takes about 5–10 minutes and has 2–3 check-yourself questions. Every topic ends with "Practice this topic".

**Exam 1: Foundations**

| # | Topic | Lessons |
|---|---|---|
| 1 | History of Neuroscience *(new)* | Ancient brains (trepanation → Galen) · From Descartes to the neuron doctrine |
| 2 | Structure of the Nervous System | Orientation & planes · CNS/PNS & autonomic · Meninges, ventricles & blood supply · Forebrain & cortex · Diencephalon & brainstem |
| 3 | Neurons and Glia | Parts of a neuron · Neuron types & glia · Cytoskeleton & axoplasmic transport |
| 4 | Neuronal Membrane at Rest | Ions, membrane & channels · Resting potential & the Na⁺/K⁺ pump |
| 5 | The Action Potential | Phases & channels · Conduction & myelin · Summation (EPSP/IPSP) |
| 6 | Synaptic Transmission | Electrical vs chemical synapses · The 4 steps of chemical transmission · Receptors |
| 7 | **Neurotransmitter Systems** *(Phase 1 slice)* | Agonists, antagonists & -ergic systems · ACh · Catecholamines (DA/NE/Epi) · Serotonin · Amino acids (Glu/GABA/Gly) |

**Exam 2: Senses & Movement**

| # | Topic | Lessons |
|---|---|---|
| 8 | Chemical Senses | Taste transduction · Taste pathway & taste aversion · Smell |
| 9 | Auditory & Vestibular | Sound & the middle ear · Cochlea & hair cells · Auditory pathway · Vestibular system |
| 10 | Somatosensory | Skin mechanoreceptors · Pain & temperature · DCML vs spinothalamic (+ Brown-Séquard) · S1 & somatotopy |
| 11 | The Eye | Eye anatomy & optics · Retina & phototransduction · ON/OFF cells & receptive fields |
| 12 | Central Visual System | Retina → LGN → V1 (visual-field lesions) · V1 & beyond (agnosias) |
| 13 | Spinal Control of Movement | Muscles & motor units · Spindles, GTOs & reflexes |
| 14 | Brain Control of Movement | Hierarchy & descending tracts · M1, PMA & population coding · Basal ganglia · Cerebellum |

**Exam 3: Higher Functions**

| # | Topic | Lessons |
|---|---|---|
| 15 | Emotion | Theories of emotion · Limbic system & Papez · Amygdala · Hypothalamus & aggression |
| 16 | Resting Brain, Attention, Unconscious | Default mode network · Attention (bottom-up, top-down, covert) · Attention circuits & neglect |
| 17 | Language | Language & aphasias · Wernicke-Geschwind model · Lateralization (Wada, split brain) |
| 18 | Memory | Memory types & stages · Working memory & PFC · MTL & H.M. · Consolidation · Molecular mechanisms (LTP/LTD) |
| 19 | Mental Illness | Anxiety, OCD & the HPA axis · Treating anxiety · Mood disorders · Schizophrenia |

That's 19 topics and about 60 lessons. The "Start here" path is the same list, with a short "how to read a brain diagram" primer in front.

---

## 5. Diagrams (original SVGs, drawn from scratch)

**Phase 1 (needed for the NT slice):**

1. **Brain, midsagittal.** Cortex lobes, corpus callosum, cingulate, thalamus, hypothalamus, midbrain, pons, medulla, cerebellum, fornix, pituitary, ventricles.
2. **NT systems overlay.** Uses the midsagittal base plus the striatum and basal forebrain. Shows the source nuclei (SN, VTA, locus coeruleus, raphe, basal forebrain/septal + Meynert, PMT complex) with animated projection paths for each NT.
3. **Synapse.** Vesicles, SNARE docking, voltage-gated Ca²⁺ channel, receptors (ionotropic and metabotropic), transporter (reuptake), MAO on mitochondria, autoreceptor. Drug overlays show where cocaine, amphetamine, SSRIs and MAOIs act.
4. **Catecholamine chain.** A diagram of the synthesis pathway, which is also used by the pathway builder.

**Phase 2:**

5. Anatomical orientation explainer: rotating quadruped vs. human axes, the 90° neuraxis bend, and the three section planes, interactive.
6. Brain, lateral view: lobes, sulci/fissures, M1, S1, FEF, PMA/SMA, Broca, Wernicke, A1, V1, arcuate fasciculus, PPC, angular gyrus/TPJ, MCA/ACA/PCA territories as a toggle layer.
7. Brain, coronal slice: caudate, putamen, globus pallidus, thalamus, hypothalamus, amygdala/hippocampus, lateral and third ventricles, insula, internal capsule, corpus callosum.
8. Brain, ventral view: Circle of Willis, olfactory bulbs, optic chiasm, fusiform gyrus.
9. Meninges cross-section.
10. Neuron (parts, types, glia).
11. Membrane & ion channels, plus the **action potential trace**: step through the phases and watch the channels open.
12. Spinal cord cross-section: horns, dorsal root ganglion, dorsal columns, spinothalamic, corticospinal; DCML vs spinothalamic animation; Brown-Séquard toggle.
13. Muscle spindle / GTO / reflex arc.
14. Skin & mechanoreceptors.
15. Tongue → taste bud → taste cell (5 transduction modes).
16. Olfactory epithelium → bulb → targets.
17. Ear: outer/middle/inner, plus the **unrolled cochlea** for tonotopy, the organ of Corti, and the vestibular labyrinth.
18. Eye (sagittal) and retinal layers.
19. **Visual pathway + lesion simulator**: cut the optic nerve, chiasm, tract or V1 and see the visual-field loss.
20. Basal ganglia loop (direct/indirect).
21. Papez circuit and the HPA axis (body diagram).

The 3D explorer (Phase 3) shows major structures only: lobes, cerebellum, brainstem, thalamus, corpus callosum, ventricles, hippocampus, caudate/putamen.

---

## 6. Visual design

- **Interface:** blue throughout. Deep navy in dark mode, pale blue surfaces in light mode, a blue accent for buttons and links. It follows your device's light/dark setting and has a toggle.
- **Region colors are grouped by system.** Each system gets one hue family, and subregions are shades of it. Hues come from the Okabe-Ito colorblind-safe set. Systems that appear on the same diagram get clearly different hues, and blue is avoided except for CSF and ventricles.

| System | Hue |
|---|---|
| Frontal lobe & motor | amber `#E69F00` |
| Parietal & somatosensory | yellow `#F0E442` |
| Temporal, auditory & language | reddish purple `#CC79A7` |
| Occipital & visual | green `#009E73` |
| Limbic (amygdala, hippocampus, cingulate) | vermillion `#D55E00` |
| Basal ganglia | teal `#2A9D8F` |
| Diencephalon (thalamus, hypothalamus) | violet `#8E6CC9` |
| Brainstem & cranial nerves | slate `#6B7B8C` |
| Cerebellum | olive `#8A8F2A` |
| White matter & tracts | warm gray |
| Ventricles & CSF | sky `#56B4E9` |

- **NT overlay colors:** DA orange, NE blue (the locus coeruleus is the "blue spot"), 5-HT purple, ACh green. The rest of the brain fades to neutral while the overlay is on.
- **Highlighting never relies on color alone.** The selected region gets a thick dark outline, a hatch pattern and a brief pulse. A "patterns" setting gives every system its own texture too.

I'll run every pair of colors that appear together through a colorblind simulation and check text contrast in Phase 1.

---

## 7. Phase 1 scope (once you approve)

- **App shell:** home with due count, streak and mastery; hash routes; theme; progress store with export/import.
- **Content pipeline:** schemas, `npm run validate`, Vitest tests.
- **The Neurotransmitter Systems topic, end to end:**
  - 5 lessons
  - diagrams 1–4
  - its regions, NTs, drugs and pathways
  - about 60 cards (hand-written plus generated)
  - about 40 questions
  - Find-the-region, Trivia and Pathway builder, all working on this topic
- **Deploy:** GitHub Actions to Pages, pushed to `main`.
- **Before deploy, you need to have done:** make the repo public, and set Settings → Pages → Source → **GitHub Actions**.

---

## 8. Phase 1 notes (what changed from this plan while building)

- **Diagrams live in `content/diagrams/`** (not `src/diagrams/`), next to the rest of the content, with one `diagrams.yaml` instead of a meta file per SVG. One SVG can back several diagrams: `nt-overlay` is the midline brain with neurotransmitter layers turned on.
- **Hotspots use `data-ref`** (any entity, not just regions), so the synapse diagram can have receptors, transporters and enzymes. A drug's target is highlighted by walking up `parent` links (e.g., cocaine → dopamine transporter → the generic reuptake transporter drawn on the synapse).
- **Lessons use `marked`** plus a small directive parser instead of remark. Same syntax as planned (`::diagram`, `::focus`, `::check`, `::pathway`, `:::added`), plus inline `[[id]]` links and `{{C-022}}` correction badges.
- **Added a `molecule` entity type** (enzymes, precursors, receptors, transporters, channels).
- **Generated cards and questions are made only for topics marked `ready`**, so unfinished topics don't fill decks with half-finished cards.
- **Content size:** one topic is about 400 KB of JSON (about 60 KB gzipped). Before all 19 topics are in, Phase 2 will split the bundle per topic and lazy-load it.
