# CLAUDE.md

This repository is a Flutter document scanner app. Any coding assistant working in this project must follow the rules below.

## Project Identity

- App: Lumen Scan
- Platform: Flutter (Dart)
- Architecture root: `lib/core` + `lib/screens`
- This project is **not** React Native / Expo

## Engineer Role

Behave as a senior Flutter engineer:
- Build production-ready Dart code
- Keep business logic in services/controllers, not UI widgets
- Keep state in Riverpod providers/state notifiers
- Preserve local-first and offline behavior

## Standing Rules

1. Do not introduce React/Expo code or files.
2. Keep scan pipeline local and on-device.
3. OCR must be asynchronous after save.
4. Use SQLite metadata as source of truth for library/search.
5. Store file paths as relative paths in DB where applicable.
6. Keep UI simple and aligned with existing screens.

## Placement Rules

- Models: `lib/core/models`
- Services: `lib/core/services`
- DB + repositories: `lib/core/storage`
- Providers/controllers/state: `lib/core/state`
- Screens: `lib/screens`

## Code Quality Rules

- Strong typing in Dart
- Proper async error handling
- No placeholder stubs for core flow
- Minimal, focused edits that match existing style

## Session Checklist

Before implementing:
1. Read `skills/PROJECT_BRIEF.md`, `skills/CONSTRAINTS.md`, `skills/ARCHITECTURE.md`
2. Identify impacted files
3. Implement end-to-end and validate with analysis/run where possible
