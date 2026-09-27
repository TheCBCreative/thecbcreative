# Project notes for Claude

## Commit messages

Use this format for every commit:

```
feat/fix: short description of what changed
```

- Prefix with `feat:` for new functionality/content, `fix:` for corrections or bug fixes.
- Keep the whole subject line at 150 characters or under.
- No multi-paragraph commit bodies — short and to the point.

## Build rules

- Figma ("CB Tokens" variables and the Home — v4 frames) is the source of truth for design.
- Style with the Tailwind theme in `app/styles/tokens.css` — no raw colors, sizes or one-off overrides.
- Ask before making design or behavior decisions that Figma doesn't answer.
