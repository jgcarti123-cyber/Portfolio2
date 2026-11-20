---
title: Agents that sleep
summary: Human memory works by forgetting, dreaming and rewriting. Agent memory is starting to do the same, and that is both fascinating and a little unnerving.
date: 2026-11-12
tag: Agents
cover: /blog/neuron.jpg
coverPosition: center 55%
---

In 1953, a surgeon removed most of the hippocampus from a young man named Henry Molaison to stop his seizures. It worked, but it also left him unable to form new long-term memories. For the next fifty years he met his doctors as strangers, read the same magazines as if for the first time, and lived in a perpetual present.

Most AI agents live like this. Each session begins in amnesia. The lessons of yesterday, which command finally worked, which approach was a dead end, what the user actually meant, have to be rediscovered from scratch. We have built minds of startling fluency and given them no past.

That is beginning to change. What strikes me is that the most promising ideas for fixing it are not about remembering more. They are about remembering the way we do.

## Remembering is mostly forgetting

Borges wrote a story about Funes, a man who, after a fall from a horse, could forget nothing. Every leaf of every tree, every shape of every cloud, stayed with him in perfect detail. He was also incapable of thought. To think, Borges suggests, is to forget differences, to generalise and abstract.

Agents have their own Funes. In Anthropic's write-up on [the components of agent memory](https://www.anthropic.com/research/components-of-agent-memory), an older model playing Pokémon Red wrote 413 memory files and spent its time tidying them. A newer one wrote about ten and earned more badges. The better memory was the sparser one. It kept only what the screen would not show it again.

That is the first lesson from human memory: a note is a wager that something will matter later. Most experience should be allowed to fade. Ebbinghaus charted this in the 1880s with his forgetting curve, and the curve is not a defect. It is a filter.

## The night shift

The brain splits remembering into two jobs. The hippocampus captures experience quickly and messily during the day. Later, mostly during sleep, the day is replayed and the parts worth keeping are slowly woven into the neocortex as lasting knowledge. Chemical signals tag what felt important, so that it is replayed more often.

Agents are being given the same division of labour. Raw transcripts play the hippocampus: a complete, searchable record of everything that happened. Then, offline, a process Anthropic calls *dreaming* reads those transcripts with hindsight. It corrects mistaken notes, distils what was learned, and organises it into linked pages. Only a small index is loaded into every new session, the way a few things are always on the tip of your tongue while the rest waits to be recalled.

The [dreaming cookbook](https://platform.claude.com/cookbook/managed-agents-cma-dreaming-with-a-dynamic-workflow) makes this almost literal. A job runs at one in the morning. One small agent reads each of the day's sessions in full and checks every existing memory against what actually happened. Another merges the results into a single store. Stale facts are not deleted. They are dated and superseded, so the agent keeps the history of why it changed its mind. Conflicting accounts are marked as conflicts rather than resolved by guesswork.

It is, quite precisely, an agent that sleeps.

## Every recall is a rewrite

Neuroscience has a stranger finding still. When you recall a memory, it becomes briefly malleable again before being stored anew. This is reconsolidation, and it means remembering is never a pure read. Each retrieval is a quiet edit.

[Mnemos](https://github.com/Riley-Coyote/mnemos-mcp), an open-source memory server for agents, takes this idea seriously. Each memory carries three separate measures: how strong it is, how stable it is, and how easy it is to reach. Recalling a memory strengthens it, slows its decay, and links it to whatever else was recalled alongside it, so that one cue can later surface another without being named. Memories that are never reached for slowly fade into an archive.

My favourite detail is what happens at the very end. When a memory is nearly gone, the agent is asked what it taught. The answer is kept as a lesson, and the details are allowed to go. That is exactly how a person forgets the particulars of a hard project but keeps its wisdom.

## The next step

Put these ideas together and a clearer picture of the next generation of agent memory appears:

- **Salience, not volume.** Keep what was surprising, what was corrected, what cost something. Prediction error is the brain's own signal for what deserves to be learned.
- **Memories that know their age.** Every fact carries when it was learned and when it was last confirmed, and is checked against the source before it is trusted.
- **Consolidation as a habit.** Dreaming on a schedule, perhaps more often for memories that are used often, rather than writing notes in the middle of a task.
- **Lessons that outlive details.** Forgetting that distils rather than deletes.

Agents built this way would not just recall. They would accumulate judgement, the way a new colleague slowly becomes a seasoned one.

## Interesting, and a little frightening

Yet every property that makes human memory powerful also makes it fallible, and we are copying the fallibility along with the power.

A wrong memory is not merely useless. It is trusted. In one of Anthropic's experiments, a single mistaken note sent an agent back over the same ledge three times. Humans do this too. Elizabeth Loftus spent a career showing how easily false memories can be planted and how sincerely they are believed afterwards. An agent that reconsolidates on every recall can drift in exactly the same way, each edit plausible and the sum of them wrong.

Then there is the night shift itself. By default, the dreaming job runs unattended. Somewhere at one in the morning, a system is deciding what it will believe tomorrow, and nobody is watching. Its transcripts are untrusted input, so a single poisoned conversation could, in principle, become a permanent conviction.

And memory is not only about tasks. An agent that remembers will remember *you*: your habits, your mistakes, the things you said in passing. It will decide which of them matter. Mnemos even gives its agent a journal that nothing else writes. That is a lovely idea and a vertiginous one. A private interior is the beginning of a self.

The saving grace is that machine memory can be something ours never was: legible. Every memory can be dated, traced back to the moment it came from, read, and corrected. We cannot audit our own dreams. We can audit theirs.

Henry Molaison never got his past back. Our agents are about to get one. The work now is to make sure it is a past we can read.
