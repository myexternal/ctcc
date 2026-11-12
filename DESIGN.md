# Ceylon Tampere CC: design system

This system belongs to Ceylon Tampere Cricket Club only. It shares no skeleton, fonts or palette with Hewad Market (Apple-style scroll film), Flavours of Asia (packed-box objects, condensed sign type) or Nupelda (Unbounded, pizza wheel).

## Idea
**The honours board.** Cricket pavilions keep wooden boards with gold-leaf names of every champion. CTCC's board has one season on it so far, and space waiting for the next. The club crest's gold lion is the one 3D object: it's a real mesh made from the crest, and you can drag it around.

## Type
One variable family, **Mona Sans** (width 75 to 125, weight 200 to 900). Hierarchy comes from pairing extremes inside one heading: a **900-weight, wide** word with a **200-weight** phrase after it.

| Role | Settings |
|---|---|
| Display bold | 900, width 112 to 125, tracking -0.035em, leading 0.86 |
| Display light | 200, width 100, the second half of every heading |
| Section title | 800 + 200 pair, clamp(2.4rem, 6vw, 5.6rem) |
| Body | 400, width 100, 17px / 1.55 |
| Labels | 650, width 115, uppercase, +0.08em, 12.5px. Used only for data labels, never as decoration above every heading |
| Numbers | tabular-nums, 900 for scores, 300 for overs |

## Colour
| Token | Hex | Use |
|---|---|---|
| night | #070F2A | Hero, honours, club, footer |
| navy | #0C255E | Taken from the crest. Formats section and the rail |
| gold | #F2C230 | The kit yellow: actions, the lion, winning scores |
| gold-ink | #8A6400 | Gold text on the light "whites" sections |
| whites | #F4F2EC | Cricket whites: road, leaders and squad sections |
| ink | #0A1430 | Text on whites |
| line | rgba(10,20,48,.14) | Ledger rules |

Sections switch hard between night, whites, navy and one gold band (Join). No gradients on surfaces, and no glass cards.

## Layout grammar
- On desktop the nav is a fixed **left rail** with the crest, vertical section names and a sliding gold marker. On phones it's a top bar plus a bottom sheet you can drag closed.
- Every section uses a different layout: a split hero with the 3D lion; a full-bleed photo that opens as you scroll; a results **ledger**; the **honours board** next to a tall trophy photo; asymmetric **big numerals**; a list of **club page links** whose names gain weight on hover; a values column; a gold join band.
- Spacing between sections: clamp(96px, 13vw, 190px). Related items sit in tight groups with 8 to 16px gaps.

## Motion (emil-design-eng + apple-design)
- Easing: `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-io: cubic-bezier(.77,0,.175,1)`.
- Reveals: 14px rise + fade, 700ms ease-out, 60ms stagger, once only.
- Lion: drag with 1:1 tracking, velocity hand-off on release, exponential momentum decay, rubber-band tilt, critically damped return. Idle auto-turn stops off-screen, with reduced motion, and while the tab is hidden.
- Buttons: scale(.97) on :active in 120ms. Hover styles only under `(hover: hover) and (pointer: fine)`.
- Reduced motion: no movement, just fades.

## Added 2026-11-12: club, squad, kit order and membership pages
- Sub-pages share one top bar: crest + CTCC, page links (a scrolling pill row on phones), gold Join button. No rail.
- Page hero: gold label, bold/light two-line headline, short lede. Same pairing as the home page.
- Club: vision as one big statement; mission beside a numbered list of four pledges; chairperson's message on navy with a sticky signature column; committee as a 3-column board with monogram initials (no photos yet).
- Squad: captain and vice-captain as outlined gold "C" and "VC" letters; the squad as an A-to-Z list, first name bold, the rest light.
- Forms: white fields with a gold focus ring, 52px tall, 17px text (no iOS zoom). The kit page has a 1-99 number board and a navy "back of your shirt" card that shows the name and number live. Membership tiers are radio cards that turn ink when chosen.
