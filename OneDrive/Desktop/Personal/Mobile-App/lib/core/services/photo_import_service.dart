import 'dart:io';
import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:flutter/material.dart';

import '../models/scan_filter.dart';
import 'file_service.dart';
import 'image_processing_service.dart';
import 'document_edge_detector.dart';

/// Service for importing and processing photos from gallery
class PhotoImportService {
  PhotoImportService({
    FileService? fileService,
    ImageProcessingService? imageProcessingService,
    DocumentEdgeDetector? edgeDetector,
  })  : _fileService = fileService ?? FileService(),
        _imageProcessingService = imageProcessingService ?? ImageProcessingService(),
        _edgeDetector = edgeDetector ?? DocumentEdgeDetector();

  final FileService _fileService;
  final ImageProcessingService _imageProcessingService;
  final DocumentEdgeDetector _edgeDetector;
  final ImagePicker _picker = ImagePicker();

  /// Pick multiple images from gallery
  Future<List<String>> pickMultipleImages() async {
    final List<XFile> images = await _picker.pickMultiImage(
      imageQuality: 100,
    );
    
    return images.map((xfile) => xfile.path).toList();
  }

  /// Pick a single image from gallery
  Future<String?> pickSingleImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 100,
    );
    
    return image?.path;
  }

  /// Detect document corners in an image using edge detection
  /// Returns 4 corner points or default corners if no document detected
  Future<List<Offset>> detectDocumentCorners(String imagePath) async {
    try {
      final bytes = await File(imagePath).readAsBytes();
      
      // Try advanced edge detection first
      final result = await _edgeDetector.detectDocument(bytes);
      if (result != null && result.isConfident) {
        return result.corners;
      }
      
      // Fall back to simple detection
      final image = img.decodeImage(bytes);
      if (image == null) {
        return _getDefaultCorners(800, 600); // Reasonable defaults
      }
      
      return _getDefaultCorners(image.width.toDouble(), image.height.toDouble());
    } catch (e) {
      debugPrint('Error detecting document corners: $e');
      return _getDefaultCorners(800, 600);
    }
  }

  /// Get default corners with margin
  List<Offset> _getDefaultCorners(double width, double height) {
    final margin = 0.1;
    return [
      Offset(width * margin, height * margin),           // Top-left
      Offset(width * (1 - margin), height * margin),     // Top-right
      Offset(width * (1 - margin), height * (1 - margin)), // Bottom-right
      Offset(width * margin, height * (1 - margin)),     // Bottom-left
    ];
  }

  /// Crop image to specified corners with perspective correction
  Future<String> cropToCorners({
    required String sourcePath,
    required List<Offset> corners,
    required String outputName,
  }) async {
    final bytes = await File(sourcePath).readAsBytes();
    
    // Try perspective warp first for better quality
    final warped = await _edgeDetector.warpPerspective(bytes, corners);
    if (warped != null) {
      final outputFile = await _fileService.createTempJpeg(outputName);
      await outputFile.writeAsBytes(warped, flush: true);
      return outputFile.path;
    }
    
    // Fall back to simple crop
    final image = img.decodeImage(bytes);
    if (image == null) {
      throw Exception('Unable to decode image for cropping.');
    }

    // Calculate bounding box from corners
    double minX = corners[0].dx;
    double minY = corners[0].dy;
    double maxX = corners[0].dx;
    double maxY = corners[0].dy;

    for (final corner in corners) {
      if (corner.dx < minX) minX = corner.dx;
      if (corner.dy < minY) minY = corner.dy;
      if (corner.dx > maxX) maxX = corner.dx;
      if (corner.dy > maxY) maxY = corner.dy;
    }

    // Clamp to image bounds
    minX = minX.clamp(0, image.width.toDouble());
    minY = minY.clamp(0, image.height.toDouble());
    maxX = maxX.clamp(0, image.width.toDouble());
    maxY = maxY.clamp(0, image.height.toDouble());

    final cropWidth = (maxX - minX).toInt();
    final cropHeight = (maxY - minY).toInt();
    
    if (cropWidth <= 0 || cropHeight <= 0) {
      throw Exception('Invalid crop dimensions.');
    }

    // Crop the image
    final cropped = img.copyCrop(
      image,
      x: minX.toInt(),
      y: minY.toInt(),
      width: cropWidth,
      height: cropHeight,
    );

    // Save cropped image
    final outputFile = await _fileService.createTempJpeg(outputName);
    final jpeg = img.encodeJpg(cropped, quality: 92);
    await outputFile.writeAsBytes(jpeg, flush: true);

    return outputFile.path;
  }

  /// Process imported image with filter
  Future<String> processImportedImage({
    required String sourcePath,
    required ScanFilter filter,
    required String outputName,
  }) async {
    return _imageProcessingService.processCapturedImage(
      sourcePath: sourcePath,
      filter: filter,
      outputName: outputName,
    );
  }

  /// Get image dimensions
  Future<Size?> getImageSize(String imagePath) async {
    try {
      final bytes = await File(imagePath).readAsBytes();
      final image = img.decodeImage(bytes);
      if (image == null) return null;
      return Size(image.width.toDouble(), image.height.toDouble());
    } catch (e) {
      debugPrint('Error getting image size: $e');
      return null;
    }
  }
}

/// Represents an imported photo with detected corners
class ImportedPhoto {
  final String originalPath;
  final String? processedPath;
  final List<Offset> corners;
  final Size imageSize;
  final ScanFilter filter;
  final bool isProcessed;

  ImportedPhoto({
    required this.originalPath,
    this.processedPath,
    required this.corners,
    required this.imageSize,
    this.filter = ScanFilter.auto,
    this.isProcessed = false,
  });

  ImportedPhoto copyWith({
    String? originalPath,
    String? processedPath,
    List<Offset>? corners,
    Size? imageSize,
    ScanFilter? filter,
    bool? isProcessed,
  }) {
    return ImportedPhoto(
      originalPath: originalPath ?? this.originalPath,
      processedPath: processedPath ?? this.processedPath,
      corners: corners ?? this.corners,
      imageSize: imageSize ?? this.imageSize,
      filter: filter ?? this.filter,
      isProcessed: isProcessed ?? this.isProcessed,
    );
  }
}
