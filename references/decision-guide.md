# Decision guide

Use this guide to route by what the user wants the motion to communicate. Choose the smallest set of relevant recipes; combine them only when a single component genuinely crosses intents.

## Route the request

| User intent or UI change | Recipe |
| --- | --- |
| A control needs a press response or moves through pending/success/error | [Press and status](../recipes/press-and-status.md) |
| A message, menu, sheet, dialog, or panel enters or leaves | [Presence and overlays](../recipes/presence-and-overlays.md) |
| A choice becomes active or the interface moves to a related view | [Selection and navigation](../recipes/selection-and-navigation.md) |
| A user directly moves or reorders an item | [Reorder and gestures](../recipes/reorder-and-gestures.md) |
| A field responds to input, validation, or submission | [Forms and feedback](../recipes/forms-and-feedback.md) |
| A value, label, or block of content changes while its identity continues | [Data and content](../recipes/data-and-content.md) |

If the request is an audit, state what is observable and what is inferred; do not edit. If it asks for implementation, stay with the named component and existing stack. A request for direction or options calls for a comparison and a recommendation, not an assumed rewrite.

## Map the state before the motion

For the selected component, note:

1. **Trigger:** the user or system event that starts a change.
2. **Semantic states:** existing states that matter, such as idle, pending, selected, open, invalid, or complete. Reuse the host model; do not add duplicate state solely to animate.
3. **Visible result:** what changes on screen and which element owns that change.
4. **Exit and interruption:** how the state reverses, is replaced, or is interrupted by a repeated input, route change, or newer result.
5. **Input parity:** whether pointer, touch, keyboard, and assistive technology can reach the same outcome.

Keep state updates authoritative. An animation can finish late, be canceled, or be disabled by a preference; none of these should alter the final application state or callback behavior. For H5, check touch targets, scroll ownership, and accidental gesture conflicts within the existing component.

## Choose kinetic character

Use timing as a starting range, then inspect it in context. These are optional baselines, not required effects:

- **Immediate acknowledgement:** roughly 90–160 ms for a press or small indicator; use a small opacity, color, or scale response rather than a travel effect.
- **Related state change:** roughly 160–260 ms for a local selection, field message, or compact content replacement; a few pixels of translation can help show continuity.
- **Large surface entering or leaving:** roughly 200–320 ms when the surface needs spatial context; use one clear direction and a restrained easing curve.
- **Direct manipulation:** track the pointer or touch input while held; settle into the new position after release. Avoid an artificial delay between the gesture and the element.

Choose opacity, transform, color, or layout change according to the meaning. Avoid animating several properties when one explains the transition. Prefer an unanimated result when the transition is repetitive, time-critical, decorative, or would compete with reading.

## Keep alternate inputs complete

Honor `prefers-reduced-motion`: remove nonessential travel, scaling, and stagger; preserve the state change with an immediate update or restrained non-moving cue. A reduced-motion setting must not remove functionality. Provide keyboard equivalents for gesture-only actions, visible focus, predictable focus placement for overlays, and Escape or an existing dismissal path where appropriate. Keep status meaning in text or semantics as well as color/motion.
