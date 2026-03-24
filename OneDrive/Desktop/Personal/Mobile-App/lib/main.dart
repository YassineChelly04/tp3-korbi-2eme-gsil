import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/models/document_record.dart';
import 'core/theme/app_theme.dart';
import 'core/storage/database_service.dart';
import 'core/state/theme_provider.dart';
import 'screens/library_screen.dart';
import 'screens/review_screen.dart';
import 'screens/scan_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/document_detail_screen.dart';
import 'screens/photo_import_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Pre-initialize database
  try {
    await DatabaseService.instance.database;
  } catch (e) {
    debugPrint('Database init error: $e - attempting recovery');
    try {
      await DatabaseService.instance.deleteDatabase();
      await DatabaseService.instance.database;
    } catch (e2) {
      debugPrint('Database recovery failed: $e2');
    }
  }
  
  runApp(const ProviderScope(child: ScanniApp()));
}

class ScanniApp extends ConsumerWidget {
  const ScanniApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    
    return MaterialApp(
      title: 'Scanni',
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      theme: AppTheme.getLightTheme(),
      darkTheme: AppTheme.getDarkTheme(),
      routes: {
        ReviewScreen.routeName: (_) => const ReviewScreen(),
        PhotoImportScreen.routeName: (_) => const PhotoImportScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == DocumentDetailScreen.routeName) {
          final args = settings.arguments;
          if (args is DocumentRecord) {
            return MaterialPageRoute(
              builder: (_) => DocumentDetailScreen(document: args),
            );
          }
        }
        return null;
      },
      home: const HomeShell(),
    );
  }
}

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primaryColor = theme.colorScheme.primary;
    final backgroundColor = theme.scaffoldBackgroundColor;
    final surfaceColor = theme.colorScheme.surface;
    
    final screens = [
      const ScanScreen(),
      const LibraryScreen(),
      const SettingsScreen(),
    ];

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: Container(
          decoration: BoxDecoration(
            color: surfaceColor,
            border: Border(bottom: BorderSide(color: theme.dividerColor.withOpacity(0.1))),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Icon(Icons.document_scanner_rounded, color: primaryColor, size: 28),
                      const SizedBox(width: 12),
                      Text(
                        'Scanni',
                        style: AppTheme.headingMedium.copyWith(color: primaryColor),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      // Theme toggle
                      IconButton(
                        icon: Icon(
                          isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                          color: primaryColor,
                        ),
                        onPressed: () => ref.read(themeModeProvider.notifier).toggleTheme(),
                      ),
                      IconButton(
                        icon: Icon(Icons.settings_outlined, color: primaryColor),
                        onPressed: () => setState(() => _currentIndex = 2),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          border: Border(top: BorderSide(color: theme.dividerColor.withOpacity(0.1))),
          boxShadow: isDark ? null : [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(context, index: 0, icon: Icons.document_scanner_rounded, label: 'Scan'),
                _buildNavItem(context, index: 1, icon: Icons.folder_rounded, label: 'Documents'),
                _buildNavItem(context, index: 2, icon: Icons.settings_rounded, label: 'Settings'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, {required int index, required IconData icon, required String label}) {
    final theme = Theme.of(context);
    final isActive = _currentIndex == index;
    final primaryColor = theme.colorScheme.primary;
    final inactiveColor = theme.colorScheme.onSurface.withOpacity(0.5);
    final color = isActive ? primaryColor : inactiveColor;
    
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? primaryColor.withOpacity(0.1) : Colors.transparent,
          borderRadius: AppTheme.borderRadiusFull,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: AppTheme.labelSmall.copyWith(
                color: color,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
