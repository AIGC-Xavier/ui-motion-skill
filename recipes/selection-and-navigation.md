# Selection and navigation

Choose this recipe when the user selects an option, changes a tab, or moves to a related view.

## State path

Read the current selected item and navigation model first. A selected tab, a loading route, and a completed route change are distinct states. Keep selection, URL/history, and data loading authoritative in the existing system; let motion show continuity after the state changes.

## Kinetic choice

- For local selection, move or resize one indicator to the new item over roughly 160–240 ms. A color change alone may be enough for a compact control.
- For related panels, a short crossfade or slight directional shift can show the relationship. Avoid implying a hierarchy or direction the navigation model does not have.
- For route changes, use the project's current transition convention. If there is none, a quick content reveal is often clearer than a full-page slide.
- Keep repeated taps responsive. Do not animate every intermediate selection when the final choice has already changed.

## Input and reduced motion

Use real buttons or tabs with their established arrow-key and focus behavior. Preserve browser history and back navigation. Do not make hover the only indication. With reduced motion, update the selected styling and content in place without directional travel. The selected state and page must remain understandable without animation or color alone.

## Example decision

For a three-option view switcher, keep the current selected-value model. Move a thin indicator beneath the chosen label and update the panel content; if the content arrives asynchronously, let the existing loading state handle that gap rather than sliding an empty panel.
