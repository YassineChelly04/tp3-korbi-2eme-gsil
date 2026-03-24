enum ScanFilter {
  auto,
  grayscale,
  blackWhite,
  original,
  colorPop,
  magicEnhance,
  document,
  whiteboard,
}

extension ScanFilterX on ScanFilter {
  String get dbValue {
    switch (this) {
      case ScanFilter.auto:
        return 'auto';
      case ScanFilter.grayscale:
        return 'grayscale';
      case ScanFilter.blackWhite:
        return 'black_white';
      case ScanFilter.original:
        return 'original';
      case ScanFilter.colorPop:
        return 'color_pop';
      case ScanFilter.magicEnhance:
        return 'magic_enhance';
      case ScanFilter.document:
        return 'document';
      case ScanFilter.whiteboard:
        return 'whiteboard';
    }
  }

  String get label {
    switch (this) {
      case ScanFilter.auto:
        return 'Auto';
      case ScanFilter.grayscale:
        return 'Grayscale';
      case ScanFilter.blackWhite:
        return 'B&W';
      case ScanFilter.original:
        return 'Original';
      case ScanFilter.colorPop:
        return 'Color Pop';
      case ScanFilter.magicEnhance:
        return 'Magic';
      case ScanFilter.document:
        return 'Document';
      case ScanFilter.whiteboard:
        return 'Whiteboard';
    }
  }

  String get description {
    switch (this) {
      case ScanFilter.auto:
        return 'Smart enhancement';
      case ScanFilter.grayscale:
        return 'Classic gray tones';
      case ScanFilter.blackWhite:
        return 'High contrast B&W';
      case ScanFilter.original:
        return 'No changes';
      case ScanFilter.colorPop:
        return 'Vibrant colors';
      case ScanFilter.magicEnhance:
        return 'AI-style boost';
      case ScanFilter.document:
        return 'Clean text mode';
      case ScanFilter.whiteboard:
        return 'Remove shadows';
    }
  }

  static ScanFilter fromDb(String value) {
    return ScanFilter.values.firstWhere(
      (item) => item.dbValue == value,
      orElse: () => ScanFilter.auto,
    );
  }
}

