# Reorder and gestures

Choose this recipe when a user drags an item, reorders a list, or uses a direct touch gesture.

## State path

Separate the gesture's temporary position from the committed order. Identify activation, dragging, valid target, drop, and cancel outcomes using the host's existing model. Motion may preview the result; the existing reorder callback remains responsible for the new order. A canceled gesture must restore the prior arrangement.

## Kinetic choice

- Keep the dragged item attached to the input with minimal lag. Use a modest lift or shadow only when it improves the sense of grasp.
- Show a clear insertion position. On drop, settle the item and neighboring items into their new layout over roughly 150–260 ms; shorten or omit the settle when a list is long.
- Use a threshold and direction that fit the existing touch behavior. Avoid adding an edge gesture where it competes with browser navigation or page scrolling.
- A project-provided `animateLayout(container,mutate,opts)` may be used for layout continuity if its host contract is available; do not add or implement a replacement as part of this guidance.

## Input and reduced motion

Provide a keyboard-accessible alternative for reordering, such as existing move controls or a documented key interaction. Expose order changes in a way assistive technology can perceive. Reduced motion can remove lift and settling travel, but must preserve reorder controls, drop feedback, cancellation, and final order. H5 touch targets and scroll locking should follow the current product behavior.

## Example decision

For a short task list, keep the current drag source and order callback. While an item is held, show a restrained lift and insertion line; after a drop, animate the layout once. Releasing outside a valid target restores the original order and gives a non-moving cancel cue.
