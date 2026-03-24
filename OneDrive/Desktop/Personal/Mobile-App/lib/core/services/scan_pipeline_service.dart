import 'dart:async';
import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/document_record.dart';
import '../models/scan_filter.dart';
import '../storage/document_repository.dart';
import 'file_service.dart';
import 'ocr_service.dart';
import 'pdf_service.dart';

class ScanPipelineService {
  ScanPipelineService({
    DocumentRepository? documentRepository,
    FileService? fileService,
    PdfService? pdfService,
    OcrService? ocrService,
  })  : _documentRepository = documentRepository ?? DocumentRepository(),
        _fileService = fileService ?? FileService(),
        _pdfService = pdfService ?? PdfService(),
        _ocrService = ocrService ?? OcrService();

  final DocumentRepository _documentRepository;
  final FileService _fileService;
  final PdfService _pdfService;
  final OcrService _ocrService;

  final Uuid _uuid = const Uuid();

  Future<DocumentRecord> saveDocument({
    required String name,
    required String folderId,
    required List<String> processedTempPages,
    required ScanFilter filter,
  }) async {
    final documentId = _uuid.v4();
    final now = DateTime.now();

    final permanentPagePaths = <String>[];
    final relativePagePaths = <String>[];

    for (var index = 0; index < processedTempPages.length; index++) {
      final source = File(processedTempPages[index]);
      final permanentPath = await _fileService.ensurePageImagePath(
        folderId: folderId,
        documentId: documentId,
        pageIndex: index + 1,
      );
      await source.copy(permanentPath);
      permanentPagePaths.add(permanentPath);
      relativePagePaths.add(await _fileService.toRelativePath(permanentPath));
    }

    final pdfPath = await _fileService.ensureDocumentPdfPath(
      folderId: folderId,
      documentId: documentId,
    );

    await _pdfService.createPdf(
      pageImagePaths: permanentPagePaths,
      outputPath: pdfPath,
    );

    final relativePdfPath = await _fileService.toRelativePath(pdfPath);
    final fileSize = await _fileService.fileSize(pdfPath);

    final record = DocumentRecord(
      id: documentId,
      folderId: folderId,
      name: name,
      relativePath: relativePdfPath,
      pageCount: permanentPagePaths.length,
      fileSize: fileSize,
      ocrStatus: 'pending',
      ocrText: '',
      filterUsed: filter,
      createdAt: now,
      updatedAt: now,
    );

    await _documentRepository.upsert(record);
    await _documentRepository.savePages(
      documentId: documentId,
      relativePagePaths: relativePagePaths,
    );

    await _fileService.deleteMany(processedTempPages);

    unawaited(_runOcr(documentId));

    return record;
  }

  Future<void> deleteDocument(DocumentRecord record) async {
    await _documentRepository.deleteDocument(record.id, (relativePaths) async {
      final absolutePaths = <String>[];
      for (final relativePath in relativePaths) {
        absolutePaths.add(await _fileService.absoluteFromRelative(relativePath));
      }
      await _fileService.deleteMany(absolutePaths);
    });
  }

  Future<void> _runOcr(String documentId) async {
    final record = await _documentRepository.getById(documentId);
    if (record == null) {
      return;
    }

    await _documentRepository.updateOcr(id: documentId, status: 'processing', text: record.ocrText);

    final pages = await _documentRepository.getPages(documentId);
    final absolutePaths = <String>[];
    for (final page in pages) {
      absolutePaths.add(await _fileService.absoluteFromRelative(page.relativePath));
    }

    var hadError = false;
    final perPageText = <String>[];

    for (final path in absolutePaths) {
      try {
        perPageText.add(await _ocrService.readPage(path));
      } catch (error) {
        // Log the OCR error for debugging
        print('OCR error for page $path: $error');
        hadError = true;
        perPageText.add('');
      }
    }

    final concatenated = perPageText.join('\n\n---PAGE---\n\n');
    await _documentRepository.updateOcr(
      id: documentId,
      status: hadError ? 'partial' : 'complete',
      text: concatenated,
    );
  }
}

