import '../models/document_record.dart';
import '../models/search_result.dart';

class LibraryState {
  const LibraryState({
    required this.documents,
    required this.searchResults,
    required this.isLoading,
    required this.query,
    required this.error,
  });

  final List<DocumentRecord> documents;
  final List<SearchResult> searchResults;
  final bool isLoading;
  final String query;
  final String? error;

  factory LibraryState.initial() {
    return const LibraryState(
      documents: [],
      searchResults: [],
      isLoading: false,
      query: '',
      error: null,
    );
  }

  bool get isSearching => query.trim().isNotEmpty;

  LibraryState copyWith({
    List<DocumentRecord>? documents,
    List<SearchResult>? searchResults,
    bool? isLoading,
    String? query,
    String? error,
  }) {
    return LibraryState(
      documents: documents ?? this.documents,
      searchResults: searchResults ?? this.searchResults,
      isLoading: isLoading ?? this.isLoading,
      query: query ?? this.query,
      error: error,
    );
  }
}

