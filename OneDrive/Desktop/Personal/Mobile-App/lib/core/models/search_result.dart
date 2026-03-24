import 'document_record.dart';

class SearchResult {
  const SearchResult({
    required this.document,
    required this.snippet,
  });

  final DocumentRecord document;
  final String snippet;
}

