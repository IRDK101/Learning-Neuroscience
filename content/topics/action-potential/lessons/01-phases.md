---
title: The phases of an action potential
summary: The all-or-none spike, step by step, with the sodium and potassium channels that make each phase happen.
minutes: 7
---

## All or nothing {#all-or-none}

An action potential is like a toilet flush: below a certain push nothing happens, and above it you always get the same full flush. Once threshold is reached, the spike always has the same size and shape. A stronger stimulus doesn't make *bigger* spikes, it makes *more frequent* ones. Afterward there's a short **refractory period** when another spike can't fire, which caps how fast a neuron can go.

## Step by step {#phases}

::diagram{id="action-potential-trace" highlight="resting-membrane-potential" caption="Voltage inside the neuron. The whole event takes about 1–2 ms."}

::pathway{id="ap-phases"}

::focus{highlight="resting-membrane-potential,threshold"}

**At rest** the neuron sits around –65 to –70 mV, with its voltage-gated channels closed. Small inputs nudge the voltage up and down. If one pushes it to **threshold**, about –55 mV, the spike begins. If not, the cell drifts back to rest.

::focus{highlight="rising-phase,overshoot"}

**Rising phase:** voltage-gated Na⁺ channels open and Na⁺ rushes in, pushed by both its gradients. The inside depolarizes fast and **overshoots** above 0 mV.

::focus{highlight="falling-phase"}

**Falling phase:** near the peak, the Na⁺ channels inactivate, and slower voltage-gated K⁺ channels open. K⁺ rushes *out* {{C-015}}, and the inside becomes negative again (repolarization).

::focus{highlight="undershoot"}

**Undershoot:** the K⁺ channels are slow to close, so the voltage dips below rest (hyperpolarization). Leak channels and the Na⁺/K⁺ pump then bring the cell back to its resting state.

::check{q="q-ap-rising"}

## The sodium channel up close {#na-channel}

::diagram{id="membrane" highlight="voltage-gated-sodium-channel,voltage-gated-potassium-channel"}

The voltage-gated Na⁺ channel is the star. It's one long protein folded into four domains that form a pore {{C-016}}. Voltage sensors open it when the cell depolarizes. It has three states:

1. **Closed**, at rest, ready to open.
2. **Open**, letting Na⁺ through.
3. **Inactivated**: a "ball and chain" plugs the pore right after it opens. It can't reopen until the cell repolarizes.

That inactivation is what makes the refractory period, and it's what keeps the spike moving in one direction.

The channel is found across the animal kingdom, so many toxins target it. **Tetrodotoxin (TTX)**, from pufferfish, blocks it and paralyzes the nervous system {{F-17}}.

::check{q="q-ap-inactivation"}
