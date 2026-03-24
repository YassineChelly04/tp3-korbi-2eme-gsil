import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_theme.dart';
import '../core/state/theme_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final themeMode = ref.watch(themeModeProvider);
    
    return ListView(
      padding: const EdgeInsets.all(AppTheme.spacingLG),
      children: [
        // Appearance Section
        _SectionHeader(icon: Icons.palette_rounded, label: 'Appearance'),
        const SizedBox(height: AppTheme.spacingSM),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: Icon(Icons.dark_mode_rounded, color: theme.colorScheme.primary),
                title: Text('Theme', style: AppTheme.bodyMedium),
                trailing: SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(value: ThemeMode.light, icon: Icon(Icons.light_mode_rounded, size: 18)),
                    ButtonSegment(value: ThemeMode.system, icon: Icon(Icons.brightness_auto_rounded, size: 18)),
                    ButtonSegment(value: ThemeMode.dark, icon: Icon(Icons.dark_mode_rounded, size: 18)),
                  ],
                  selected: {themeMode},
                  onSelectionChanged: (selection) {
                    ref.read(themeModeProvider.notifier).setTheme(selection.first);
                  },
                  showSelectedIcon: false,
                  style: ButtonStyle(
                    visualDensity: VisualDensity.compact,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Scanning Section
        _SectionHeader(icon: Icons.document_scanner_rounded, label: 'Scanning'),
        const SizedBox(height: AppTheme.spacingSM),
        Card(
          child: Column(
            children: [
              _ToggleTile(
                icon: Icons.auto_fix_high_rounded,
                title: 'Auto-Enhance',
                subtitle: 'Automatically adjust contrast & sharpness',
                initialValue: true,
              ),
              const Divider(height: 1),
              _ToggleTile(
                icon: Icons.text_snippet_rounded,
                title: 'Auto-OCR',
                subtitle: 'Run text recognition after each scan',
                initialValue: false,
              ),
              const Divider(height: 1),
              ListTile(
                leading: Icon(Icons.language_rounded, color: theme.hintColor),
                title: Text('OCR Language', style: AppTheme.bodyMedium),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: AppTheme.borderRadiusFull,
                  ),
                  child: Text('English', style: AppTheme.labelSmall.copyWith(color: theme.colorScheme.primary)),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Export Section
        _SectionHeader(icon: Icons.upload_file_rounded, label: 'Export'),
        const SizedBox(height: AppTheme.spacingSM),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: Icon(Icons.picture_as_pdf_rounded, color: theme.hintColor),
                title: Text('Default Format', style: AppTheme.bodyMedium),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: AppTheme.borderRadiusFull,
                  ),
                  child: Text('PDF', style: AppTheme.labelSmall.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: Icon(Icons.straighten_rounded, color: theme.hintColor),
                title: Text('Page Size', style: AppTheme.bodyMedium),
                trailing: Text('A4', style: AppTheme.labelLarge.copyWith(color: theme.colorScheme.primary)),
              ),
              const Divider(height: 1),
              ListTile(
                leading: Icon(Icons.high_quality_rounded, color: theme.hintColor),
                title: Text('JPEG Quality', style: AppTheme.bodyMedium),
                trailing: Text('92%', style: AppTheme.labelLarge.copyWith(color: theme.colorScheme.primary)),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Privacy Section
        _SectionHeader(icon: Icons.shield_rounded, label: 'Privacy'),
        const SizedBox(height: AppTheme.spacingSM),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: Icon(Icons.phonelink_lock_rounded, color: theme.hintColor),
                title: Text('On-Device Processing', style: AppTheme.bodyMedium),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.success.withOpacity(0.15),
                    borderRadius: AppTheme.borderRadiusFull,
                  ),
                  child: Text('ACTIVE', style: AppTheme.labelSmall.copyWith(color: AppTheme.success, fontWeight: FontWeight.bold)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Text(
                  'All scanning, OCR, and PDF generation happens entirely on your device. No data is sent to external servers.',
                  style: AppTheme.bodySmall.copyWith(color: theme.hintColor),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // About Section
        _SectionHeader(icon: Icons.info_rounded, label: 'About'),
        const SizedBox(height: AppTheme.spacingSM),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [theme.colorScheme.primary, theme.colorScheme.primary.withOpacity(0.7)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: AppTheme.borderRadiusMD,
                  ),
                  child: const Icon(Icons.document_scanner_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(height: AppTheme.spacingMD),
                Text('Scanni', style: AppTheme.headingMedium),
                const SizedBox(height: 4),
                Text('Version 1.0.4', style: AppTheme.bodySmall.copyWith(color: theme.hintColor)),
                const SizedBox(height: 8),
                Text(
                  'Intelligent document scanning with on-device OCR',
                  textAlign: TextAlign.center,
                  style: AppTheme.bodySmall.copyWith(color: theme.hintColor),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 40),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String label;

  const _SectionHeader({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.primary, size: 18),
        const SizedBox(width: 8),
        Text(label, style: AppTheme.labelLarge.copyWith(color: theme.colorScheme.primary)),
      ],
    );
  }
}

class _ToggleTile extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool initialValue;

  const _ToggleTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.initialValue,
  });

  @override
  State<_ToggleTile> createState() => _ToggleTileState();
}

class _ToggleTileState extends State<_ToggleTile> {
  late bool _value;

  @override
  void initState() {
    super.initState();
    _value = widget.initialValue;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SwitchListTile(
      secondary: Icon(widget.icon, color: theme.hintColor),
      title: Text(widget.title, style: AppTheme.bodyMedium),
      subtitle: Text(widget.subtitle, style: AppTheme.bodySmall.copyWith(color: theme.hintColor)),
      value: _value,
      onChanged: (v) => setState(() => _value = v),
    );
  }
}

