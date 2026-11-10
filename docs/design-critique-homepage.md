# Design critique: MedullaHR home page

Method: dual-agent (A: design review, isolated · B: detector and browser evidence, isolated)
Target: `index.html`, rendered at http://127.0.0.1:8822/ at 390, 768, 1024, 1440
Date: 2026-11-10
Mode: Persuade (marketing surface, design is the product)
Code changed: none. This is an evaluation only.

Context note: the project has no PRODUCT.md or DESIGN.md, so the shipped HTML, CSS tokens and assets were treated as the incumbent design authority.

---

## Design health score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Header scroll state, `aria-current` nav and `aria-expanded` read-more are all wired correctly. The four hero `.mh-mini-chip` toggles report `aria-pressed` for state that does not exist. |
| 2 | Match system / real world | 4 | `Staff_Leave_Master_FINAL_v4.xlsx`, "Re: Fwd: Passport and Emirates ID scan", "Visa and Emirates ID dates" are exactly the buyer's vocabulary. Only nit: "Ask for a demo" instead of the category standard "Book a demo". |
| 3 | User control and freedom | 3 | Drawer closes on Escape, outside pointerdown and link click. The home logo is `href="#top"`, so clicking it silently rewrites the URL to `/#top`; on about.html the same element is `href="/"`. |
| 4 | Consistency and standards | 3 | Token discipline is real. Inline styles override the system at index.html:508-512 and twice in about.html. |
| 5 | Error prevention | 2 | Nothing on the home page can error, but it funnels to a form with a required mobile number beside 14 checkboxes and no guidance on how many to tick. |
| 6 | Recognition rather than recall | 3 | The Org Chart to Payroll flow strip is good recognition design. "Explore 13 modules" asks the visitor to hold an abstract number: only 6 of the 13 are named on this page. |
| 7 | Flexibility and efficiency of use | 2 | Scored, not n/a: on a Persuade surface the efficiency axis is the shortest path to conversion. `.mh-nav-actions .mh-btn-sm { display: none }` (styles.css:214-216) hides the header CTA on every phone and portrait tablet. |
| 8 | Aesthetic and minimalist design | 3 | Genuinely restrained and well spaced. Loses a point because 2,184 characters of total body copy starves the decision rather than clarifying it. |
| 9 | Error recovery | 2 | The JS-disabled case is handled correctly (`.mh-rv` has no base opacity rule). Every read-more and every hero chip silently does nothing without JS, with no fallback. |
| 10 | Help and documentation | 2 | Scored, not n/a: answering the buying question is this page's documentation duty. No pricing, no company-size fit, no migration story, no statement of what happens after the form. |
| **Total** | | **27/40** | **Acceptable: significant improvements needed** |

All ten heuristics were scored. Heuristics 7 and 10 were considered for `n/a` as the Persuade rule allows and deliberately kept, because both describe real gaps in this page's conversion job rather than inapplicable app behaviour.

---

## Design specificity verdict

### Design review (unanchored)

Partially authored, mostly interchangeable. There is one genuinely MedullaHR idea on the page and it is buried.

What is specific:

- The medulla metaphor (index.html:423-427), the quiet brainstem that keeps the heart beating. This is an ownable idea. It appears once, as 14.5px body text, in a grey card 3,112px down the mobile page, with no visual expression anywhere.
- The Gulf detail: "Visa and Emirates ID dates" (index.html:186), `Salary_Certificate_Ahmed_v2.docx` (index.html:300), the `+971` dial default and GCC-first country order on the form. These fake-artifact strings are the best writing on the site.

What is category-interchangeable:

