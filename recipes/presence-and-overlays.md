# Presence and overlays

Choose this recipe when a message, menu, dialog, sheet, or panel enters or leaves the interface.

## State path

Treat hidden and visible as the semantic endpoints. If the host already distinguishes opening, open, closing, and closed, preserve those states and make repeated open/close input deterministic. The element's presence and accessibility exposure must follow the host lifecycle; a fading but hidden-from-keyboard dialog should not remain interactive.

## Kinetic choice

- A small toast can appear with opacity and a few pixels of vertical movement over about 160–220 ms; make dismissal fast enough to keep later feedback readable.
- A menu or compact popover can grow from its anchor with a small opacity/scale change when that relationship is visible.
- A modal sheet or dialog may use one restrained travel direction over about 220–320 ms. Keep backdrop treatment subtle and coordinate its exit with the surface.
- Prefer a simple crossfade when direction is unclear or spatial movement would compete with the content.

## Input and reduced motion

Preserve the existing dismissal routes. For dialogs, check focus placement, containment, return focus, and Escape behavior. A menu must remain navigable by keyboard and must not rely on pointer hover alone. Prevent animation from moving focus. Under reduced motion, show or remove the surface without travel or scale; retain focus and dismissal behavior. On H5, avoid gestures that conflict with page scroll, and keep the close control reachable.

## Example decision

For a filter sheet, animate the panel from its existing edge while the backdrop fades. The filter values remain governed by the current form state; closing during the entrance still leaves the sheet closed and restores focus to the opener.
