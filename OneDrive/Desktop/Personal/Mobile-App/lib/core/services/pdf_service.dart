import 'dart:io';

import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class PdfService {
  Future<void> createPdf({
    required List<String> pageImagePaths,
    required String outputPath,
  }) async {
    final document = pw.Document();

    for (final imagePath in pageImagePaths) {
      final bytes = await File(imagePath).readAsBytes();
      final image = pw.MemoryImage(bytes);
      document.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (_) => pw.Center(
            child: pw.Image(image, fit: pw.BoxFit.contain),
          ),
        ),
      );
    }

    final file = File(outputPath);
    await file.create(recursive: true);
    await file.writeAsBytes(await document.save(), flush: true);
  }
}