- **Palette.** `--mh-green #2F6652` on `--mh-soft #F4F9F6` with an `#E4F1EA` accent (styles.css:1-11) is default calm-B2B sage. One hue, four tints of it, no second colour, no signal colour, no dark surface anywhere on the site. Nothing reads as Gulf.
- **Type pairing.** Poppins plus Plus Jakarta Sans is the most-used free SaaS pairing of the last five years, set at the generic `-0.035em` startup tracking.
- **Hero composition.** Centred pill, centred h1, centred lede, two centred buttons, full-bleed UI board in a gradient card. This is not a MedullaHR composition, it is the composition.
- **Section rhythm.** Every section uses the same `padding-top: clamp(76px, 10vw, 144px)`, every block is an 18-24px rounded rectangle, every background is white or `--mh-soft`. No banding, no inversion, no full-bleed moment, nothing that signals one section matters more than another.
- **The closing third.** Four consecutive blocks render as the same device: heading left, pill button right, in a rounded box.
- **Motion.** Fade-up on reveal plus a 60/120/180/240ms hero stagger. Default library behaviour.

The deeper problem: "calm" is a compositional claim. Calm means generous rests, one idea per screen, a single focal point. This page delivers calm as colour temperature while the hero crams roughly fifteen simultaneous elements into one viewport.

### Deterministic scan

`impeccable detect --json` on all four markup files: 22 findings, exit code 2 on each file that exists.

| Rule | Severity | Total | Per file |
|---|---|---|---|
| `cramped-padding` | warning | 9 | index 4, solution 1, about 3, staff 1 |
| `dark-glow` | warning | 5 | index 4, solution 1, about 1, staff 1 |
| `overused-font` | warning | 4 | one per page |
| `icon-tile-stack` | warning | 1 | about 1 |
| `low-contrast` | warning | 1 | staff 1 |

All 22 findings report `line: 0`; the detector resolves to CSS-derived element identity, not source offsets, so no line numbers are available from the CLI.

`modules.html` does not exist and could not be scanned: `/modules` is not a route, the nav points at `/solution#modules`.

**Where the two assessments agree:** `overused-font` is the detector arriving independently at the design review's "category-interchangeable type pairing" verdict. The live overlay quantified it at 61% of text on the home page, 53% on solution, 65% on about. One judgement, four reports, and a direction call rather than a defect.

**What the detector caught that the review did not:** `low-contrast` on staff.html, `#b6c9c2` on `#2f6652` at 3.85:1 against a 4.5:1 requirement. Independently verified. This is the only genuine contrast failure on the site and it is on a page outside the home-page brief, so it is listed under minor observations rather than priority issues.

**False positives:**

- `cramped-padding` x9. All nine are the "children flush against a visible boundary" shape, read off the wrapper's own padding. The flagged wrappers (`.mh-hero-stage`, `.mh-board-card`, `.mh-solution-card`, `.mh-closing-strip`, `.mh-strip`, `.mh-about-card`, `section.mh-contact`, `.mh-contact-card`, `.mh-staff-stage`) are composition wrappers whose children carry their own insets. Measured: no text within 8px of any boundary at any of four widths.
- `dark-glow` x5. The rule scopes the serious case to coloured blurred shadows on a dark background. This site has no dark background. The flagged shadows are tinted elevation shadows on light buttons.
- A measurement caution worth recording: the sticky header's background computes as `oklab(0.999994 ... / 0.88)`. Any contrast tool with an rgb-only parser reads the three oklab components as R/G/B and reports two phantom failures on header text at 1.12:1 and 1.78:1. Re-measured through canvas pixel normalisation, the real figures are 19.03:1 and 11.92:1. Both pass.

### Visual overlays

Script injection succeeded. The overlay ran in the page on `/`, `/solution` and `/about` and reported findings the CLI never did: `nested-cards` on `div.mh-flow-strip` (491x108 at y489) and `div.mh-board-card:nth-of-type(2)` (529x285 at y744) on the home page, and on `div.mh-proc-visual` on solution. The two engines do not report the same rule set on the same markup. The overlay server was stopped with `--keep-inject`, so no project file was written and no overlay is visible to you now.

Zero console errors from the site's own code on `/` and `/solution`.

---

## Measured evidence

Page scroll height: 5,057px at 390; 3,037px at 768; 3,040px at 1024; 3,230px at 1440. No horizontal overflow at any width, though `body` carries `overflow-x: clip`, so that result is partly enforced rather than purely structural.

