import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

import '../core/state/app_providers.dart';
import '../core/theme/app_theme.dart';
import 'review_screen.dart';
import 'photo_import_screen.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  CameraController? _controller;
  bool _initializing = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    final cameraStatus = await Permission.camera.request();
    if (!cameraStatus.isGranted) {
      if (mounted) {
        setState(() {
          _error = 'Camera permission is required for scanning.';
          _initializing = false;
        });
      }
      return;
    }

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        if (mounted) {
          setState(() {
            _error = 'No camera found on this device.';
            _initializing = false;
          });
        }
        return;
      }

      final back = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      final controller = CameraController(
        back,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await controller.initialize();
      if (!mounted) return;

      setState(() {
        _controller = controller;
        _initializing = false;
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _initializing = false;
        });
      }
    }
  }

  Future<void> _capture() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || controller.value.isTakingPicture) {
      return;
    }

    try {
      final image = await controller.takePicture();
      await ref.read(scanSessionControllerProvider.notifier).addCapturedImage(image.path);
      if (!mounted) return;
      Navigator.of(context).pushNamed(ReviewScreen.routeName);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Capture failed: $error')),
      );
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (_initializing) {
      return Center(child: CircularProgressIndicator(color: theme.colorScheme.primary));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingMD),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.no_photography_rounded, color: theme.hintColor, size: 48),
              const SizedBox(height: AppTheme.spacingMD),
              Text(_error!, textAlign: TextAlign.center, style: AppTheme.bodyMedium),
              const SizedBox(height: AppTheme.spacingMD),
              ElevatedButton.icon(
                onPressed: () => openAppSettings(),
                icon: const Icon(Icons.settings_rounded),
                label: const Text('Open Settings'),
              ),
            ],
          ),
        ),
      );
    }

    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return Center(child: Text('Camera unavailable', style: AppTheme.bodyMedium));
    }

    final sessionState = ref.watch(scanSessionControllerProvider);

    return Stack(
      fit: StackFit.expand,
      children: [
        // Camera Preview
        Positioned.fill(child: CameraPreview(controller)),
        
        // UI Overlay
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spacingLG),
            child: Column(
              children: [
                // Top Controls
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Mode indicator
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black45,
                        borderRadius: AppTheme.borderRadiusFull,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bolt_rounded, color: theme.colorScheme.primary, size: 16),
                          const SizedBox(width: 4),
                          Text('AUTO', style: AppTheme.labelSmall.copyWith(color: Colors.white)),
                        ],
                      ),
                    ),
                    // Batch counter
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black45,
                        borderRadius: AppTheme.borderRadiusFull,
                      ),
                      child: Text(
                        '${sessionState.pages.length} pages',
                        style: AppTheme.labelSmall.copyWith(color: Colors.white),
                      ),
                    ),
                  ],
                ),
                
                // Center viewfinder
                Expanded(
                  child: Center(
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.8,
                      height: MediaQuery.of(context).size.height * 0.45,
                      decoration: BoxDecoration(
                        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.8), width: 2),
                        borderRadius: AppTheme.borderRadiusMD,
                      ),
                      child: Stack(
                        children: [
                          // Corner handles
                          Positioned(top: -4, left: -4, child: _buildCornerHandle(theme)),
                          Positioned(top: -4, right: -4, child: _buildCornerHandle(theme)),
                          Positioned(bottom: -4, left: -4, child: _buildCornerHandle(theme)),
                          Positioned(bottom: -4, right: -4, child: _buildCornerHandle(theme)),
                        ],
                      ),
                    ),
                  ),
                ),

                // Bottom Controls
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Gallery shortcut
                    _buildControlButton(
                      icon: Icons.photo_library_rounded,
                      badge: sessionState.pages.isNotEmpty ? '${sessionState.pages.length}' : null,
                      onTap: () {
                        if (sessionState.pages.isNotEmpty) {
                          Navigator.of(context).pushNamed(ReviewScreen.routeName);
                        }
                      },
                      theme: theme,
                    ),

                    // Capture button
                    GestureDetector(
                      onTap: _capture,
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: theme.colorScheme.primary, width: 4),
                          boxShadow: [
                            BoxShadow(
                              color: theme.colorScheme.primary.withOpacity(0.4),
                              blurRadius: 16,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Icon(Icons.camera_alt_rounded, color: theme.colorScheme.primary, size: 32),
                      ),
                    ),

                    // Import button
                    _buildControlButton(
                      icon: Icons.add_photo_alternate_rounded,
                      label: 'Import',
                      isPrimary: true,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const PhotoImportScreen()),
                        );
                      },
                      theme: theme,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCornerHandle(ThemeData theme) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required VoidCallback onTap,
    required ThemeData theme,
    String? badge,
    String? label,
    bool isPrimary = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: isPrimary ? theme.colorScheme.primary : Colors.black38,
                  borderRadius: AppTheme.borderRadiusMD,
                  border: isPrimary ? null : Border.all(color: Colors.white30),
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              if (badge != null)
                Positioned(
                  top: -6,
                  right: -6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Text(badge, style: AppTheme.labelSmall.copyWith(color: Colors.white, fontSize: 10)),
                  ),
                ),
            ],
          ),
          if (label != null) ...[
            const SizedBox(height: 4),
            Text(label, style: AppTheme.labelSmall.copyWith(color: Colors.white70)),
          ],
        ],
      ),
    );
  }
}

