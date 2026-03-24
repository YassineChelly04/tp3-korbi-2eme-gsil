import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/models/scan_filter.dart';
import '../core/services/photo_import_service.dart';
import '../core/theme/app_theme.dart';
import '../core/state/app_providers.dart';
import 'review_screen.dart';

/// Screen for importing photos, adjusting corners, and organizing them
class PhotoImportScreen extends ConsumerStatefulWidget {
  static const routeName = '/photo-import';
  
  const PhotoImportScreen({super.key});

  @override
  ConsumerState<PhotoImportScreen> createState() => _PhotoImportScreenState();
}

class _PhotoImportScreenState extends ConsumerState<PhotoImportScreen> {
  final PhotoImportService _importService = PhotoImportService();
  List<ImportedPhoto> _photos = [];
  int _selectedIndex = 0;
  bool _isLoading = false;
  bool _isProcessing = false;
  ScanFilter _currentFilter = ScanFilter.auto;

  @override
  void initState() {
    super.initState();
    _pickPhotos();
  }

  Future<void> _pickPhotos() async {
    setState(() => _isLoading = true);
    
    try {
      final paths = await _importService.pickMultipleImages();
      
      if (paths.isEmpty) {
        if (mounted) Navigator.of(context).pop();
        return;
      }

      final photos = <ImportedPhoto>[];
      for (final path in paths) {
        final size = await _importService.getImageSize(path);
        if (size != null) {
          final corners = await _importService.detectDocumentCorners(path);
          photos.add(ImportedPhoto(
            originalPath: path,
            corners: corners,
            imageSize: size,
          ));
        }
      }

      setState(() {
        _photos = photos;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error importing photos: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  List<Offset> _defaultCorners(Size size) {
    final margin = 0.05;
    return [
      Offset(size.width * margin, size.height * margin),
      Offset(size.width * (1 - margin), size.height * margin),
      Offset(size.width * (1 - margin), size.height * (1 - margin)),
      Offset(size.width * margin, size.height * (1 - margin)),
    ];
  }

  void _updateCorner(int cornerIndex, Offset newPosition) {
    if (_selectedIndex >= _photos.length) return;
    
    final photo = _photos[_selectedIndex];
    final newCorners = List<Offset>.from(photo.corners);
    
    // Clamp to image bounds
    newCorners[cornerIndex] = Offset(
      newPosition.dx.clamp(0, photo.imageSize.width),
      newPosition.dy.clamp(0, photo.imageSize.height),
    );
    
    setState(() {
      _photos[_selectedIndex] = photo.copyWith(corners: newCorners);
    });
  }

  void _reorderPhotos(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex--;
      final photo = _photos.removeAt(oldIndex);
      _photos.insert(newIndex, photo);
    });
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
      if (_selectedIndex >= _photos.length && _photos.isNotEmpty) {
        _selectedIndex = _photos.length - 1;
      }
    });
  }

