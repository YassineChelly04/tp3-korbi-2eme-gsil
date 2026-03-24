import '../models/folder_record.dart';
import 'database_service.dart';

class FolderRepository {
  FolderRepository({DatabaseService? databaseService})
      : _databaseService = databaseService ?? DatabaseService.instance;

  final DatabaseService _databaseService;

  Future<List<FolderRecord>> getAll() async {
    final db = await _databaseService.database;
    final maps = await db.query('folders', orderBy: 'updated_at DESC');
    return maps.map(FolderRecord.fromMap).toList(growable: false);
  }

  Future<void> create(String id, String name) async {
    final db = await _databaseService.database;
    final now = DateTime.now().millisecondsSinceEpoch;
    await db.insert('folders', {
      'id': id,
      'name': name,
      'created_at': now,
      'updated_at': now,
    });
  }
}

