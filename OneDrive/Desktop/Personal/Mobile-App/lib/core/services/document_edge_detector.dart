import 'dart:typed_data';
import 'dart:math' show pi, pow, atan2, sqrt, max, min;
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;

/// Pure Dart document edge detection service
/// Uses Canny-like edge detection + contour detection for finding document boundaries
class DocumentEdgeDetector {
  /// Detect document edges in an image
  /// Returns the 4 corners of the detected document or null if no document found
  Future<DocumentDetectionResult?> detectDocument(Uint8List imageBytes) async {
    try {
      // Decode image
      final image = img.decodeImage(imageBytes);
      if (image == null) return null;

      // Convert to grayscale
      final gray = img.grayscale(image);
      
      // Apply Gaussian blur
      final blurred = img.gaussianBlur(gray, radius: 2);
      
      // Simple edge detection using Sobel-like operator
      final edges = _detectEdges(blurred);
      
      // Find the document contour
      final corners = _findDocumentCorners(edges, image.width, image.height);
      
      if (corners == null) {
        return DocumentDetectionResult(
          corners: _getDefaultCorners(image.width.toDouble(), image.height.toDouble()),
          confidence: 0.3,
          imageSize: Size(image.width.toDouble(), image.height.toDouble()),
        );
      }

      return DocumentDetectionResult(
        corners: corners,
        confidence: 0.8,
        imageSize: Size(image.width.toDouble(), image.height.toDouble()),
      );
    } catch (e) {
      debugPrint('Error detecting document edges: $e');
      return null;
    }
  }

  /// Detect edges using a simple gradient-based approach
  img.Image _detectEdges(img.Image gray) {
    final result = img.Image(width: gray.width, height: gray.height);
    
    for (int y = 1; y < gray.height - 1; y++) {
      for (int x = 1; x < gray.width - 1; x++) {
        // Sobel operator
        final gx = 
          -1 * img.getLuminance(gray.getPixel(x - 1, y - 1)) +
          1 * img.getLuminance(gray.getPixel(x + 1, y - 1)) +
          -2 * img.getLuminance(gray.getPixel(x - 1, y)) +
          2 * img.getLuminance(gray.getPixel(x + 1, y)) +
          -1 * img.getLuminance(gray.getPixel(x - 1, y + 1)) +
          1 * img.getLuminance(gray.getPixel(x + 1, y + 1));
          
        final gy = 
          -1 * img.getLuminance(gray.getPixel(x - 1, y - 1)) +
          -2 * img.getLuminance(gray.getPixel(x, y - 1)) +
          -1 * img.getLuminance(gray.getPixel(x + 1, y - 1)) +
          1 * img.getLuminance(gray.getPixel(x - 1, y + 1)) +
          2 * img.getLuminance(gray.getPixel(x, y + 1)) +
          1 * img.getLuminance(gray.getPixel(x + 1, y + 1));
        
        final magnitude = sqrt(gx * gx + gy * gy).clamp(0, 255).toInt();
        result.setPixelRgba(x, y, magnitude, magnitude, magnitude, 255);
      }
    }
    
    return result;
  }

  /// Find document corners from edge image
  List<Offset>? _findDocumentCorners(img.Image edges, int width, int height) {
    // Find strongest edge points in each quadrant
    final topLeft = _findStrongestEdge(edges, 0, 0, width ~/ 2, height ~/ 2);
    final topRight = _findStrongestEdge(edges, width ~/ 2, 0, width, height ~/ 2);
    final bottomRight = _findStrongestEdge(edges, width ~/ 2, height ~/ 2, width, height);
    final bottomLeft = _findStrongestEdge(edges, 0, height ~/ 2, width ~/ 2, height);
    
    if (topLeft == null || topRight == null || bottomRight == null || bottomLeft == null) {
      return null;
    }
    
    return [topLeft, topRight, bottomRight, bottomLeft];
  }