Headings at 1440: H1 66px/1.06, H2 52px/1.08, three H3 at 20px, then four more H2 at 29, 27, 27, 27px. Heading level order has no skipped levels. The h1 to h2 ratio is only 1.27x, and three of the four lower H2s sit within 2px of each other, so the scale has levels without differences.

Section padding: all four `.mh-section` blocks are identical at `padding-top` 56px (390) and 100.8px (1440), with `padding-bottom: 0` throughout. The hero is the only deviation at 28px/68px. All vertical rhythm is carried by top padding alone.

Body measure at 1440 runs 47 to 68 characters per line; the widest block is the 692px problem lede at about 56 cpl.

Contrast: 14 distinct text-on-background pairs on the home page, zero failures. Tightest margin is `span.mh-status-pill` at 4.64:1 against a 4.5 threshold. `--mh-muted` on white is 5.39:1, on `--mh-soft` 5.06:1. If `--mh-tint` ever darkens, the pill is the first thing to break.

Focus rings: present on all 33 visible interactive elements, every one resolving to `outline: solid 2px rgb(47,102,82)` with a 3px offset from a single `:focus-visible` rule. Two rules suppress outlines on form fields, but those elements live on about.html, not here.

Tap targets: six footer links at 22.5px tall, four header nav links at 30.5px, four chips at 39.4px, two footer email links at 38.5px, three `.mh-btn-sm` at 40px. Primary buttons are a correct 48px.

Images: zero `<img>` and zero `<picture>` elements on the home page. All nine graphics are inline SVG.

Text below 14px: 38 elements. 16 at 12px, 13 at 12.5px, 6 at 13px, 3 at 13.5px. Smallest declared sizes on the page are 11.5px (`.mh-status-pill`, `.mh-module-toggle`).

Type inventory actually rendered: 3 families, 4 weights, 15 distinct sizes (12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17.5, 19, 20, 27, 29, 52, 66).

Reduced motion: under `prefers-reduced-motion: reduce`, `document.getAnimations()` returns 0. Nothing is animating. 25 elements still declare non-zero transition durations, but all are discrete hover and focus colour or elevation changes, none on transform or position. This is correct behaviour, not a violation.

---

## Overall impression

The craft of the execution is genuinely good. The token system is disciplined, spacing is consistent, nothing is broken at desktop, contrast passes, focus rings are universal, reduced motion is honoured in about fifteen separate rules. Someone has actually debugged this on a phone.

What is missing is not craft, it is evidence. Premium in HR software marketing is bought with faces, product screens, customer logos, headcounts and security marks, and this page has none of them. It currently reads as a well-built pre-launch teaser rather than as software companies already run payroll on. The single biggest opportunity is to stop describing the product and start showing it, starting in the hero.

---

## What is working

1. **The problem-card artifacts are the best persuasion on the site.** `Staff_Leave_Master_FINAL_v4.xlsx` with "Three versions saved across different folders" (index.html:239-241), and "Re: Fwd: Passport and Emirates ID scan" (index.html:359). They work because they are specific enough to be embarrassing: a UAE HR manager recognises their own desktop. This proves understanding without making a single claim, and it is the technique the rest of the page should borrow.

2. **The progressive-disclosure read-more is correctly built, not just present.** 44px minimum target, real `aria-expanded` and `aria-controls` wiring, an arrow rotation tied to state, panels deliberately reset closed on each visit (script.js:318). Three cards stay scannable and equal in height (357px each at 1440) while holding real detail.

3. **The token and responsive system is professional.** `--mh-max: 1140px` with `padding-inline: max(clamp(18px,5vw,72px), calc((100vw - var(--mh-max))/2))` handles gutter and centring in one rule. `minmax(0, 1fr)` on the problem grid with a comment explaining why, `overflow-wrap: anywhere` on the filename code, 16px minimum field sizing to stop iOS zoom.

---

## Priority issues

