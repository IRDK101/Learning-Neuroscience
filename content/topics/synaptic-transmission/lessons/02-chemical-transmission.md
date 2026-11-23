---
title: How a chemical synapse works
summary: Where synapses can land, what counts as a neurotransmitter, the four transmitter classes, and the four steps from synthesis to cleanup.
minutes: 8
---

## Where synapses land {#types}

Axons can synapse almost anywhere on another cell:

- **Axodendritic**, onto a dendrite. This is the typical one.
- **Axospinous**, onto a dendritic spine, a spot specialized for a single synapse (a twig rather than a branch).
- **Axosomatic**, onto the cell body. These are more likely to trigger an action potential.
- **Axoaxonic**, onto another axon, at an unmyelinated spot. These are good for controlling whether it fires.
- **Axosynaptic**, onto another synapse, turning its message up or down like a volume knob.
- **Axoextracellular**, into open space, sending a broad message to many cells.
- **Axosecretory**, into the bloodstream, as hormone-releasing neurons do.

The connection can also be made weaker or stronger. A single contact is unlikely to trigger the next cell. Many contacts from the same axon combine spatial and temporal summation. An axon wrapped all around a cell makes an extremely strong connection. The **neuromuscular junction**, where a motor neuron meets a muscle fiber, is built to be extremely reliable.

::check{q="q-syn-axosomatic"}

## What counts as a neurotransmitter {#classes}

A **neurotransmitter** is a chemical released by a neuron that acts on another cell's receptors {{C-018}}. There are four classes:

- **Amino acids** (glutamate, GABA, glycine) are small, abundant and easy to make. Glutamate is the main excitatory transmitter and GABA the main inhibitory one.
- **Amines** (dopamine, serotonin, and others) are larger and take more work to make. They're powerful **neuromodulators** that adjust how strongly other synapses work.
- **Peptides** are much larger and hard to make. They're slower, but powerful.
- **Gasotransmitters**, such as nitric oxide and carbon monoxide, diffuse everywhere, which makes them hard to regulate.

## The four steps {#steps}

::diagram{id="synapse" highlight="synaptic-vesicle"}

::pathway{id="chemical-transmission-steps"}

::focus{highlight="synaptic-vesicle"}

**1. Synthesis and storage.** Amino acids and amines are made and packaged into vesicles right in the axon terminal. Peptides are made near the cell body by the rough ER and Golgi apparatus. They're packed into larger **secretory granules** and shipped down the axon.

::focus{highlight="voltage-gated-calcium-channel,snare-proteins"}

**2. Release.** Vesicles are tied to the membrane by **SNARE proteins**. When the action potential arrives, **voltage-gated Ca²⁺ channels** open and calcium rushes in. That lets the vesicles fuse and dump their transmitter into the cleft. Calcium is the key to release.

::check{q="q-syn-calcium"}

::focus{highlight="ionotropic-receptor,metabotropic-receptor,autoreceptor"}

**3. Receptor activation.** Transmitter binds receptors, mostly on the postsynaptic cell. The presynaptic cell can also have **autoreceptors** that "listen" to its own transmitter.

::focus{highlight="reuptake-transporter,acetylcholinesterase,astrocyte"}

**4. Deactivation** ends the *synaptic* signal so the synapse is ready for the next one {{C-019}}. It happens four ways: **reuptake** into the presynaptic cell, **enzymes** that break the transmitter down, uptake by **glia**, and **diffusion** away from the cleft. Deactivation matters as much as release. Without it, receptors would saturate and fast signaling would be impossible.

::check{q="q-syn-peptides"}
