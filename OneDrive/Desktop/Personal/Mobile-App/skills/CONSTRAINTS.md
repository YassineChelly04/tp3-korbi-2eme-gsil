# Constraints & Rules — Lumen Scan (Flutter)

> Non-negotiable engineering rules for this repository.

## 1) Platform and Stack Rules

1. This codebase is Flutter/Dart only.
2. Do not introduce React Native, Expo, or TypeScript files.
3. Keep state management in Riverpod providers/controllers.

## 2) Pipeline Rules

1. Save flow order must remain:
   - capture/collect pages
   - process page images
   - generate PDF
   - persist metadata
   - run OCR asynchronously
2. OCR must not block capture/review/save UX.
3. Multi-page scans must export as a single PDF.

## 3) Storage Rules

1. Document files are stored in app-local directories managed by `FileService`.
2. SQLite is the source of truth for library and search metadata.
3. File deletion and metadata deletion must happen together in document delete flow.
4. Keep DB schema changes synchronized with model and repository updates.

## 4) Search Rules

1. Search must use SQLite FTS-backed queries.
2. Do not implement in-memory filtering for full library search.
3. Debounce text input in state/controller logic.

## 5) Code Quality Rules

1. Strongly typed Dart code.
2. No placeholder methods for core features.
3. Every async operation must handle errors.
4. Keep UI widgets lean; business logic belongs in services/controllers.

## 6) Performance and UX Rules

1. Avoid blocking operations on main isolate during user actions.
2. Show visible progress for save/generate operations.
3. Keep the scan flow minimal: capture → review → save.

## 7) Privacy Rules

1. Core scanning, OCR, and search must work offline.
2. No external OCR API calls for MVP.
3. Sharing is user-triggered only.
