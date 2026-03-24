import 'package:sqflite/sqflite.dart';

import '../models/document_record.dart';
import '../models/document_page_record.dart';
import '../models/search_result.dart';
import 'database_service.dart';

class DocumentRepository {
  DocumentRepository({DatabaseService? databaseService})
      : _databaseService = databaseService ?? DatabaseService.instance;

  final DatabaseService _databaseService;

  Future<void> upsert(DocumentRecord record) async {
    final db = await _databaseService.database;
    await db.insert(
      'documents',
      record.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<DocumentRecord>> list({String folderId = DatabaseService.defaultFolderId}) async {
    final db = await _databaseService.database;
    final rows = await db.query(
      'documents',
      where: 'folder_id = ?',
      whereArgs: [folderId],
      orderBy: 'updated_at DESC',
    );
    return rows.map(DocumentRecord.fromMap).toList(growable: false);
  }

  Future<DocumentRecord?> getById(String id) async {
    final db = await _databaseService.database;
    final rows = await db.query('documents', where: 'id = ?', whereArgs: [id], limit: 1);
    if (rows.isEmpty) {
      return null;
    }
    return DocumentRecord.fromMap(rows.first);
  }

  Future<void> rename(String id, String newName) async {
    final db = await _databaseService.database;
    await db.update(
      'documents',
      {
        'name': newName,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> updateOcr({
    required String id,
    required String status,
    required String text,
  }) async {
    final db = await _databaseService.database;
    await db.update(
      'documents',
      {
        'ocr_status': status,
        'ocr_text': text,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> savePages({
    required String documentId,
    required List<String> relativePagePaths,
  }) async {
    final db = await _databaseService.database;
    await db.transaction((txn) async {
      await txn.delete('document_pages', where: 'document_id = ?', whereArgs: [documentId]);
      for (var index = 0; index < relativePagePaths.length; index++) {
        await txn.insert('document_pages', {
          'id': '${documentId}_$index',
          'document_id': documentId,
          'page_index': index,
          'relative_path': relativePagePaths[index],
        });
      }
    });
  }

  Future<List<DocumentPageRecord>> getPages(String documentId) async {
    final db = await _databaseService.database;
    final rows = await db.query(
      'document_pages',
      where: 'document_id = ?',
      whereArgs: [documentId],
      orderBy: 'page_index ASC',
    );
    return rows.map(DocumentPageRecord.fromMap).toList(growable: false);
  }

  Future<void> deleteById(String id, Transaction txn) async {
    await txn.delete('documents', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteDocument(
    String id,
    Future<void> Function(List<String> relativePaths) deleteFiles,
  ) async {
    final db = await _databaseService.database;
    await db.transaction((txn) async {
      final existing = await txn.query('documents', where: 'id = ?', whereArgs: [id], limit: 1);
      if (existing.isEmpty) {
        return;
      }
      final pageRows = await txn.query('document_pages', where: 'document_id = ?', whereArgs: [id]);
      final docPath = existing.first['relative_path']! as String;
      final pagePaths = pageRows.map((row) => row['relative_path']! as String).toList(growable: false);
      await deleteFiles([docPath, ...pagePaths]);
      await deleteById(id, txn);
    });
  }

  Future<List<SearchResult>> search(String term) async {
    final db = await _databaseService.database;
    final trimmed = term.trim();
    if (trimmed.isEmpty) {
      return const [];
    }

    // Use simple LIKE search instead of FTS5 (more compatible)
    final searchPattern = '%$trimmed%';
    final rows = await db.rawQuery(
      '''
      SELECT d.*
      FROM documents d
      WHERE d.name LIKE ? OR d.ocr_text LIKE ?
      ORDER BY d.updated_at DESC
      LIMIT 100
      ''',
      [searchPattern, searchPattern],
    );

    return rows
        .map(
          (row) => SearchResult(
            document: DocumentRecord.fromMap(row),
            snippet: _extractSnippet(row['ocr_text'] as String?, trimmed),
          ),
        )
        .toList(growable: false);
  }

  String _extractSnippet(String? text, String term) {
    if (text == null || text.isEmpty) return '';
    final lowerText = text.toLowerCase();
    final lowerTerm = term.toLowerCase();
    final index = lowerText.indexOf(lowerTerm);
    if (index == -1) return '';
    
    final start = (index - 20).clamp(0, text.length);
    final end = (index + term.length + 40).clamp(0, text.length);
    var snippet = text.substring(start, end);
    if (start > 0) snippet = '…$snippet';
    if (end < text.length) snippet = '$snippet…';
    return snippet;
  }
}