# Lumen Scan (Flutter)

This project is now **Flutter-only** (no Expo/React runtime files).

## MVP features implemented

- Camera capture screen (`camera` package)
- Review flow with page list + enhancement filter selection
- PDF generation from ordered pages (`pdf` package)
- Local-first file storage (PDF + page JPEGs)
- SQLite metadata database + FTS5 search (`sqflite`)
- Async on-device OCR (`google_mlkit_text_recognition`)
- Library with debounced search by filename/OCR content
- Document detail actions: rename, share PDF, share JPEG (single-page), delete

## Prerequisites

1. Install Flutter SDK
2. Run `flutter doctor`

## First-time setup

If platform folders are not present, generate them:

```bash
flutter create .
```

Then install dependencies:

```bash
flutter pub get
```

## Run

```bash
flutter run
```

## Key directories

- `lib/core/models`: domain models (`DocumentRecord`, filters, pages)
- `lib/core/storage`: SQLite initialization + repositories
- `lib/core/services`: file, processing, OCR, PDF, scan pipeline
- `lib/core/state`: Riverpod providers + controllers
- `lib/screens`: camera, review, library, detail, settings
