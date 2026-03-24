import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../core/models/document_record.dart';
import '../core/state/app_providers.dart';
import '../core/theme/app_theme.dart';
import 'ocr_editor_screen.dart';

class DocumentDetailScreen extends ConsumerStatefulWidget {
  const DocumentDetailScreen({super.key, required this.document});

  static const String routeName = '/document-detail';

  final DocumentRecord document;

  @override
  ConsumerState<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends ConsumerState<DocumentDetailScreen> {
  late DocumentRecord _document;
  bool _working = false;
  String? _firstPagePath;

  @override
  void initState() {
    super.initState();
    _document = widget.document;
    _loadFirstPage();
  }

  Future<void> _loadFirstPage() async {
    final repository = ref.read(documentRepositoryProvider);
    final pages = await repository.getPages(_document.id);
    if (pages.isNotEmpty && mounted) {
      final fileService = ref.read(fileServiceProvider);
      final path = await fileService.absoluteFromRelative(pages.first.relativePath);
      setState(() => _firstPagePath = path);
    }
  }

  Future<void> _rename() async {
    final theme = Theme.of(context);
    final controller = TextEditingController(text: _document.name);
    final newName = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusLG),
        title: Text('Rename document', style: AppTheme.headingSmall),
        content: TextField(
          controller: controller,
          style: AppTheme.bodyMedium,
          decoration: const InputDecoration(hintText: 'Enter new name'),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (newName == null || newName.isEmpty) return;

    await ref.read(libraryControllerProvider.notifier).rename(_document.id, newName);
    if (!mounted) return;
    setState(() {
      _document = _document.copyWith(name: newName, updatedAt: DateTime.now());
    });
  }

  Future<void> _sharePdf() async {
    final fileService = ref.read(fileServiceProvider);
    final absolutePath = await fileService.absoluteFromRelative(_document.relativePath);
    await Share.shareXFiles([XFile(absolutePath)], text: _document.name);
  }

  Future<void> _shareSinglePageJpeg() async {
    if (_document.pageCount != 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('JPEG export is available for single-page scans only.', style: AppTheme.bodyMedium),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusSM),
        ),
      );
      return;
    }

    final repository = ref.read(documentRepositoryProvider);
    final pages = await repository.getPages(_document.id);
    if (pages.isEmpty) return;

    final fileService = ref.read(fileServiceProvider);
    final absolutePath = await fileService.absoluteFromRelative(pages.first.relativePath);
    await Share.shareXFiles([XFile(absolutePath)], text: '${_document.name} (JPEG)');
  }

  Future<void> _openOcrEditor() async {
    if (_firstPagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Loading document...', style: AppTheme.bodyMedium),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OcrEditorScreen(
          imagePath: _firstPagePath!,
          documentName: _document.name,
        ),
      ),
    );
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusLG),
        title: Text('Delete document?', style: AppTheme.headingSmall),
        content: Text(
          'This will delete the PDF and all page images from local storage.',
          style: AppTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _working = true);
    await ref.read(scanPipelineServiceProvider).deleteDocument(_document);
    await ref.read(libraryControllerProvider.notifier).load();

    if (!mounted) return;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final sizeMb = (_document.fileSize / (1024 * 1024)).toStringAsFixed(2);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: theme.colorScheme.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(_document.name, style: AppTheme.headingSmall, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            onPressed: _working ? null : _rename,
            icon: Icon(Icons.edit_rounded, color: theme.colorScheme.primary),
          ),
          IconButton(
            onPressed: _working ? null : _delete,
            icon: Icon(Icons.delete_outline_rounded, color: _working ? theme.disabledColor : AppTheme.error),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _InfoRow(icon: Icons.description_rounded, label: 'Pages', value: '${_document.pageCount}'),
                    Divider(color: theme.dividerColor, height: 24),
                    _InfoRow(
                      icon: Icons.text_snippet_rounded,
                      label: 'OCR Status',
                      value: _document.ocrStatus.toUpperCase(),
                      valueColor: _ocrStatusColor(_document.ocrStatus),
                    ),
                    Divider(color: theme.dividerColor, height: 24),
                    _InfoRow(icon: Icons.storage_rounded, label: 'Size', value: '$sizeMb MB'),
                    Divider(color: theme.dividerColor, height: 24),
                    _InfoRow(
                      icon: Icons.schedule_rounded,
                      label: 'Updated',
                      value: _formatDate(_document.updatedAt),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    icon: Icons.share_rounded,
                    label: 'Share PDF',
                    onTap: _working ? null : _sharePdf,
                    isPrimary: true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionButton(
                    icon: Icons.image_rounded,
                    label: 'Share JPEG',
                    onTap: _working ? null : _shareSinglePageJpeg,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // OCR Button - Run on demand
            SizedBox(
              width: double.infinity,
              child: _ActionButton(
                icon: Icons.document_scanner_rounded,
                label: 'Extract Text (OCR)',
                onTap: _openOcrEditor,
                isPrimary: true,
              ),
            ),
            const SizedBox(height: 24),

            // OCR Preview
            Row(
              children: [
                Icon(Icons.text_snippet_rounded, color: theme.colorScheme.primary, size: 18),
                const SizedBox(width: 8),
                Text('OCR Text Preview', style: AppTheme.labelLarge.copyWith(color: theme.colorScheme.primary)),
              ],
            ),
            const SizedBox(height: 12),

            // OCR Text Content
            Card(
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(minHeight: 150),
                padding: const EdgeInsets.all(16),
                child: _document.ocrText.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.text_snippet_outlined, size: 40, color: theme.disabledColor),
                            const SizedBox(height: 12),
                            Text(
                              'No OCR text yet',
                              style: AppTheme.bodyMedium.copyWith(color: theme.disabledColor),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Tap "Extract Text" to run OCR',
                              style: AppTheme.bodySmall.copyWith(color: theme.disabledColor),
                            ),
                          ],
                        ),
                      )
                    : SelectableText(
                        _document.ocrText.length > 500
                            ? '${_document.ocrText.substring(0, 500)}...'
                            : _document.ocrText,
                        style: AppTheme.bodyMedium.copyWith(height: 1.6),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  Color _ocrStatusColor(String status) {
    switch (status) {
      case 'complete':
        return AppTheme.success;
      case 'processing':
        return AppTheme.warning;
      case 'partial':
        return AppTheme.error;
      default:
        return Colors.grey;
    }
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.primary.withOpacity(0.7), size: 20),
        const SizedBox(width: 12),
        Text(label, style: AppTheme.bodyMedium.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
        const Spacer(),
        Text(
          value,
          style: AppTheme.labelLarge.copyWith(color: valueColor ?? theme.colorScheme.onSurface),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool isPrimary;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (isPrimary) {
      return ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(label, style: AppTheme.buttonText),
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusMD),
        ),
      );
    }
    
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label, style: AppTheme.buttonText),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusMD),
      ),
    );
  }
}

