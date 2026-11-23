---
title: Adding up inputs
summary: EPSPs and IPSPs, temporal versus spatial summation, and where the decision to fire is made.
minutes: 5
---

## Small nudges {#psps}

When an upstream neuron fires, it causes a small voltage change in the next cell, a **postsynaptic potential**. One input is usually far too small to reach threshold by itself.

- An **EPSP** (excitatory postsynaptic potential) depolarizes the cell, nudging it toward threshold.
- An **IPSP** (inhibitory postsynaptic potential) hyperpolarizes it, pushing it away from threshold and slowing firing.

## Summation {#summation}

A neuron fires only when enough EPSPs add up {{C-017}}:

- **Temporal summation:** EPSPs from the *same synapse*, arriving in rapid succession, pile up over time.
- **Spatial summation:** EPSPs from *different synapses*, arriving at the same time, add up across the cell.

::check{q="q-ap-temporal"}

## Where the decision is made {#hillock}

::diagram{id="neuron" highlight="axon-hillock"}

All these inputs spread through the dendrites and cell body to the **axon hillock**, the *spike initiation zone*. If the summed voltage there reaches threshold, an action potential fires down the axon. IPSPs can cancel EPSPs, so the cell is constantly weighing its excitatory inputs against its inhibitory ones.

::check{q="q-ap-hillock"}
