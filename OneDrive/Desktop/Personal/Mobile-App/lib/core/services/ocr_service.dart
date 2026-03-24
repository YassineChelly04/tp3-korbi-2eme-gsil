import 'package:flutter/material.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

/// OCR result with text blocks and their positions
class OcrResult {
  final String fullText;
  final List<OcrBlock> blocks;
  final Size imageSize;

  OcrResult({
    required this.fullText,
    required this.blocks,
    required this.imageSize,
  });
}

/// A block of recognized text with position info
class OcrBlock {
  final String text;
  final Rect boundingBox;
  final List<OcrLine> lines;
  final double confidence;

  OcrBlock({
    required this.text,
    required this.boundingBox,
    required this.lines,
    this.confidence = 1.0,
  });
}

/// A line of recognized text
class OcrLine {
  final String text;
  final Rect boundingBox;
  final List<OcrElement> elements;

  OcrLine({
    required this.text,
    required this.boundingBox,
    required this.elements,
  });
}

/// A single word/element
class OcrElement {
  final String text;
  final Rect boundingBox;

  OcrElement({
    required this.text,
    required this.boundingBox,
  });
}

class OcrService {
  OcrService() : _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  final TextRecognizer _textRecognizer;

  /// Read text from a page image (simple version)
  Future<String> readPage(String pagePath) async {
    final input = InputImage.fromFilePath(pagePath);
    final recognized = await _textRecognizer.processImage(input);
    return recognized.text;
  }

  /// Read text with full block/line/element info for editing
  Future<OcrResult> readPageWithBlocks(String pagePath) async {
    final input = InputImage.fromFilePath(pagePath);
    final recognized = await _textRecognizer.processImage(input);
    
    final blocks = <OcrBlock>[];
    
    for (final block in recognized.blocks) {
      final lines = <OcrLine>[];
      
      for (final line in block.lines) {
        final elements = <OcrElement>[];
        
        for (final element in line.elements) {
          elements.add(OcrElement(
            text: element.text,
            boundingBox: Rect.fromLTRB(
              element.boundingBox.left.toDouble(),
              element.boundingBox.top.toDouble(),
              element.boundingBox.right.toDouble(),
              element.boundingBox.bottom.toDouble(),
            ),
          ));
        }
        
        lines.add(OcrLine(
          text: line.text,
          boundingBox: Rect.fromLTRB(
            line.boundingBox.left.toDouble(),
            line.boundingBox.top.toDouble(),
            line.boundingBox.right.toDouble(),
            line.boundingBox.bottom.toDouble(),
          ),
          elements: elements,
        ));
      }
      
      blocks.add(OcrBlock(
        text: block.text,
        boundingBox: Rect.fromLTRB(
          block.boundingBox.left.toDouble(),
          block.boundingBox.top.toDouble(),
          block.boundingBox.right.toDouble(),
          block.boundingBox.bottom.toDouble(),
        ),
        lines: lines,
      ));
    }
    
    // Get image size from input metadata if available
    final imageSize = input.metadata?.size ?? const Size(1000, 1000);
    
    return OcrResult(
      fullText: recognized.text,
      blocks: blocks,
      imageSize: imageSize,
    );
  }

  Future<void> dispose() async {
    await _textRecognizer.close();
  }
}

