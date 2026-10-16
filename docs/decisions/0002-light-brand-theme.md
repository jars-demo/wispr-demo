# 0002. Light brand theme by default, dark as an explicit opt-in

Date: 2026-10-16. Status: accepted.

## Context

The brand direction is white, black and orange with restrained Apple-like glass. The first build
followed the operating system colour scheme, so a machine in dark mode showed a black site that
did not match the brand.

## Decision

- Light tokens are the default on `:root`.
- The dark palette is defined and measured but applies only with `data-theme="dark"` on `<html>`.
  No toggle ships until it is needed.
- Orange (`#ff5a1f`) is used as a fill with black text (6.35:1), as an accent and as the focus
  ring. White on this orange is 3.12:1, which fails WCAG AA for normal text, so it is not used.
  Orange text uses `#c2410c` (5.18:1 on white).
- Glass (backdrop blur) is limited to floating chrome and falls back to solid surfaces when blur
  is unsupported or reduced transparency is requested.

## Consequences

Dark-mode users see the light brand. Adding a theme toggle later only needs to set the attribute.