### [P1] The page has no proof and no product

**What.** Zero `<img>` elements across index.html, solution.html, about.html and staff.html. No customer logo, no testimonial, no headcount, no security mark, no screenshot of the actual software. The hero board (index.html:88-200) is a hand-built abstraction of a product the visitor never sees. A grep for iso, gdpr, soc, security and certif across index.html returns nothing but the fake filename.

**Why it matters.** This is HR software: it will hold passport scans, salaries and Emirates IDs. The visitor's first unspoken question is whether this is real and whether it is safe, and the page answers neither. Against Deel's "35,000+ companies", Gusto's "300,000+ businesses" and Personio's screenshot-led tour, the absence of any security or scale signal is disqualifying at the premium bar.

**Fix.** Replace the `.mh-hero-stage` board with one real product screenshot at 1140x640, device-framed, showing a populated employee list with Gulf names and a visa-expiry column: the single view that proves the regional claim. Insert a proof band directly under the hero and before `#problem`: five or six customer logos at 28px height, 48px gap, 70% opacity on `--mh-soft`, with one 13px `--mh-muted` line above. Add SOC 2, ISO 27001 and UAE data-residency marks as a fourth footer column. If the logos do not exist yet, run the band as three facts instead, for example "Built in Dubai. Data held in the UAE. Visa and WPS-aware payroll." Three facts beat zero.

**Suggested command:** `/impeccable bolder`

### [P1] The mobile demo path is broken by a hidden header CTA

**What.** `styles.css:214-216` sets `.mh-nav-actions .mh-btn-sm { display: none }`, re-shown only at `min-width: 860px`. Measured `display: none` at both 390 and 768. On mobile the only persistent conversion control is a 44x44px burger, top right, the hardest corner for a right-thumb grip.

**Why it matters.** The drawer's CTA is the fifth item down. The hero's own "Ask for a demo" scrolls out of view after about 540px of a 5,057px page, so for roughly 89% of the mobile scroll there is no visible demo CTA at all.

**Fix.** Show the header CTA at all widths: replace the `display: none` with `display: inline-flex` and give it a compact mobile form, `height: 40px; padding: 0 14px; font-size: 13px`, with the label shortened to "Demo" below 480px. The space exists: at 390 the logo occupies 211px of 351px, leaving about 96px beside the burger, enough for a 40x86px button at a 10px gap.

**Suggested command:** `/impeccable adapt`

### [P1] The page ends on its weakest block, and the primary CTA is the quietest of four identical devices

**What.** `.mh-closing-strip` (index.html:434, styles.css:2433-2447) is `--mh-soft`, 20px radius, h2 clamped to 27px, total height 118px at 1440. The three blocks above it are all larger and more saturated: `.mh-solution-card` at 201px with a gradient and `--mh-shadow-lg`, and two `.mh-strip` at 259px each. Four consecutive blocks, same device, and the conversion moment is the least prominent.

**Why it matters.** Peak-end. The last thing a visitor sees before the footer is a small grey box saying "Ready when you are", a phrase that puts the effort on them and promises nothing. They have been offered a demo three times by then and it has got quieter each time. There is also no peak anywhere earlier: the problem section builds real tension about spreadsheets and visa dates, then discharges it with one sentence in a gradient box that has about 240px of empty gradient between heading and button.

**Fix.** Make the closing block the page's visual peak and the site's first dark surface: `background: linear-gradient(155deg, var(--mh-green) 0%, var(--mh-green-dark) 100%)`, white type, `padding: clamp(56px, 7vw, 88px)`, h2 raised to `clamp(28px, 3.4vw, 40px)`, and the button switched to `.mh-btn-white`, which already exists at styles.css:380-394 and is unused on this page. Add one reassurance line at 15px in `rgba(255,255,255,0.78)`: "A 30-minute call. No obligation, and we will reply within one working day."

**Suggested command:** `/impeccable layout`

### [P2] Four hero buttons that do nothing, and 14 options at the conversion moment

