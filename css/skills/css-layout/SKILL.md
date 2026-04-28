---
name: css-layout
description: Apply CSS layout fundamentals correctly when positioning, sizing, aligning, centering, stacking, or debugging any element. Use whenever writing or fixing CSS that involves display, position, margin, padding, width, height, z-index, flex, grid, sticky/absolute/fixed positioning, centering, overlapping elements, sticky behavior, stacking contexts, or unexpected layout/whitespace issues.
---

# CSS Layout

Authoritative decision rules for CSS layout. CSS has multiple layout algorithms (normal flow, positioning, flex, grid). Pick the right one and respect its rules. Elements are always "in flow" unless explicitly taken out via `position: absolute|fixed`.

## Decision tree: which tool for the job?

1. **One-dimensional row/column of items, distributing leftover space?** → Flexbox.
2. **Two-dimensional layout (rows AND columns) or named regions?** → Grid.
3. **Place ONE element relative to a parent or viewport, possibly overlapping?** → Positioning (`relative` parent + `absolute` child; or `fixed`/`sticky`).
4. **Just text/blocks flowing top-to-bottom?** → Normal flow (default). Don't reach for flex/grid for nothing.
5. **Center something?** → See [Centering](#centering).

## Mandatory baseline (always)

```css
*, *::before, *::after { box-sizing: border-box; }
```

Without `border-box`, `width: 200px` + padding + border > 200px. This rule is non-negotiable.

## Normal flow rules (always active)

- **Block elements** stack vertically, fill available inline width by default.
- **Inline elements** flow horizontally on lines, sit on the **baseline**, ignore `width`/`height` and vertical margins.
- **Inline-block** = inline outside, block inside (`display: inline flow-root`). Shrink-to-fit width.
- **Anonymous boxes** are auto-created around stray text and around whitespace between elements.
- **Whitespace gotcha**: spaces/newlines between `inline-block` siblings render as a real space character. If two 50% inline-blocks don't fit on one line, that's why. Fixes: use flex/grid instead, remove whitespace in HTML, `font-size: 0` on parent (and reset on children), or `white-space: nowrap`.
- **Inline images** sit on baseline → mysterious gap below `<img>`. Fix: `img { vertical-align: top; }` (or `bottom`/`middle`), or set `display: block`, or use flex/grid container.
- **Logical properties** are preferred for i18n: `inset-inline-start` over `left`, `block-size` over `height`, `margin-block-start` over `margin-top`. Use them when writing-mode/RTL matters.

## Box model

Every box: `content` → `padding` → `border` → `margin`. With `box-sizing: border-box`, `width` includes padding+border.

## Margins

- **Vertical margin collapse**: adjacent vertical margins between siblings (or between parent and first/last child) collapse to the larger value. Inline margins (left/right) never collapse.
- **Stop collapse** when needed by creating a new block formatting context on the parent. Preferred order:
  1. `display: flow-root` (cleanest, no side effects).
  2. `overflow: auto` or `hidden` (works, but introduces scroll/clipping behavior).
  3. Add `padding` or `border` to parent (works, but changes geometry).
- **Don't use negative margins** for overlapping layouts. Use positioning instead.
- **`margin: auto`** centers a block element horizontally only if it has a defined width less than the container. It does NOT center vertically in normal flow (use flex/grid/`place-content`).
- **Margins on inline elements**: only horizontal margins apply. Vertical margins are ignored.
- **Percentages on margin/padding** (all sides, including `margin-top`/`padding-bottom`) are relative to the **width** of the containing block, not the height. Avoid `padding-top: 50%` tricks now that `aspect-ratio` exists.

## Sizing & containing block

- `width`/`height` percentages → relative to the **containing block**.
- Containing block is normally the content-box of the nearest block-level ancestor.
- For `position: absolute`, containing block = padding-box of the nearest positioned ancestor.
- For `position: fixed`, containing block = viewport (unless an ancestor has `transform`, `filter`, `perspective`, `will-change`, or `contain` — those trap fixed elements).
- `height: 100%` on a child requires the parent to have an explicit height, or it resolves to `auto`.

## Positioning (`position` values)

| Value | In flow? | Inset (`top`/`left`/etc.) anchor | Use for |
|---|---|---|---|
| `static` (default) | yes | n/a | normal flow |
| `relative` | yes | offsets from its own normal-flow position; takes up its original space | **Mostly**: making the element an offset parent for absolute children. Avoid using it to nudge elements; it leaves a hole. |
| `absolute` | no | nearest positioned ancestor (offset parent) | overlays, badges, tooltips anchored to a parent |
| `fixed` | no | viewport | fixed headers, modals, FABs |
| `sticky` | yes | scroll container; sticks at inset value | sticky headers/sidebars within a scroll region |

### Rules of thumb for positioning

- **Always pair `position: absolute` with a positioned ancestor** (`position: relative` on the parent). Otherwise it anchors to `<body>` and goes wherever.
- **`z-index` only works on positioned elements** (and flex/grid children). Without `position` (or being a flex/grid item), `z-index` is ignored.
- **`position: sticky` will silently fail** if:
  - An ancestor has `overflow: hidden|auto|scroll` that's not the intended scroll container.
  - The element is `align-items: stretch` (default) inside a grid/flex container — it already fills the area so it never has room to stick. Set `align-self: start`.
  - No inset value (`top`/`bottom`/etc.) is set.
  - The sticky element's parent isn't taller than the sticky element.
- **Don't transform a parent and expect `position: fixed` children to anchor to viewport** — `transform` creates a containing block for fixed descendants.

### Centering an absolute element inside a relative parent

```css
.parent { position: relative; }
.child  { position: absolute; inset: 0; margin: auto; width: 200px; height: 100px; }
/* or */
.child  { position: absolute; top: 50%; left: 50%; translate: -50% -50%; }
```

## Stacking contexts (z-index)

- z-index values only compete **within the same stacking context**. A child with `z-index: 99` inside a parent with `z-index: 1` will lose to a sibling of the parent with `z-index: 2`. Mentally read as `(1, 99)` vs `(2)`.
- **A new stacking context is created by** (most common): `position: fixed|sticky`; `position: relative|absolute` + `z-index` other than `auto`; flex/grid item + `z-index`; `opacity < 1`; `transform`, `filter`, `backdrop-filter`, `perspective`, `clip-path`, `mask` other than `none`; `mix-blend-mode` other than `normal`; `isolation: isolate`; `will-change` of any of the above; `contain: layout|paint|strict|content`; `container-type: size|inline-size`.
- **To deliberately create a stacking context without other side effects, use `isolation: isolate`.** This is the right tool when you want `z-index: -1` on a child to go behind the parent's content but not behind the parent's background.
- **Default stacking root is `<html>`**, not `<body>`.

## Flexbox vs Grid

- **Flex = bottom-up, 1D.** You hand it items; it distributes them along one axis. Use for toolbars, nav bars, button rows, anything "lay these out in a line and space them".
- **Grid = top-down, 2D.** You define tracks/areas first, then place items into them. Use for page layouts, card grids, dashboards, anything with rows AND columns.
- Both **don't depend on font/baseline metrics** for alignment. `align-items: center` actually centers the box (unlike `vertical-align: middle`, which is font-metric weird).
- Both can wrap items but prefer Grid when 2D structure matters.
- A flex/grid item gains `z-index` participation without needing `position`.

### `*-items` vs `*-content`

- `align-items` / `justify-items`: position **each individual item** within its track/line.
- `align-content` / `justify-content`: position **the group as a whole** when there's leftover space in the container.
- `place-items` = `align-items` + `justify-items`. `place-content` = `align-content` + `justify-content`.

### Flex quick recipes

```css
/* Row, items spaced apart, vertically centered */
.bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }

/* Wrap into rows with consistent gap */
.tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }

/* Push one item to the end (e.g. logo left, actions right) */
.bar > .actions { margin-inline-start: auto; }

/* Equal-width columns */
.cols > * { flex: 1; }
```

### Grid quick recipes

```css
/* Responsive auto-filling grid */
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 1rem; }

/* Holy grail: header / (sidebar main aside) / footer */
.app {
  display: grid;
  grid-template:
    "header header header" auto
    "sidebar main aside"   1fr
    "footer footer footer" auto
    / 12rem 1fr 12rem;
  min-height: 100dvh;
}
.app > header  { grid-area: header; }
.app > .side   { grid-area: sidebar; }
.app > main    { grid-area: main; }
.app > .aside  { grid-area: aside; }
.app > footer  { grid-area: footer; }
```

## Centering

Modern, single recipe that works in block, flex, and grid containers (requires the container to have a defined size on the relevant axis):

```css
.center { display: grid; place-content: center; }     /* both axes */
.center { display: flex; align-items: center; justify-content: center; }
.block  { align-content: center; }                    /* block container w/ height */
```

For an absolutely positioned child:

```css
.parent { position: relative; }
.child  { position: absolute; inset: 0; margin: auto; }   /* needs width+height */
.child  { position: absolute; top: 50%; left: 50%; translate: -50% -50%; }
```

The historical "centering a div is hard" only applied because in normal flow, height comes from content. Once a container has a defined height, `place-content: center` is trivial.

## Debugging checklist (when layout misbehaves)

1. **Is `box-sizing: border-box` set globally?** If not, your widths are wrong.
2. **Does the element have the `display` you think?** Check for inherited or default values.
3. **For `position: absolute` not anchoring where you expect**: find the offset parent. In DevTools console: `$0.offsetParent`. If it's `<body>` and you wanted a closer ancestor, add `position: relative` to that ancestor.
4. **For `z-index` not working**: confirm the element is positioned (or a flex/grid item). Then check if a closer ancestor created a stacking context that traps it (look for `transform`, `opacity < 1`, `filter`, `isolation`, etc. up the tree).
5. **For `position: fixed` not anchoring to viewport**: check ancestors for `transform`, `filter`, `perspective`, `will-change`, `contain` — they create a containing block.
6. **For `position: sticky` not sticking**: verify (a) inset value set, (b) parent is the scrolling ancestor and is tall enough, (c) no `overflow: hidden` ancestor breaking it, (d) in grid/flex, set `align-self: start` so it isn't stretched.
7. **Unexpected gap below an `<img>`**: it's sitting on the baseline. `vertical-align: top` or wrap in a flex/grid box.
8. **Two 50% inline-block siblings don't fit on one line**: anonymous inline whitespace. Switch to flex/grid.
9. **Margin not pushing down child but pushing parent**: margin collapse. Add `display: flow-root` to parent.
10. **`height: 100%` doing nothing**: parent has no explicit height. Use `100dvh`/`100vh` at the top, or restructure with flex/grid `1fr`.

## Anti-patterns to avoid

- Negative margins to overlap elements → use positioning.
- `position: relative; top: ...` to nudge an element → leaves a hole; use margins or a different layout.
- `vertical-align: middle` on block content → it's a baseline+x-height formula, not the geometric middle. Use flex/grid.
- Floats and table layout for general layout (legacy hacks).
- Setting `z-index: 9999` to win a stacking battle → fix the actual stacking context.
- Reaching for flex/grid when normal flow already does the job (a single column of paragraphs).

## Progressive disclosure

For deeper detail (worked examples of margin auto cases, vertical-align values, the anonymous box mechanics, the full stacking-context creation list, sticky failure modes), read [reference.md](reference.md).