  Offset? _findStrongestEdge(img.Image edges, int x1, int y1, int x2, int y2) {
    int maxVal = 0;
    Offset? maxPoint;
    
    // Sample every 5th pixel for speed
    for (int y = y1; y < y2; y += 5) {
      for (int x = x1; x < x2; x += 5) {
        final val = img.getLuminance(edges.getPixel(x, y)).toInt();
        if (val > maxVal && val > 100) { // Threshold
          maxVal = val;
          maxPoint = Offset(x.toDouble(), y.toDouble());
        }
      }
    }
    
    return maxPoint;
  }

  List<Offset> _getDefaultCorners(double width, double height) {
    final margin = 0.1;
    return [
      Offset(width * margin, height * margin),
      Offset(width * (1 - margin), height * margin),
      Offset(width * (1 - margin), height * (1 - margin)),
      Offset(width * margin, height * (1 - margin)),
    ];
  }

  /// Apply perspective warp to extract the document
  Future<Uint8List?> warpPerspective(
    Uint8List imageBytes,
    List<Offset> corners,
  ) async {
    try {
      final srcImage = img.decodeImage(imageBytes);
      if (srcImage == null) return null;

      // Order corners: top-left, top-right, bottom-right, bottom-left
      final orderedCorners = _orderCorners(corners);

      // Calculate output dimensions
      final width = _distance(orderedCorners[0], orderedCorners[1]).toInt();
      final height = _distance(orderedCorners[0], orderedCorners[3]).toInt();

      if (width <= 0 || height <= 0) return null;

      // Create output image
      final result = img.Image(width: width, height: height);

      // Simple perspective transform using bilinear interpolation
      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          // Map destination to source coordinates
          final tx = x / width;
          final ty = y / height;
          
          // Bilinear interpolation of source position
          final topX = orderedCorners[0].dx + (orderedCorners[1].dx - orderedCorners[0].dx) * tx;
          final topY = orderedCorners[0].dy + (orderedCorners[1].dy - orderedCorners[0].dy) * tx;
          final bottomX = orderedCorners[3].dx + (orderedCorners[2].dx - orderedCorners[3].dx) * tx;
          final bottomY = orderedCorners[3].dy + (orderedCorners[2].dy - orderedCorners[3].dy) * tx;
          
          final srcX = (topX + (bottomX - topX) * ty).round().clamp(0, srcImage.width - 1);
          final srcY = (topY + (bottomY - topY) * ty).round().clamp(0, srcImage.height - 1);
          
          final pixel = srcImage.getPixel(srcX, srcY);
          result.setPixel(x, y, pixel);
        }
      }

      return Uint8List.fromList(img.encodeJpg(result, quality: 92));
    } catch (e) {
      debugPrint('Error warping perspective: $e');
      return null;
    }
  }

  /// Order corners in a consistent way: top-left, top-right, bottom-right, bottom-left
  List<Offset> _orderCorners(List<Offset> corners) {
    // Sort by y coordinate
    final sorted = List<Offset>.from(corners)..sort((a, b) => a.dy.compareTo(b.dy));

    // Top two points
    final topTwo = sorted.sublist(0, 2)..sort((a, b) => a.dx.compareTo(b.dx));
    // Bottom two points
    final bottomTwo = sorted.sublist(2, 4)..sort((a, b) => a.dx.compareTo(b.dx));

    return [
      topTwo[0], // top-left
      topTwo[1], // top-right
      bottomTwo[1], // bottom-right
      bottomTwo[0], // bottom-left
    ];
  }

  /// Calculate distance between two points
  double _distance(Offset p1, Offset p2) {
    final dx = (p1.dx - p2.dx).abs();
    final dy = (p1.dy - p2.dy).abs();
    return sqrt(pow(dx, 2) + pow(dy, 2));
  }
}

/// Document detection result
class DocumentDetectionResult {
  final List<Offset> corners;
  final double confidence;
  final Size imageSize;

  DocumentDetectionResult({
    required this.corners,
    required this.confidence,
    required this.imageSize,
  });

  /// Check if detection is confident enough for auto-capture
  bool get isConfident => confidence > 0.7;

  /// Get bounding box from corners
  Rect get boundingBox {
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

    return Rect.fromLTRB(minX, minY, maxX, maxY);
  }
}
