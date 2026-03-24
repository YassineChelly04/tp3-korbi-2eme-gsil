import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/database_service.dart';
import '../storage/document_repository.dart';
import 'library_state.dart';

class LibraryController extends StateNotifier<LibraryState> {
  LibraryController({required DocumentRepository documentRepository})
      : _documentRepository = documentRepository,
        super(LibraryState.initial());

  final DocumentRepository _documentRepository;
  Timer? _debounce;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final documents = await _documentRepository.list(
        folderId: DatabaseService.defaultFolderId,
      );
      state = state.copyWith(
        isLoading: false,
        documents: documents,
        error: null,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: error.toString(),
      );
    }
  }

  void onSearchChanged(String value) {
    _debounce?.cancel();
    state = state.copyWith(query: value);
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final query = value.trim();
      if (query.isEmpty) {
        state = state.copyWith(searchResults: []);
        return;
      }
      final results = await _documentRepository.search(query);
      state = state.copyWith(searchResults: results);
    });
  }

  Future<void> rename(String id, String name) async {
    await _documentRepository.rename(id, name);
    await load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}

