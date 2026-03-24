import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/foundation.dart';

import 'package:image/image.dart' as img;

import '../models/scan_filter.dart';
import 'file_service.dart';

/// Data class for passing to isolate
class _ProcessImageParams {
  final Uint8List bytes;
  final ScanFilter filter;
  
  _ProcessImageParams(this.bytes, this.filter);
}

/// Process image in background isolate to prevent UI lag
Uint8List _processImageInBackground(_ProcessImageParams params) {
  final decoded = img.decodeImage(params.bytes);
  if (decoded == null) {
    throw Exception('Unable to decode captured image.');
  }

  final enhanced = _applyFilterStatic(decoded, params.filter);
  return Uint8List.fromList(img.encodeJpg(enhanced, quality: 90));
}

/// Static filter application for isolate use
img.Image _applyFilterStatic(img.Image source, ScanFilter filter) {
  switch (filter) {
    case ScanFilter.auto:
      // Auto enhance: boost contrast and brightness slightly
      return img.adjustColor(source, contrast: 1.15, brightness: 1.03);

    case ScanFilter.grayscale:
      return img.grayscale(source);

    case ScanFilter.blackWhite:
      final gray = img.grayscale(source);
      // High contrast black & white
      return img.luminanceThreshold(gray, threshold: 0.5);

    case ScanFilter.original:
      return source;

    case ScanFilter.colorPop:
      // Vibrant color enhancement
      return img.adjustColor(source, saturation: 1.5, contrast: 1.2, brightness: 1.05);

    case ScanFilter.magicEnhance:
      // AI-style enhancement: strong contrast and saturation
      return img.adjustColor(source, contrast: 1.3, saturation: 1.2, brightness: 1.05);

    case ScanFilter.document:
      // Document mode: grayscale with high contrast for text
      final gray = img.grayscale(source);
      return img.adjustColor(gray, contrast: 1.5, brightness: 1.1);

    case ScanFilter.whiteboard:
      // Whiteboard mode: brighten and increase contrast
      final bright = img.adjustColor(source, brightness: 1.2, contrast: 1.4);
      final gray = img.grayscale(bright);
      return _whiteboardEnhanceStatic(gray);
  }
}

/// Whiteboard enhancement for isolate use
img.Image _whiteboardEnhanceStatic(img.Image source) {
  final result = img.Image(width: source.width, height: source.height);
  
  for (int y = 0; y < source.height; y++) {
    for (int x = 0; x < source.width; x++) {
      final pixel = source.getPixel(x, y);
      final luminance = img.getLuminance(pixel);
      
      int newVal;
      if (luminance > 180) {
        newVal = 255; // Pure white
      } else if (luminance > 120) {
        newVal = math.min(255, (luminance * 1.3).toInt());
      } else {
        newVal = math.max(0, math.min(255, (luminance * 0.7).toInt()));
      }
      
      result.setPixelRgba(x, y, newVal, newVal, newVal, 255);
    }
  }
  
  return result;
}

class ImageProcessingService {
  ImageProcessingService({FileService? fileService})
      : _fileService = fileService ?? FileService();

  final FileService _fileService;

  /// Process image in background isolate to prevent UI lag
  Future<String> processCapturedImage({
    required String sourcePath,
    required ScanFilter filter,
    required String outputName,
  }) async {
    final bytes = await File(sourcePath).readAsBytes();
    
    // Process in background isolate
    final jpegBytes = await compute(
      _processImageInBackground,
      _ProcessImageParams(bytes, filter),
    );

    final outputFile = await _fileService.createTempJpeg(outputName);
    await outputFile.writeAsBytes(jpegBytes, flush: true);

    return outputFile.path;
  }

  /// Quick preview processing (lower quality, faster)
  Future<String> processPreview({
    required String sourcePath,
    required ScanFilter filter,
    required String outputName,
  }) async {
    final bytes = await File(sourcePath).readAsBytes();
    final decoded = img.decodeImage(bytes);
    if (decoded == null) {
      throw Exception('Unable to decode image.');
    }
    
    // Resize for faster preview
    final resized = img.copyResize(decoded, width: 800);
    final enhanced = _applyFilterStatic(resized, filter);
    
    final outputFile = await _fileService.createTempJpeg(outputName);
    final jpeg = img.encodeJpg(enhanced, quality: 75);
    await outputFile.writeAsBytes(jpeg, flush: true);

    return outputFile.path;
  }
}

