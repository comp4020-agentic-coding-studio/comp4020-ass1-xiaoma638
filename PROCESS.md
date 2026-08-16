# Process overview

<!-- TODO(you): 400–600 words, three or four moments. Delete every TODO comment
     and every bracketed prompt before you ship — what's left should read as
     your own prose, with no scaffolding showing.

     Read this before writing: the marks are in two of the four jobs a moment
     does — "what you did instead of the obvious thing" and "how you knew it
     was right". The repo can show what changed; it cannot show either of
     those, which is why they're where the marginal marks sit. And the brief
     says the strongest moments are the ones where a correction landed in the
     harness (a rule added to CLAUDE.md, a check wired up, an attempt thrown
     away) rather than in a retry. -->

## What I built

<!-- TODO(you): One paragraph — the thing, and the idea behind it. The raw
     material is here; write it in your own voice rather than editing this in
     place:

     An answer to the Liezi story 《两小儿辩日》, where two children argue
     whether the sun is closer at sunrise or at noon and Confucius can't
     settle it. The page settles it, but only after making the reader distrust
     their own eyes: an Ebbinghaus figure with a reveal, then two clips of the
     same sun, then two instruments they drag — the rotation one, where
     turning toward local noon gains ground on the sun, and the orbit one,
     where eccentricity pulls the other way — and finally a verdict panel that
     takes their date, latitude and morning hour and separates the two
     contributions instead of reporting one net number.

     Say what the *point of view* is. The brief wants one strong idea and
     nothing else; name yours in a sentence. -->

## The moments that mattered

<!-- TODO(you): Three or four. Each needs all four jobs: what happened, what
     you did instead of the obvious thing, how you knew it was right, and the
     citation. Citation format is link text = the hash or range, target = the
     GitHub commit or compare URL — the two below are wired up and resolve, so
     copy their shape.

     A candidate worth considering, if it's true for you: the geometry in
     `updateRotationVisual` derives the rays, the terminator, the observer's
     meridian and Δx from one angle rather than positioning each by eye. The
     obvious thing is to nudge each element until the frame looks right; the
     non-obvious thing is to make them share a source so they *can't*
     disagree. If that's what happened, the "how you knew" is the spec test
     asserting the two contributions sum to the reported total, plus what you
     saw at 390×844.

     Another, if it's true: the label collision at the phone viewport that the
     comments in `updateRotationVisual` describe — labels pinned to the far end
     of a stub landing on top of the observer near dawn. Fixing that in pixels
     rather than percentages is a judgement about *why* it broke, and the check
     is the 390×844 viewport itself.

     Be honest in these. A moment the history doesn't corroborate scores worse
     than a smaller moment it does. -->

### 1. <!-- TODO(you): name the moment -->

<!-- TODO(you): what happened / what you did instead / how you knew / cite it -->

Cited: [`6e9c936`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-xiaoma638/commit/6e9c936)

### 2. <!-- TODO(you): name the moment -->

<!-- TODO(you): what happened / what you did instead / how you knew / cite it -->

Cited: [`f4ae7dd`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-xiaoma638/commit/f4ae7dd)

### 3. <!-- TODO(you): name the moment -->

<!-- TODO(you): what happened / what you did instead / how you knew / cite it -->

## A note on this history

<!-- TODO(you): READ THIS, THEN DECIDE WHAT TO DO WITH IT.

     Your prototype was written across the week but committed in four commits
     on 16 August, the day before the deadline. Your CLAUDE.md tells you to
     "commit meaningful stages, not one final dump", and the assessment page
     says a trail that grew alongside the code is the strongest evidence and a
     dump the night before is the weakest. That gap is real and a marker will
     see it in the timestamps.

     Two honest options, and only these two:

     1. Say so, in one sentence, without excuses — and let the moments above
        carry the evidence instead. A short, accurate acknowledgement costs
        less than a marker discovering it themselves.
     2. Delete this section and say nothing. The timestamps still show it.

     What you must NOT do is write moments that imply an incremental history
     that isn't there. Uncited claims don't count; contradicted ones are worse
     — the bottom band is "a record that contradicts" the account.

     Nothing can retroactively create the trail. What you can still control is
     whether the account of it is truthful. -->

---

<!-- Harness carried forward from week 3: 45f22f2 -->
<!-- https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-xiaoma638/commit/45f22f2 -->
