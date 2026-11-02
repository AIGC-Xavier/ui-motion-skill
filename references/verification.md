# Verification guide

Use this after a read-only audit or scoped implementation. Keep observations, inferred causes, and suggestions distinct.

## Read-only audit

- Record the component, state, trigger, and input used to observe the motion.
- Check whether timing and direction explain the state change, or instead delay, obscure, or distract from it.
- Check repeated input, reversal, interruption, and content arrival while a transition is active.
- Verify focus, keyboard access, touch behavior, semantics, and the reduced-motion result.
- Report evidence and impact before recommendations. Do not imply prototype, browser, or assistive-technology checks that were not run.

## Implementation check

- Confirm the intended semantic state and callback still come from the existing application logic.
- Check the normal path, reverse path, rapid repeat, cancellation, and stale completion. The final state must remain correct if motion is skipped.
- Inspect the actual Web/H5 component at its supported sizes. Check clipping, stacking, layout shift, text readability, and touch/scroll conflicts.
- Use keyboard and pointer/touch input to reach equivalent outcomes. Confirm visible focus and sensible focus movement for overlays.
- Test with reduced motion enabled. Remove nonessential movement while preserving status, content, and operation.
- Report the files and states changed and the validation actually performed. Separate static inspection from browser, runtime, and user acceptance.

## Bundled runtime contract

Prefer the target project's existing motion utilities and conventions. The repository also contains an optional implementation at [runtime/motion.mjs](../runtime/motion.mjs); it uses DOM elements, Web Animations API where available, and platform reduced-motion preference. It has no third-party runtime dependencies. Adopt it only when the host has no suitable equivalent and its browser support and lifecycle fit the component. Do not assume these helpers are installed in the target project.

The helpers animate CSS `transform` and/or `opacity` directly. Those keyframes temporarily replace the element's existing values; they do not promise additive compositing with an underlying transform, opacity, or motion system. Use dedicated motion wrappers whose base styles do not depend on those properties, or retain the host project's existing tool. Do not apply the helpers indiscriminately to arbitrary elements.

All durations are milliseconds. Each helper accepts an optional `reducedMotion` boolean; when omitted, it follows `prefers-reduced-motion: reduce`. Duration values default when absent or invalid and are clamped to zero or greater.

- **`shiftLabel(label,text,opts={})`** — default duration `180`. Requires a leaf element. Accepts `duration` and `reducedMotion`; returns a Promise resolving to `{status:'finished'}` or `{status:'cancelled'}`. A newer call on the same label cancels the earlier transition; the function does not return a public cancel handle. If motion is reduced, duration is zero, or Web Animations are unavailable, it updates the text immediately.
- **`animateValue(from,to,opts={})`** — default duration `320`. Accepts finite numeric endpoints plus `duration`, `onUpdate(value)`, `easing(progress)`, and `reducedMotion`; default easing is cubic-out. Returns `{cancel,finished}`. `finished` resolves to `{status:'finished',value:to}` or `{status:'cancelled',value:lastValue}`. Reduced motion, zero duration, or equal endpoints update directly to `to` and resolve as finished. Invalid endpoints throw; an exception from `onUpdate` rejects `finished`.
- **`setPresence(el,visible,opts={})`** — default duration `180`. Accepts `duration`, `reducedMotion`, and `onAfterExit()`. Returns a Promise resolving to `{status:'finished'}` or `{status:'cancelled'}`. Showing unhides the element before entry; a completed exit hides it and then calls `onAfterExit`. Cancellation resolves as cancelled and does not call the exit callback. A newer call on the same element cancels the previous transition.
- **`animateLayout(container,mutate,opts={})`** — default duration `220`. Accepts an async or sync `mutate` callback, `duration`, and `reducedMotion`; resolves to `{status:'finished'}` after the mutation and waiting for retained-node transitions, including a transition that is canceled. It has no public cancel handle. Only direct child elements retained across the mutation can move; removed nodes do not get exit animations. A second overlapping run on the same container is rejected, so callers should serialize runs or disable repeat input while one is active. Reduced motion skips travel but still applies the mutation.

Use the returned status or final value as appropriate; do not let an animation completion decide business state. A missing Web Animations implementation falls back to immediate visual updates where the helper supports them. These descriptions match the bundled implementation and should be updated if that contract changes.
