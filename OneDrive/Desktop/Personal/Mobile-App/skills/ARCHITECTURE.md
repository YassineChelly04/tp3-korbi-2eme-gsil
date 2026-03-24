# Architecture — Lumen Scan (Flutter)

> Living architecture document for the current Flutter codebase.

## Overview

Lumen Scan is a local-first document scanner implemented in Flutter. The user captures pages, applies filters, generates PDFs, and receives OCR text indexing with all data kept on-device.

## Current Application Layers

### 1) Presentation Layer

- Entry: `lib/main.dart`
- Screens: `lib/screens/*`
- Navigation: Material routes + bottom navigation shell

Responsibilities:
- Render UI
- Trigger state actions
- Show progress/errors/snackbars

### 2) State Layer (Riverpod)

- Providers: `lib/core/state/app_providers.dart`
- Scan session: `scan_session_controller.dart`, `scan_session_state.dart`
- Library/search: `library_controller.dart`, `library_state.dart`

Responsibilities:
- Coordinate user flow
- Hold in-memory session state
- Call services/repositories

### 3) Service Layer

- `file_service.dart`
- `image_processing_service.dart`
- `pdf_service.dart`
- `ocr_service.dart`
- `scan_pipeline_service.dart`

Responsibilities:
- File creation/moves/cleanup
- Image filtering pipeline
- PDF generation
- OCR extraction
- End-to-end save/delete orchestration

### 4) Persistence Layer

- DB setup: `lib/core/storage/database_service.dart`
- Document access: `document_repository.dart`
- Folder access: `folder_repository.dart`

Responsibilities:
- SQLite schema and migrations (versioned by DB open callback)
- Document metadata CRUD
- Page path persistence
- FTS-backed search queries

### 5) Domain Models

- `lib/core/models/*`

Examples:
- `DocumentRecord`
- `DocumentPageRecord`
- `FolderRecord`
- `ScanFilter`
- `SearchResult`

## Data Flow

1. User captures image in `ScanScreen`
2. `ScanSessionController.addCapturedImage()` processes image
3. Review screen updates filter/pages and triggers save
4. `ScanPipelineService.saveDocument()`:
   - copies page files to permanent storage
   - generates PDF
   - writes metadata to SQLite
   - schedules OCR asynchronously
5. Library controller reloads documents
6. Search queries hit SQLite FTS table

## Storage Model

- Files: app support/documents folders managed by `FileService`
- Metadata: SQLite tables
  - `folders`
  - `documents`
  - `document_pages`
  - `documents_fts` (FTS virtual table)

## Key Invariants

1. Core scan pipeline works offline.
2. OCR does not block save/capture flow.
3. Library/search UI is sourced from SQLite metadata.
4. Deleting a document removes metadata and associated files.
5. Scan pages are processed before final PDF assembly.

## Extension Points

- Add cloud sync as a new service/repository layer without changing UI contracts.
- Add annotation workflows by extending models and detail screen actions.
- Add folder-level rules by extending `FolderRepository` + `LibraryController`.
