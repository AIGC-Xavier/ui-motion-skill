# Press and status

Choose this recipe when a control needs an immediate response or a task moves through pending, complete, or failed states.

## State path

Use the component's existing semantic states. A typical path is ready → pressed → pending → complete or failed, with return to ready where the current product permits retry. Press is brief visual feedback; it is not a new business state. Keep pending and result states driven by the same action and callback as before.

## Kinetic choice

- For a pointer or touch press, try a subtle color, opacity, or scale response that begins promptly and settles in about 90–160 ms. Do not shrink text or move the hit target.
- On release, return smoothly to rest. If an operation continues, transition to a stable pending indicator; avoid making the control pulse indefinitely unless that convention already exists.
- On completion, prefer a clear label or icon state change with a short 120–220 ms reveal. Failure should be legible and actionable; a shake is optional and should never carry the error meaning alone.

## Input and reduced motion

Native buttons already provide keyboard activation; preserve their semantics and focus ring. If a custom control is involved, retain Space/Enter behavior and pressed-state semantics. H5 touch feedback must not intercept scrolling or cause a tap to fire twice. With reduced motion, remove scale and shake; show the same pending/result state immediately or with a brief non-moving color/opacity cue.

## Example decision

For a save control, keep the existing save callback and pending state. A quick press tint acknowledges the tap; the label may then change to “Saved” after success. If the audit finds that success text is already clear, the extra checkmark flourish can be omitted.
