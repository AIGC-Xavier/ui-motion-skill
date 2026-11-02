# Data and content

Choose this recipe when a value, label, status, or content block changes while users can understand it as the same thing continuing over time.

## State path

Confirm whether identity persists across updates. A count that updates after an action may be continuous; a result list replaced by a new query may be a new dataset. Keep the data source authoritative. When updates arrive rapidly, prefer the latest value and cancel or supersede stale visual work.

## Kinetic choice

- For a changing total or count, a short numeric interpolation can preserve continuity. Use it only when the difference matters and the number is not a time-critical instruction.
- For a label replacement, a brief crossfade or small vertical shift can aid tracking. Keep the text readable and avoid stacking multiple copies during a long transition.
- For a content block, use a stable layout or restrained crossfade when items are replaced. Avoid animating every cell in a dense table or dashboard.
- If the host provides `animateValue(from,to,opts) => {cancel,finished}` or `shiftLabel(label,text,opts)`, use only after confirming their actual options and cancellation behavior. Do not implement these contracts here.

## Input and reduced motion

Keep the final value accurate if motion is skipped, interrupted, or reduced. Do not misrepresent financial, medical, progress, or time-sensitive values through a slow count-up. Avoid announcing every animation frame to assistive technology; expose meaningful final updates using the host's existing semantics. With reduced motion, show final text/value directly or use a short non-moving emphasis.

## Example decision

For a cart item count, a brief number transition may clarify that the latest action changed the same count. If several updates arrive before it finishes, cancel or replace the older presentation so the visible result lands on the actual current count. A static final value is preferable when the count is too small or updates too frequently to track.