**What.** Two problems on one axis. (a) `script.js:256-262`: each `.mh-mini-chip` click toggles only `data-active` and `aria-pressed` on itself. Four real `<button>` elements in a `role="group"` labelled "Sample module switches" that change no state and lead nowhere. A keyboard user tabs through four dead controls before reaching any real link. (b) about.html's `mh-tasks` fieldset holds 14 checkboxes directly above the submit button, beside a required mobile number, with no privacy line, no response-time promise and no statement of what happens next.

**Why it matters.** A mouse user who toggles a chip learns the hero is a diorama, which undermines every other claim on the page. And 14 options plus a required personal phone number plus zero reassurance is the highest-load, highest-anxiety point in the funnel, for a Gulf B2B buyer at the exact moment a premium site spends a sentence of reassurance.

**Fix.** (a) Either wire the chips to swap the right-hand card's three `.mh-board-item` rows to match the active modules, which would make the hero the product demo it is pretending to be, or demote them to `<div>` with `aria-hidden="true"` and remove the pointer cursor so they read as illustration. Do not ship a control that lies. (b) Cut the task list to the five modules that actually sell, with "Something else" opening the existing free-text field, and add a 13px `--mh-muted` line under the submit button: "We will call the number you give us once, to arrange the demo. Nothing else." with `/privacy` linked.

**Suggested command:** `/impeccable harden`

### [P2] `.mh-board-item` collapses at 390

**What.** `styles.css:794-803` makes `.mh-board-item` a `space-between` flex row with no mobile stacking rule, and `.mh-status-pill` carries `white-space: nowrap` (styles.css:819). Measured at 390: the three text columns render 105px, 124px and 91px wide and 81px, 81px and 121px tall. "Available in each staff member's portal" wraps to four lines beside a 144px pill that refuses to shrink.

**Why it matters.** This is in the hero, the first product-ish thing anyone sees, and on a phone it looks like a layout bug at the exact moment a visitor is deciding whether to keep scrolling.

**Fix.** Inside the existing `@media (max-width: 760px)` block at styles.css:1894: `.mh-board-item { flex-direction: column; align-items: flex-start; gap: 8px; }` and `.mh-status-pill { align-self: flex-start; }`. That turns a 121px four-line squeeze into a clean two-line stack and drops the hero stage from 1,062px to roughly 950px at 390.

**Suggested command:** `/impeccable adapt`

---

## Persona red flags

**Jordan, confused first-timer**

- After the hero, Jordan still does not know what the product is. `#solution` (index.html:398-408) contains one sentence and a link away. There is no "what it does" section.
- "Explore 13 modules" assumes Jordan knows what a module is in HR software. Eight are named in chips and flow nodes with no definition.
- Four "Ask for a demo" controls (index.html:40, 82, 436, 514). Jordan cannot tell whether they are four different things. All four resolve to `/about#contact`.
- Nav says "Modules" and "How it works" but both point at `/solution#...`. Jordan clicks Modules, lands on a page titled Solution, and the mental model breaks.

**Riley, deliberate stress tester**

- Clicks the four hero chips, watches the switches animate, finds nothing else changes, and now distrusts the rest of the page.
- Tabs through: skip link, logo, four nav links, header CTA, two hero CTAs, then four dead chip buttons, then three read-more buttons. Four of the first fifteen focusable items are decorative.
- Opens the drawer at 390 and checks focus trapping: script.js:60-82 handles Escape, outside pointerdown and link clicks, but focus is never moved into `.mh-drawer` on open nor returned to `.mh-burger` on close, and nothing traps Tab. Riley tabs straight out of an open drawer into the hero behind it.
- Footer "Staff Sign In" points at `https://app.medullahr.com` (index.html:503) with no `target`, no `rel`, and no indication it leaves the marketing site.
- Looks for pricing, a security page, a customer, a case study, an integrations list. None exists.
- Clicks the logo on the home page and the URL becomes `/#top`, while on about.html the same logo is `href="/"`.

**Casey, distracted, one-handed, on a phone**

