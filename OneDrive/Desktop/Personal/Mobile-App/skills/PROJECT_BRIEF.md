# Project Brief — Lumen Scan (Flutter)

> Source-of-truth brief for this repository. This project is Flutter-only.

## What This App Is

Lumen Scan is a local-first mobile document scanner app. It captures paper documents using the device camera, applies enhancement filters, generates multi-page PDF output, runs on-device OCR, and stores all files locally.

## Current Stack (Implemented)

- Framework: Flutter 3.41+
- Language: Dart 3.11+
- State: `flutter_riverpod`
- Camera: `camera`
- OCR: `google_mlkit_text_recognition`
- Image processing: `image`
- PDF generation: `pdf`
- Storage path management: `path_provider`, `path`
- Metadata DB + search: `sqflite` (with FTS table)
- Sharing/export: `share_plus`

## MVP Scope

In scope:
- Camera capture screen
- Multi-page review flow
- Enhancement filters: auto, grayscale, black/white, original
- Save as PDF
- Async OCR after save
- Document library + search
- Document detail (rename, delete, share)
- Local-only storage

Out of scope:
- Cloud sync and user accounts
- E-signature and collaboration
- External OCR APIs

## Functional Pipeline

1. User captures page(s)
2. Image is processed with selected filter
3. Pages are saved to app storage
4. PDF is generated from ordered pages
5. Metadata is saved in SQLite
6. OCR runs asynchronously and updates search index
7. Document appears in library and is shareable

## Data and Privacy

- All processing is on-device
- No required network call for scan, save, OCR, search, or export
- Files are stored under app sandbox directories
- SQLite is the source of truth for library/search metadata

## Folder Reference (Current)

```text
lib/
  main.dart
  core/
    models/
    services/
    state/
    storage/
  screens/
```

## Definition of Done (MVP)

- Capture → review → save works reliably
- PDF generation works for multi-page documents
- OCR updates document records asynchronously
- Search finds results by filename and OCR text
- Rename/delete/share flows work from detail screen
- Works fully offline for core document flow
