# Process overview

## What I built

This website explores an old Chinese story, *Two Children Debating the Sun*, which asks whether the Sun is closer to us in the morning or at noon. The two children both base their arguments on reasonable observations, but neither can reach the correct conclusion through visual experience alone. The website guides users from the original story into three increasingly detailed levels of explanation, using interactive examples to reveal why intuition can be misleading and how science can answer the question. Its main idea is not only to settle a seemingly impractical debate, but also to celebrate the children’s willingness to notice, question, discuss, and investigate the world around them.

## The moments that mattered

### 1. Making equality visible

The first “Show that both centres are equal” reveal only outlined the two centre discs. It stated the answer but did not make the comparison easier, because users still had to judge two separate circles inside different surroundings. Instead of making the outlines stronger or adding more explanation, I used two dashed guide lines spanning both clusters and touching the top and bottom of each centre disc. The shared lines make the equal diameters directly visible. I positioned them with `--disc-radius`, calculated from the disc radius and the cluster scale, so the lines remain tangent when the figure is resized. I checked both toggle states and confirmed that the lines stayed aligned with both discs.

Cited: [`6e9c936`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-xiaoma638/commit/6e9c936)

### 2. Turning the scientific claim into a test

The starter shipped `spec/starter.test.ts`, and once its placeholder page became this one those tests still passed while asserting nothing about what was actually on screen — green checks that measured nothing. The obvious replacement is to assert that the new page's elements exist, and I did that. But the tests that carry weight assert the argument instead: that the rotation and orbit contributions come out with opposite signs and sum to the total the verdict panel reports. The tug-of-war the whole page is about now fails loudly if a refactor breaks either side of it. I pinned the model to published figures — 147.1 and 152.1 million km at perihelion and aphelion — so the expectations come from outside the code rather than from the code itself.

Cited: [`f4ae7dd`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-xiaoma638/commit/f4ae7dd)

### 3. Fixing the illusion's geometry on phones

On phones, the Ebbinghaus experiment looked wrong: a 132px width override moved the cluster's centre from 73px to 66px while its dots kept their pixel positions. The ring radius collapsed from 32px to 22.6–25px, pushing dots about 4px into the centre disc. Instead of nudging the dots until they looked right, I removed the width override and let the existing `scale()` resize the complete geometry. The mirrored `--disc-scale` kept the guide lines tangent. The restored 146px geometry preserved the intended 32px radius and 5.5px gap, and I left a comment at the breakpoint to prevent the same regression.

Cited: [`ae71165`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-xiaoma638/commit/ae71165)

## A note on this history

The commits here were made on 16 August; the work itself ran across the week but wasn't committed as it went. The moments above cite what's actually in the record.

