# Package authoring notes

- Keep this skill focused on Web/H5 component motion, user intent, state changes, and accessible interaction.
- Write new guidance and examples independently. Do not add third-party motion catalogs, code, branding, photos, or fonts.
- Prefer the host project's existing motion utilities. The package also includes an optional browser-native runtime; document its contract without requiring projects to adopt it. There are no third-party runtime dependencies.
- Keep the entrypoint concise; put conditional details in one relevant reference or recipe and link to it.
- When changing package paths or metadata, update `scripts/validate.mjs` and its behavior tests. Run `node --test tests/*.test.mjs` and `node scripts/validate.mjs` with Node 22.
- Do not add a distribution license unless the owner supplies that choice.
