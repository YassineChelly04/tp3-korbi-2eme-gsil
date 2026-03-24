import '../models/scan_filter.dart';

class ScanSessionState {
  const ScanSessionState({
    required this.originalPages,
    required this.processedPages,
    required this.filter,
    required this.isSaving,
    required this.isReprocessing,
    required this.error,
  });

  /// Original captured images (unprocessed)
  final List<String> originalPages;
  
  /// Processed images with current filter applied
  final List<String> processedPages;
  
  final ScanFilter filter;
  final bool isSaving;
  final bool isReprocessing;
  final String? error;

  /// For backwards compatibility - returns processed pages
  List<String> get pages => processedPages;

  factory ScanSessionState.initial() {
    return const ScanSessionState(
      originalPages: [],
      processedPages: [],
      filter: ScanFilter.auto,
      isSaving: false,
      isReprocessing: false,
      error: null,
    );
  }

  ScanSessionState copyWith({
    List<String>? originalPages,
    List<String>? processedPages,
    ScanFilter? filter,
    bool? isSaving,
    bool? isReprocessing,
    String? error,
  }) {
    return ScanSessionState(
      originalPages: originalPages ?? this.originalPages,
      processedPages: processedPages ?? this.processedPages,
      filter: filter ?? this.filter,
      isSaving: isSaving ?? this.isSaving,
      isReprocessing: isReprocessing ?? this.isReprocessing,
      error: error,
    );
  }
}

