---
title: Molecular mechanisms of learning
summary: Long-term potentiation, how AMPA and NMDA receptors and CaMKII strengthen synapses, long-term depression, spike timing, and the proteins that make memories last.
minutes: 9
---

## Short-term vs long-term {#stages}

Learning has two steps: **acquisition** (an experience creates a short-term memory) and **consolidation** (it becomes long-term). Short-term memories need active attention, fade fast and are easily disrupted. Long-term memories don't need attention, fade slowly and are much harder to disrupt. Both rest on physical changes at synapses.

## Long-term potentiation {#ltp}

::diagram{id="ltp-synapse" highlight="ampa-receptor,nmda-receptor" caption="A glutamate synapse onto a dendritic spine."}

In the hippocampus, a burst of high-frequency stimulation (a "tetanus") makes a synapse stronger for a long time afterwards: **[[long-term potentiation|long-term-potentiation]]** (LTP). After LTP, the same input produces a bigger response.

LTP is **input specific**. Only the synapses that were stimulated get stronger; a neighboring input onto the same cell is unchanged.

::check{q="q-mem-specific"}

## Two glutamate receptors {#receptors}

Glutamate binds two kinds of receptor on the spine:

- **[[AMPA receptors|ampa-receptor]]** let Na⁺ in and produce the ordinary EPSP.
- **[[NMDA receptors|nmda-receptor]]** are normally plugged by a magnesium ion ([[Mg²⁺ block|magnesium-block]]). They open only when glutamate is bound **and** the cell is already depolarized, which pushes the Mg²⁺ out. Then **Ca²⁺** flows in.

So the NMDA receptor is both ligand-gated and voltage-gated. It detects when the sending cell is active (glutamate) at the same time as the receiving cell (depolarization), the molecular version of "fire together, wire together".

::check{q="q-mem-nmda"}

## What calcium does {#calcium}

::focus{highlight="camkii,protein-kinase-c,ampa-receptor"}

::pathway{id="ltp-mechanism"}

Calcium switches on kinases, enzymes that add phosphate groups to other proteins:

- **[[Protein kinase C|protein-kinase-c]]** phosphorylates AMPA receptors so each one passes more current.
- **[[CaMKII|camkii]]** does the same, and also gets **more AMPA receptors** inserted into the synapse from stores inside the cell.

More and better AMPA receptors mean a bigger response to the same glutamate: a stronger synapse. In the rat [[inhibitory avoidance|inhibitory-avoidance]] task, a single shock in one compartment teaches the rat to avoid it, and hippocampal responses rise and stay raised, much like LTP.

## Long-term depression {#ltd}

Synapses can also weaken: **[[long-term depression|long-term-depression]]** (LTD). With weak activity, only a little Ca²⁺ enters. Instead of kinases, that switches on **[[phosphatases|phosphatase]]**, which remove phosphates from AMPA receptors and pull them out of the membrane. LTD is input specific too.

## Timing decides {#timing}

How much calcium comes in depends on timing ([[spike timing|spike-timing]]):

- If the presynaptic cell fires **just before** the postsynaptic cell, the synapse strengthens (LTP).
- If it fires **just after**, the synapse weakens (LTD).
- The closer together the two spikes, the bigger the change.

::check{q="q-mem-timing"}

## Making it last {#proteins}

Phosphorylating existing proteins strengthens a synapse for hours. Memories that last longer need **new proteins** and structural changes at the synapse ([[proteins and lasting memory|protein-synthesis-memory]]):

- Drugs that block protein synthesis stop long-term memories from forming, while short-term memory still works.
- **[[CREB|creb]]** is a transcription factor that switches on the genes for those proteins. Blocking it prevents long-term memory; boosting it in flies and mice lets long-term memories form with less training.
- The **molecular switch hypothesis** proposes that CaMKII can keep itself switched on by phosphorylating itself, holding a synapse in its strengthened state.

In short, a memory starts as electrical activity, which drives messengers inside the cell, which change proteins and, for the long haul, make new ones.

::check{q="q-mem-protein"}
