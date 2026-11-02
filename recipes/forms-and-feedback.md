# Forms and feedback

Choose this recipe when a field responds to typing, validation, submission, or a correction.

## State path

Use the existing validation timing and states: untouched, editing, invalid, valid, pending, or submitted as applicable. Do not animate a field into an error before its current validation rules would expose it. A new keystroke or response must not let an older animation restore stale helper text.

## Kinetic choice

- When helper text appears or changes, a brief opacity reveal and a few pixels of movement can connect it to its field; allow the layout to settle without covering nearby controls.
- A border or icon can transition to show valid/invalid state. Keep explanatory text visible where the product requires it.
- For submission, follow the current pending and result states. Avoid repeated movement on each keystroke and avoid using a shake as the only correction cue.

## Input and reduced motion

Preserve labels, error associations, focus, input value, and form submission behavior. Keep error meaning available to assistive technology through existing semantics/live regions, not only color or animation. Under reduced motion, reveal the same message without travel and show borders or icons immediately. Ensure keyboard focus is not displaced when a message changes. On H5, verify the virtual keyboard and viewport do not hide the feedback.

## Example decision

For an email field, leave validation timing unchanged. When the existing validator marks the value invalid, fade in its associated explanation and switch the border color. If the value becomes valid on the next edit, replace the message from current state; do not let the previous reveal completion put the error back.
