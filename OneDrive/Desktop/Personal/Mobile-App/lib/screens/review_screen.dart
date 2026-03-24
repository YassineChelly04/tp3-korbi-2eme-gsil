import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/models/scan_filter.dart';
import '../core/state/app_providers.dart';
import '../core/theme/app_theme.dart';

class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({super.key});

  static const String routeName = '/review';

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  final TextEditingController _nameController = TextEditingController(
    text: 'Scan ${DateTime.now().toIso8601String().split('T').first}',
  );
  bool _isSaving = false;

  Future<void> _save() async {
    if (_isSaving) return;
    
    final session = ref.read(scanSessionControllerProvider);
    if (session.pages.isEmpty) return;

    setState(() => _isSaving = true);

    try {
      await ref.read(scanSessionControllerProvider.notifier).saveDocument(
        name: _nameController.text.trim().isEmpty ? 'Untitled Scan' : _nameController.text.trim(),
        folderId: 'inbox',
      );

      await ref.read(libraryControllerProvider.notifier).load();

      if (!mounted) return;

      final latest = ref.read(scanSessionControllerProvider);
      if (latest.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(latest.error!), backgroundColor: AppTheme.error),
        );
        return;
      }

      Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final session = ref.watch(scanSessionControllerProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: theme.colorScheme.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Review Pages', style: AppTheme.headingSmall),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingLG),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Document name
            TextField(
              controller: _nameController,
              style: AppTheme.bodyMedium,
              decoration: InputDecoration(
                prefixIcon: Icon(Icons.description_rounded, color: theme.colorScheme.primary),
                labelText: 'Document name',
                filled: true,
                fillColor: theme.cardColor,
                border: OutlineInputBorder(borderRadius: AppTheme.borderRadiusMD, borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: AppTheme.spacingMD),

            // Filter selector
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<ScanFilter>(
                        value: session.filter,
                        style: AppTheme.bodyMedium.copyWith(color: theme.colorScheme.onSurface),
                        icon: Icon(Icons.keyboard_arrow_down_rounded, color: theme.colorScheme.primary),
                        items: ScanFilter.values.map((filter) => DropdownMenuItem(
                          value: filter,
                          child: Row(
                            children: [
                              Icon(_filterIcon(filter), color: theme.colorScheme.primary, size: 18),
                              const SizedBox(width: 8),
                              Text(filter.label),
                            ],
                          ),
                        )).toList(),
                        onChanged: session.isReprocessing ? null : (value) {
                          if (value != null) {
                            ref.read(scanSessionControllerProvider.notifier).updateFilter(value);
                          }
                        },
                        decoration: const InputDecoration(
                          labelText: 'Enhancement filter',
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    if (session.isReprocessing)
                      SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.primary),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingLG),

            // Page count
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                borderRadius: AppTheme.borderRadiusFull,
              ),
              child: Text(
                '${session.pages.length} ${session.pages.length == 1 ? 'page' : 'pages'}',
                style: AppTheme.labelSmall.copyWith(color: theme.colorScheme.primary),
              ),
            ),
            const SizedBox(height: AppTheme.spacingSM),

            // Page list
            Expanded(
              child: session.pages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.document_scanner_rounded, color: theme.hintColor, size: 48),
                          const SizedBox(height: AppTheme.spacingSM),
                          Text('No captured pages yet', style: AppTheme.bodyMedium.copyWith(color: theme.hintColor)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      itemCount: session.pages.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final path = session.pages[index];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: AppTheme.borderRadiusSM,
                                  child: Image.file(
                                    File(path),
                                    width: 64, height: 64,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(
                                      width: 64, height: 64,
                                      color: theme.cardColor,
                                      child: Icon(Icons.broken_image_rounded, color: theme.hintColor),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Page ${index + 1}', style: AppTheme.labelLarge),
                                      const SizedBox(height: 4),
                                      Text(session.filter.label, style: AppTheme.bodySmall.copyWith(color: theme.hintColor)),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  onPressed: () => ref.read(scanSessionControllerProvider.notifier).removePage(index),
                                  icon: Icon(Icons.delete_outline_rounded, color: AppTheme.error),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: AppTheme.spacingMD),

            // Save button
            ElevatedButton.icon(
              onPressed: (session.isSaving || _isSaving) ? null : _save,
              icon: (session.isSaving || _isSaving)
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save_rounded),
              label: Text('Save as PDF', style: AppTheme.buttonText),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusMD),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _filterIcon(ScanFilter filter) {
    switch (filter) {
      case ScanFilter.auto: return Icons.auto_fix_high_rounded;
      case ScanFilter.grayscale: return Icons.gradient_rounded;
      case ScanFilter.blackWhite: return Icons.contrast_rounded;
      case ScanFilter.original: return Icons.image_rounded;
      case ScanFilter.colorPop: return Icons.palette_rounded;
      case ScanFilter.magicEnhance: return Icons.auto_awesome_rounded;
      case ScanFilter.document: return Icons.description_rounded;
      case ScanFilter.whiteboard: return Icons.dashboard_rounded;
    }
  }
}