- Scrolls 5,057px and passes a visible demo CTA only twice, at about 540px and about 3,870px. Roughly 3,300px of continuous scroll with no CTA on screen.
- Must get through a 1,447px hero, 1.7 viewports, before the first word of value. The stage alone is 1,062px of diagram.
- The `.mh-board-item` rows look broken at 390 (see P2 above).
- The burger is the only route to the demo on mobile and sits in the hardest thumb corner.
- The hero is blank for about 1.04 seconds on load: `.mh-in` delays reach 240ms on top of an 0.8s duration. First impression on a slow connection is an empty white screen with a logo.

---

## Minor observations

- **The hero canvas is nearly invisible but always running.** `#mh-hero-canvas` (script.js:113-253) paints a full 1382x1308 backing store, every pixel opaque, behind an already-opaque gradient at `z-index: -1`. It is visually indistinguishable from a static gradient at every width tested, and it binds a `pointermove` listener that restarts the rAF loop on every mouse move over a 1140x432 area. Either raise its contrast so it earns the loop, or delete it and keep the gradient.
- **Type hierarchy is compressed.** h1 66px to h2 52px is only 1.27x, and `.mh-strip`, `.mh-closing-strip` and `.mh-solution-card` h2s sit at 27, 27 and 29px. Fifteen distinct font sizes render on the page, but the four h2 levels have no meaningful differences between three of them.
- **Smallest type runs to 11.5px** (`.mh-status-pill`, `.mh-module-toggle`), with 38 elements below 14px. Contrast passes, but this is below the 12px floor the premium bar holds.
- **staff.html has the site's only genuine contrast failure:** `#b6c9c2` on `#2f6652` at 3.85:1, needing 4.5:1. Outside the home-page brief and outside the "do not edit staff.html" constraint, so flagged here rather than fixed.
- **Inline styles leak past the token system** at index.html:508-512 (a footer link re-declaring font-size, weight and colour that `.mh-foot-col a` already sets) and twice in about.html.
- **The 3-column problem grid breaks at 760px, about 140px too early.** At 768 the cards measure 225px wide with 174px of content, forcing two of the three headings to three lines at 20px. Raising styles.css:835 from `min-width: 760px` to `min-width: 900px` lets tablets run 1-up or 2-up.
- **The nav breakpoint is also too high.** `min-width: 860px` (styles.css:318) gives an iPad in portrait a burger despite room for four links plus the CTA. 720px would be correct.
- **`.mh-problem-artifact` is `aria-hidden="true"`** (index.html:239), so screen-reader users get the heading and a Read more button without the concrete detail that makes the card persuasive. Those strings are content, not decoration.
- **`--mh-btn-white` is defined (styles.css:380-394) and never used on the home page.** The system already holds the piece the closing CTA needs.
- **Three nested-card instances** flagged by the live overlay only: `.mh-flow-strip` and `.mh-board-card:nth-of-type(2)` on the home page, `.mh-proc-visual` on solution. Worth a look next time the card system is touched.

---

## Questions to consider

1. If the medulla is the whole idea, the quiet thing that keeps you alive without you thinking about it, why is it a paragraph in a grey box 3,100px down instead of the page's organising principle? What would the hero look like if "you never have to think about it" were expressed compositionally: one line, enormous white space, a single pulse of motion, and nothing else above the fold?
2. Why is there no picture of the product on a page selling software? Is the product not photogenic yet, or has nobody decided which single screen proves the claim? If it is the former, that is the real brief.
3. What does the visitor give up by requesting a demo, and why does the page never acknowledge it? A required mobile number, a `+971` default, 14 checkboxes, and not one sentence about what happens to any of it.
4. Who is this for, the 12-person trading company or the 180-person contractor? The form offers six size bands and the page addresses none of them. "Growing companies" is a category, not a reader.
5. The chips toggle and nothing happens. What if they did? Wiring them to rewrite the three rows in the board card would turn the hero from a mockup into the demo, for roughly twenty lines of JS and no new assets.
