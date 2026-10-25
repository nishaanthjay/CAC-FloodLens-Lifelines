# Lifelines Design System

## Product surface

Lifelines is a Cape Fear civic technology experience for exploring how floods may interrupt road access to hospitals and fire stations. The interface must preserve uncertainty and must never use green or color alone to imply that a road is safe.

## Visual direction

Playful civic technology: a modern climate-tech mapping product with the clarity of a field instrument and the warmth of a public-facing science exhibit. Data is serious; interaction and small details bring personality. Target roughly 85% polished interface and 15% expressive accents.

## Palette

| Token | Hex | Use |
|---|---|---|
| Background | `#F9F9F7` | Main page surface |
| Ink | `#111111` | Primary text |
| Blue | `#2D5DA1` | Water, route, focus, primary action |
| Red | `#CC0000` | Disruption and risk emphasis |
| Yellow | `#FFF9C4` | Explanatory notes and small highlights |
| Soft blue | `#E8F0FA` | Map and supporting surfaces |
| Soft red | `#F7E1E1` | Risk context |
| Muted | `#5F6368` | Secondary text and small labels (at least 4.5:1 on the glass panels) |

Risk always includes a text label and context. Use patterns to reinforce higher risk; never encode meaning with color alone.

## Typography

- Display: Playfair Display 700/900 for expressive headlines.
- Body and interface: Public Sans 400/500/600 for all non-heading text (explanatory copy, navigation, labels, controls). Body is 15px/1.55; secondary text is 13-14px; nothing is smaller than 13px except the map attribution. Text wraps and panels scroll rather than text shrinking.
- Numbers and timestamps: Public Sans with `tabular-nums` (no monospace face).
- Small labels (section labels, table headers, chips, tab labels): sentence case, 13px, weight 500, normal tracking, `#5F6368`. Only the mode and state badges (REPLAY, NOWCAST, FORECAST, STALE) stay uppercase, weight 600, tracking at most 0.02em.

The serif gives the product personality; layout, controls, and map remain digital and functional.

## Shape and depth

- Use slightly rounded surfaces (12-24px) for map frames, inputs, and cohesive information panels.
- Use full pills only for compact metadata and filters.
- Keep some structure unboxed with spacing and dividers; do not repeat identical metric cards.
- Use restrained soft shadows only to distinguish floating controls and important panels.
- Use occasional purposeful stickers, pins, underlines, circles, and yellow notes. Do not make components wobbly or decorate every surface.

## Composition

- Responsive single-column-first layout, with asymmetric desktop splits where useful.
- Address lookup is the primary action in the hero.
- The map is the main visual and interactive surface, with compact floating controls and a legible risk key.
- Pair the map with one cohesive route-situation panel.
- Keep the crossing ranking and location watchlist scannable and truthful about illustrative or unavailable data.
- Keep Florence replay discoverable from navigation without implying the current sample map is a live historical simulation.

## Motion and accessibility

- Use quick, purposeful transitions for feedback and state changes.
- Respect `prefers-reduced-motion`.
- Preserve visible keyboard focus, readable contrast, semantic controls, and touch targets of at least 44px.
- Explain unavailable or illustrative data in text; never allow placeholder values to read as real forecasts.

## Map workspace (the home page)

The home page is a full-screen instrument, not a page: the map fills the viewport and glass panels float over it. The sketchbook stickers and yellow notes stay on /about only.

- Glass tokens: `--glass` rgba(255,255,255,.85), `--glass-border` rgba(17,17,17,.08), `--glass-shadow` 0 8px 32px rgba(17,17,17,.08), 24px backdrop blur. Panels use 16px padding, 12px section rhythm, and small-caps section labels (Inter 11px, .08em).
- Type in the workspace: Playfair for panel titles; Public Sans for the summary, controls and every number (tabular figures, right-aligned in tables).
- Risk tiers (sequential, cool to warm, never green): Not flagged `#CBD5E3`, Low `#7FA7D6`, Elevated `#E9B07C`, High `#D4694A`, Very high `#C0392B`. Each tier also has a text label, an arrow glyph and a stroke that thickens with the tier (1, 1.5, 2, 2.5, 3 px); charts add a hatch pattern. Bubbles are 35% fill with a darker stroke of the same hue and a 12% halo underneath.
- Routes: baseline is a white 6px casing under a 3.5px dashed ink line; the scenario route is a white 7px casing under a 4px blue line with a travelling dash (deep red when every route found crosses a closed crossing); detour segments are amber with a minutes chip; closed crossings are red rings with an x.
- Motion is subtle and optional: panels slide in 12px, tab changes crossfade, bubbles fade 300ms around a tab switch. `prefers-reduced-motion` turns off the intro camera move, the travelling dash, the pulses and the hover growth easing.
- Layout: left rail 56px; left panel 380px; right panel 360px (collapsible); time pill bottom centre; below 1024px both panels become one bottom sheet with peek, half and full snap points.