  Future<void> _processAndContinue() async {
    if (_photos.isEmpty) return;
    
    setState(() => _isProcessing = true);
    
    try {
      // Process each photo and add to scan session
      for (int i = 0; i < _photos.length; i++) {
        final photo = _photos[i];
        
        // First crop to corners
        final croppedPath = await _importService.cropToCorners(
          sourcePath: photo.originalPath,
          corners: photo.corners,
          outputName: 'import_crop_$i',
        );
        
        // Then apply filter
        final processedPath = await _importService.processImportedImage(
          sourcePath: croppedPath,
          filter: _currentFilter,
          outputName: 'import_final_$i',
        );
        
        // Add to scan session
        await ref.read(scanSessionControllerProvider.notifier).addCapturedImage(processedPath);
      }
      
      if (mounted) {
        Navigator.of(context).pushReplacementNamed(ReviewScreen.routeName);
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error processing photos: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundDark,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: AppTheme.primaryBlue),
              const SizedBox(height: AppTheme.spacingMD),
              Text(
                'Loading photos...',
                style: GoogleFonts.inter(color: AppTheme.textPrimary),
              ),
            ],
          ),
        ),
      );
    }

    if (_photos.isEmpty) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundDark,
        body: Center(
          child: Text(
            'No photos selected',
            style: GoogleFonts.inter(color: AppTheme.textPrimary),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundDark,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppTheme.primaryBlue),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Import Photos (${_photos.length})',
          style: GoogleFonts.inter(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          if (_isProcessing)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: AppTheme.primaryBlue,
                  strokeWidth: 2,
                ),
              ),
            )
          else
            TextButton(
              onPressed: _processAndContinue,
              child: Text(
                'Done',
                style: GoogleFonts.inter(
                  color: AppTheme.primaryBlue,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Main preview with corner adjustment
          Expanded(
            flex: 3,
            child: _buildPreviewWithCorners(),
          ),
          
          // Filter selector
          _buildFilterSelector(),
          
          // Reorderable thumbnail list
          Container(
            height: 120,
            padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSM),
            child: _buildThumbnailList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewWithCorners() {
    if (_selectedIndex >= _photos.length) return const SizedBox();
    
    final photo = _photos[_selectedIndex];
    
    return Container(
      margin: const EdgeInsets.all(AppTheme.spacingMD),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: AppTheme.borderRadiusMD,
      ),
      child: ClipRRect(
        borderRadius: AppTheme.borderRadiusMD,
        child: LayoutBuilder(
          builder: (context, constraints) {
            // Calculate scale to fit image in container
            final imageAspect = photo.imageSize.width / photo.imageSize.height;
            final containerAspect = constraints.maxWidth / constraints.maxHeight;
            
            double scale;
            double offsetX = 0;
            double offsetY = 0;
            
            if (imageAspect > containerAspect) {
              scale = constraints.maxWidth / photo.imageSize.width;
              offsetY = (constraints.maxHeight - photo.imageSize.height * scale) / 2;
            } else {
              scale = constraints.maxHeight / photo.imageSize.height;
              offsetX = (constraints.maxWidth - photo.imageSize.width * scale) / 2;
            }
            
            return Stack(
              children: [
                // Image
                Positioned.fill(
                  child: Image.file(
                    File(photo.originalPath),
                    fit: BoxFit.contain,
                  ),
                ),
                
                // Corner overlay
                CustomPaint(
                  size: Size(constraints.maxWidth, constraints.maxHeight),
                  painter: CornerOverlayPainter(
                    corners: photo.corners,
                    scale: scale,
                    offset: Offset(offsetX, offsetY),
                  ),
                ),
                
                // Draggable corners
                for (int i = 0; i < 4; i++)
                  _buildDraggableCorner(i, photo, scale, offsetX, offsetY),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildDraggableCorner(
    int index,
    ImportedPhoto photo,
    double scale,
    double offsetX,
    double offsetY,
  ) {
    final corner = photo.corners[index];
    final screenPos = Offset(
      corner.dx * scale + offsetX,
      corner.dy * scale + offsetY,
    );
    
    return Positioned(
      left: screenPos.dx - 20,
      top: screenPos.dy - 20,
      child: GestureDetector(
        onPanUpdate: (details) {
          final newScreenPos = screenPos + details.delta;
          final newImagePos = Offset(
            (newScreenPos.dx - offsetX) / scale,
            (newScreenPos.dy - offsetY) / scale,
          );
          _updateCorner(index, newImagePos);
        },
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue.withOpacity(0.8),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(Icons.drag_indicator, color: Colors.white, size: 20),
        ),
      ),
    );
  }

  Widget _buildFilterSelector() {
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMD),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: ScanFilter.values.length,
        itemBuilder: (context, index) {
          final filter = ScanFilter.values[index];
          final isSelected = filter == _currentFilter;
          
          return GestureDetector(
            onTap: () => setState(() => _currentFilter = filter),
            child: Container(
              width: 70,
              margin: const EdgeInsets.only(right: AppTheme.spacingSM),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primaryBlueContainer : AppTheme.surfaceLight,
                borderRadius: AppTheme.borderRadiusSM,
                border: isSelected 
                  ? Border.all(color: AppTheme.primaryBlue, width: 2)
                  : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _getFilterIcon(filter),
                    color: isSelected ? Colors.white : AppTheme.textSecondary,
                    size: 24,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    filter.label,
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 10,
                      color: isSelected ? Colors.white : AppTheme.textSecondary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  IconData _getFilterIcon(ScanFilter filter) {
    switch (filter) {
      case ScanFilter.auto:
        return Icons.auto_awesome;
      case ScanFilter.grayscale:
        return Icons.filter_b_and_w;
      case ScanFilter.blackWhite:
        return Icons.contrast;
      case ScanFilter.original:
        return Icons.image;
      case ScanFilter.colorPop:
        return Icons.palette;
      case ScanFilter.magicEnhance:
        return Icons.auto_fix_high;
      case ScanFilter.document:
        return Icons.description;
      case ScanFilter.whiteboard:
        return Icons.dashboard;
    }
  }

  Widget _buildThumbnailList() {
    return ReorderableListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMD),
      itemCount: _photos.length,
      onReorder: _reorderPhotos,
      proxyDecorator: (child, index, animation) {
        return Material(
          color: Colors.transparent,
          child: ScaleTransition(
            scale: animation.drive(Tween(begin: 1.0, end: 1.05)),
            child: child,
          ),
        );
      },
      itemBuilder: (context, index) {
        final photo = _photos[index];
        final isSelected = index == _selectedIndex;
        
        return GestureDetector(
          key: ValueKey(photo.originalPath),
          onTap: () => setState(() => _selectedIndex = index),
          child: Container(
            width: 80,
            margin: const EdgeInsets.only(right: AppTheme.spacingSM),
            decoration: BoxDecoration(
              borderRadius: AppTheme.borderRadiusSM,
              border: isSelected 
                ? Border.all(color: AppTheme.primaryBlue, width: 3)
                : Border.all(color: AppTheme.surfaceLight, width: 2),
            ),
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: AppTheme.borderRadiusSM,
                  child: Image.file(
                    File(photo.originalPath),
                    fit: BoxFit.cover,
                    width: 80,
                    height: 100,
                  ),
                ),
                // Page number
                Positioned(
                  bottom: 4,
                  left: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: AppTheme.borderRadiusXS,
                    ),
                    child: Text(
                      '${index + 1}',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 10,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                // Delete button
                Positioned(
                  top: 2,
                  right: 2,
                  child: GestureDetector(
                    onTap: () => _removePhoto(index),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.black54,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, color: Colors.white, size: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Paints the corner overlay connecting lines
class CornerOverlayPainter extends CustomPainter {
  final List<Offset> corners;
  final double scale;
  final Offset offset;

  CornerOverlayPainter({
    required this.corners,
    required this.scale,
    required this.offset,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (corners.length != 4) return;
    
    final paint = Paint()
      ..color = AppTheme.primaryBlue.withOpacity(0.8)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    
    final fillPaint = Paint()
      ..color = AppTheme.primaryBlue.withOpacity(0.1)
      ..style = PaintingStyle.fill;
    
    final scaledCorners = corners.map((c) => 
      Offset(c.dx * scale + offset.dx, c.dy * scale + offset.dy)
    ).toList();
    
    final path = Path()
      ..moveTo(scaledCorners[0].dx, scaledCorners[0].dy)
      ..lineTo(scaledCorners[1].dx, scaledCorners[1].dy)
      ..lineTo(scaledCorners[2].dx, scaledCorners[2].dy)
      ..lineTo(scaledCorners[3].dx, scaledCorners[3].dy)
      ..close();
    
    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CornerOverlayPainter oldDelegate) {
    return corners != oldDelegate.corners ||
           scale != oldDelegate.scale ||
           offset != oldDelegate.offset;
  }
}
