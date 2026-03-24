import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/models/document_record.dart';
import '../core/state/app_providers.dart';
import '../core/theme/app_theme.dart';
import 'document_detail_screen.dart';

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(libraryControllerProvider);
    final items = state.isSearching
      ? state.searchResults.map((result) => result.document).toList(growable: false)
      : state.documents;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: AppTheme.spacingLG),
          // Search Bar
          Container(
            height: 52,
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: AppTheme.borderRadiusFull,
              border: Border.all(color: theme.dividerColor),
            ),
            child: TextField(
              onChanged: ref.read(libraryControllerProvider.notifier).onSearchChanged,
              style: AppTheme.bodyMedium.copyWith(color: theme.colorScheme.onSurface),
              decoration: InputDecoration(
                prefixIcon: Icon(Icons.search_rounded, color: theme.colorScheme.primary),
                hintText: 'Search documents...',
                hintStyle: AppTheme.bodyMedium.copyWith(color: theme.hintColor),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacingMD),
          // Sort Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(icon: Icons.schedule_rounded, label: 'Recent', isActive: true),
                const SizedBox(width: 8),
                _FilterChip(icon: Icons.sort_by_alpha_rounded, label: 'Name', isActive: false),
                const SizedBox(width: 8),
                _FilterChip(icon: Icons.storage_rounded, label: 'Size', isActive: false),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacingLG),
          // Document Grid
          Expanded(
            child: state.isLoading
                ? Center(child: CircularProgressIndicator(color: theme.colorScheme.primary))
                : items.isEmpty
                    ? _buildEmptyState(theme)
                    : RefreshIndicator(
                        color: theme.colorScheme.primary,
                        onRefresh: () => ref.read(libraryControllerProvider.notifier).load(),
                        child: GridView.builder(
                          padding: const EdgeInsets.only(bottom: AppTheme.spacingLG),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: AppTheme.spacingMD,
                            crossAxisSpacing: AppTheme.spacingMD,
                            childAspectRatio: 0.75,
                          ),
                          itemCount: items.length,
                          itemBuilder: (context, index) => _DocumentCard(document: items[index]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.folder_open_rounded, color: theme.colorScheme.primary, size: 40),
          ),
          const SizedBox(height: AppTheme.spacingLG),
          Text('No documents yet', style: AppTheme.headingSmall.copyWith(color: theme.colorScheme.onSurface)),
          const SizedBox(height: AppTheme.spacingXS),
          Text(
            'Scan your first document to get started',
            style: AppTheme.bodyMedium.copyWith(color: theme.hintColor),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;

  const _FilterChip({
    required this.icon,
    required this.label,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isActive ? theme.colorScheme.primary : theme.cardColor,
        borderRadius: AppTheme.borderRadiusFull,
        border: isActive ? null : Border.all(color: theme.dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: isActive ? Colors.white : theme.colorScheme.onSurface.withOpacity(0.7)),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTheme.labelSmall.copyWith(
              color: isActive ? Colors.white : theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final DocumentRecord document;

  const _DocumentCard({required this.document});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.of(context).pushNamed(
            DocumentDetailScreen.routeName,
            arguments: document,
          );
        },
        borderRadius: AppTheme.borderRadiusMD,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Thumbnail
            Expanded(
              child: Container(
                color: theme.colorScheme.primary.withOpacity(0.1),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Center(
                      child: Icon(
                        Icons.picture_as_pdf_rounded,
                        color: theme.colorScheme.primary.withOpacity(0.5),
                        size: 48,
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: AppTheme.borderRadiusFull,
                        ),
                        child: Text(
                          '${document.pageCount} pg',
                          style: AppTheme.labelSmall.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Details
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    document.name,
                    style: AppTheme.labelLarge.copyWith(color: theme.colorScheme.onSurface),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatDate(document.createdAt),
                    style: AppTheme.labelSmall.copyWith(color: theme.hintColor),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

