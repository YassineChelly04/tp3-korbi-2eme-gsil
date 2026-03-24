import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';

import '../core/services/ocr_service.dart';
import '../core/theme/app_theme.dart';

/// Screen for viewing and editing OCR results
class OcrEditorScreen extends StatefulWidget {
  final String imagePath;
  final String? documentName;

  const OcrEditorScreen({
    super.key,
    required this.imagePath,
    this.documentName,
  });

  static const String routeName = '/ocr-editor';

  @override
  State<OcrEditorScreen> createState() => _OcrEditorScreenState();
}

class _OcrEditorScreenState extends State<OcrEditorScreen> {
  final OcrService _ocrService = OcrService();
  final TextEditingController _textController = TextEditingController();
  
  bool _isProcessing = true;
  bool _isEditing = false;
  String? _error;
  OcrResult? _ocrResult;

  @override
  void initState() {
    super.initState();
    _runOcr();
  }

  Future<void> _runOcr() async {
    setState(() {
      _isProcessing = true;
      _error = null;
    });

    try {
      final result = await _ocrService.readPageWithBlocks(widget.imagePath);
      _textController.text = result.fullText;
      setState(() {
        _ocrResult = result;
        _isProcessing = false;
      });
    } catch (e) {
      setState(() {
        _error = 'OCR failed: $e';
        _isProcessing = false;
      });
    }
  }

  void _copyToClipboard() {
    Clipboard.setData(ClipboardData(text: _textController.text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied to clipboard', style: AppTheme.bodyMedium),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusSM),
      ),
    );
  }

  Future<void> _shareText() async {
    await Share.share(
      _textController.text,
      subject: widget.documentName ?? 'Scanned Text',
    );
  }

  Future<void> _saveAsTextFile() async {
    // Save as .txt file
    try {
      final directory = Directory.systemTemp;
      final fileName = '${widget.documentName ?? 'scan'}_ocr.txt';
      final file = File('${directory.path}/$fileName');
      await file.writeAsString(_textController.text);
      
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: widget.documentName ?? 'Scanned Text',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving file: $e'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _ocrService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.colorScheme.surface,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: theme.colorScheme.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'OCR Text',
          style: AppTheme.headingSmall.copyWith(color: theme.colorScheme.onSurface),
        ),
        actions: [
          if (!_isProcessing && _error == null) ...[
            IconButton(
              icon: Icon(Icons.copy_rounded, color: theme.colorScheme.primary),
              onPressed: _copyToClipboard,
              tooltip: 'Copy',
            ),
            IconButton(
              icon: Icon(Icons.share_rounded, color: theme.colorScheme.primary),
              onPressed: _shareText,
              tooltip: 'Share',
            ),
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: theme.colorScheme.primary),
              shape: RoundedRectangleBorder(borderRadius: AppTheme.borderRadiusMD),
              onSelected: (value) {
                switch (value) {
                  case 'save':
                    _saveAsTextFile();
                    break;
                  case 'rerun':
                    _runOcr();
                    break;
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'save',
                  child: Row(
                    children: [
                      const Icon(Icons.save_alt_rounded, size: 20),
                      const SizedBox(width: 12),
                      Text('Save as text file', style: AppTheme.bodyMedium),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'rerun',
                  child: Row(
                    children: [
                      const Icon(Icons.refresh_rounded, size: 20),
                      const SizedBox(width: 12),
                      Text('Re-run OCR', style: AppTheme.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
      body: _buildBody(theme, isDark),
      floatingActionButton: !_isProcessing && _error == null
          ? FloatingActionButton.extended(
              onPressed: () {
                setState(() => _isEditing = !_isEditing);
              },
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: Colors.white,
              icon: Icon(_isEditing ? Icons.check_rounded : Icons.edit_rounded),
              label: Text(_isEditing ? 'Done' : 'Edit', style: AppTheme.buttonText),
            )
          : null,
    );
  }

  Widget _buildBody(ThemeData theme, bool isDark) {
    if (_isProcessing) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 60,
              height: 60,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Recognizing text...',
              style: AppTheme.bodyLarge.copyWith(color: theme.colorScheme.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              'This may take a moment',
              style: AppTheme.bodySmall.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.error),
              const SizedBox(height: 16),
              Text(
                'OCR Failed',
                style: AppTheme.headingSmall.copyWith(color: theme.colorScheme.onSurface),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: AppTheme.bodyMedium.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.7)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _runOcr,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    final text = _textController.text;
    if (text.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.text_snippet_outlined,
              size: 64,
              color: theme.colorScheme.onSurface.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No text found',
              style: AppTheme.headingSmall.copyWith(color: theme.colorScheme.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              'The image doesn\'t contain any recognizable text',
              style: AppTheme.bodyMedium.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Image preview (collapsed)
        Container(
          height: 120,
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: AppTheme.borderRadiusMD,
            border: Border.all(color: theme.dividerColor),
          ),
          child: ClipRRect(
            borderRadius: AppTheme.borderRadiusMD,
            child: Image.file(
              File(widget.imagePath),
              fit: BoxFit.cover,
              width: double.infinity,
            ),
          ),
        ),
        
        // Stats bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              _buildStatChip(
                theme,
                Icons.text_fields_rounded,
                '${text.split(RegExp(r'\s+')).length} words',
              ),
              const SizedBox(width: 12),
              _buildStatChip(
                theme,
                Icons.format_list_numbered_rounded,
                '${text.split('\n').length} lines',
              ),
              const SizedBox(width: 12),
              _buildStatChip(
                theme,
                Icons.view_agenda_rounded,
                '${_ocrResult?.blocks.length ?? 0} blocks',
              ),
            ],
          ),
        ),
        
        const Divider(height: 1),
        
        // Text content
        Expanded(
          child: _isEditing
              ? Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    controller: _textController,
                    maxLines: null,
                    expands: true,
                    textAlignVertical: TextAlignVertical.top,
                    style: AppTheme.bodyMedium.copyWith(
                      color: theme.colorScheme.onSurface,
                      height: 1.6,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Edit recognized text...',
                      hintStyle: AppTheme.bodyMedium.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.4),
                      ),
                      filled: true,
                      fillColor: isDark ? AppTheme.surfaceLight : AppTheme.surfaceLightAlt,
                      border: OutlineInputBorder(
                        borderRadius: AppTheme.borderRadiusMD,
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: SelectableText(
                    text,
                    style: AppTheme.bodyMedium.copyWith(
                      color: theme.colorScheme.onSurface,
                      height: 1.6,
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildStatChip(ThemeData theme, IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.1),
        borderRadius: AppTheme.borderRadiusFull,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTheme.labelSmall.copyWith(color: theme.colorScheme.primary),
          ),
        ],
      ),
    );
  }
}
