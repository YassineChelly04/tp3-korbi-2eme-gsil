import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/scan_filter.dart';
import '../services/image_processing_service.dart';
import '../services/scan_pipeline_service.dart';
import 'scan_session_state.dart';

class ScanSessionController extends StateNotifier<ScanSessionState> {
  ScanSessionController({
    required ImageProcessingService imageProcessingService,
    required ScanPipelineService scanPipelineService,
  })  : _imageProcessingService = imageProcessingService,
        _scanPipelineService = scanPipelineService,
        super(ScanSessionState.initial());

  final ImageProcessingService _imageProcessingService;
  final ScanPipelineService _scanPipelineService;

  Future<void> addCapturedImage(String capturedPath) async {
    try {
      // Process the captured image with current filter
      final output = await _imageProcessingService.processCapturedImage(
        sourcePath: capturedPath,
        filter: state.filter,
        outputName: 'page_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
      
      // Store both original and processed versions
      state = state.copyWith(
        originalPages: [...state.originalPages, capturedPath],
        processedPages: [...state.processedPages, output],
        error: null,
      );
    } catch (error) {
      state = state.copyWith(error: error.toString());
    }
  }

  Future<void> reprocessWithFilter() async {
    if (state.originalPages.isEmpty || state.isReprocessing) {
      return;
    }
    
    state = state.copyWith(isReprocessing: true);
    
    try {
      final rebuilt = <String>[];
      // Always reprocess from ORIGINAL images, not processed ones
      for (final sourcePath in state.originalPages) {
        final output = await _imageProcessingService.processCapturedImage(
          sourcePath: sourcePath,
          filter: state.filter,
          outputName: 'page_${DateTime.now().millisecondsSinceEpoch}.jpg',
        );
        rebuilt.add(output);
      }
      state = state.copyWith(processedPages: rebuilt, error: null, isReprocessing: false);
    } catch (error) {
      state = state.copyWith(error: error.toString(), isReprocessing: false);
    }
  }

  void updateFilter(ScanFilter filter) {
    if (filter == state.filter) return;
    state = state.copyWith(filter: filter);
    // Automatically reprocess images with the new filter
    reprocessWithFilter();
  }

  void removePage(int index) {
    final originalCopy = List<String>.from(state.originalPages);
    final processedCopy = List<String>.from(state.processedPages);
    if (index < 0 || index >= processedCopy.length) {
      return;
    }
    originalCopy.removeAt(index);
    processedCopy.removeAt(index);
    state = state.copyWith(originalPages: originalCopy, processedPages: processedCopy);
  }

  void clear() {
    state = ScanSessionState.initial();
  }

  Future<void> saveDocument({
    required String name,
    required String folderId,
  }) async {
    if (state.processedPages.isEmpty) {
      return;
    }

    state = state.copyWith(isSaving: true, error: null);

    try {
      await _scanPipelineService.saveDocument(
        name: name,
        folderId: folderId,
        processedTempPages: state.processedPages,
        filter: state.filter,
      );
      state = ScanSessionState.initial();
    } catch (error) {
      state = state.copyWith(isSaving: false, error: error.toString());
    }
  }
}

