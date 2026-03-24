import 'package:flutter_riverpod/flutter_riverpod.dart';

// import '../services/document_edge_detector.dart';  // Temporarily disabled for Windows testing
import '../services/file_service.dart';
import '../services/image_processing_service.dart';
import '../services/ocr_service.dart';
import '../services/pdf_service.dart';
import '../services/scan_pipeline_service.dart';
import '../services/photo_import_service.dart';
import '../storage/document_repository.dart';
import '../storage/folder_repository.dart';
import 'library_controller.dart';
import 'library_state.dart';
import 'scan_session_controller.dart';
import 'scan_session_state.dart';

final fileServiceProvider = Provider<FileService>((_) => FileService());
final pdfServiceProvider = Provider<PdfService>((_) => PdfService());
final ocrServiceProvider = Provider<OcrService>((_) => OcrService());
final photoImportServiceProvider = Provider<PhotoImportService>((_) => PhotoImportService());
// final documentEdgeDetectorProvider = Provider<DocumentEdgeDetector>((_) => DocumentEdgeDetector());  // Temporarily disabled

final imageProcessingServiceProvider = Provider<ImageProcessingService>((ref) {
  return ImageProcessingService(fileService: ref.read(fileServiceProvider));
});

final documentRepositoryProvider = Provider<DocumentRepository>((_) => DocumentRepository());
final folderRepositoryProvider = Provider<FolderRepository>((_) => FolderRepository());

final scanPipelineServiceProvider = Provider<ScanPipelineService>((ref) {
  return ScanPipelineService(
    documentRepository: ref.read(documentRepositoryProvider),
    fileService: ref.read(fileServiceProvider),
    pdfService: ref.read(pdfServiceProvider),
    ocrService: ref.read(ocrServiceProvider),
  );
});

final scanSessionControllerProvider =
    StateNotifierProvider<ScanSessionController, ScanSessionState>((ref) {
  return ScanSessionController(
    imageProcessingService: ref.read(imageProcessingServiceProvider),
    scanPipelineService: ref.read(scanPipelineServiceProvider),
  );
});

final libraryControllerProvider =
    StateNotifierProvider<LibraryController, LibraryState>((ref) {
  return LibraryController(
    documentRepository: ref.read(documentRepositoryProvider),
  )..load();
});

