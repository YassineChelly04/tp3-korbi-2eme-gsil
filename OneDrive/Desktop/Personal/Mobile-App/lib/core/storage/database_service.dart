import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseService {
  DatabaseService._();

  static final DatabaseService instance = DatabaseService._();

  static const String defaultFolderId = 'inbox';
  static const String defaultFolderName = 'Inbox';

  Database? _database;

  Future<Database> get database async {
    if (_database != null) {
      return _database!;
    }
    _database = await _open();
    return _database!;
  }

  Future<void> deleteDatabase() async {
    final appDir = await getApplicationSupportDirectory();
    final dbPath = p.join(appDir.path, 'scanni.db');
    await databaseFactory.deleteDatabase(dbPath);
    _database = null;
  }

  Future<Database> _open() async {
    final appDir = await getApplicationSupportDirectory();
    final dbPath = p.join(appDir.path, 'scanni.db');
    return openDatabase(
      dbPath,
      version: 2,  // Bumped version to force recreation
      onConfigure: (db) async {
        await db.execute('PRAGMA foreign_keys = ON');
      },
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE documents (
            id TEXT PRIMARY KEY,
            folder_id TEXT NOT NULL REFERENCES folders(id),
            name TEXT NOT NULL,
            relative_path TEXT NOT NULL,
            page_count INTEGER NOT NULL DEFAULT 1,
            file_size INTEGER NOT NULL,
            ocr_status TEXT NOT NULL DEFAULT 'pending',
            ocr_text TEXT,
            filter_used TEXT NOT NULL DEFAULT 'auto',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE document_pages (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            page_index INTEGER NOT NULL,
            relative_path TEXT NOT NULL
          )
        ''');

        // Create indexes for faster search (instead of FTS5 which isn't available on all devices)
        await db.execute('CREATE INDEX idx_documents_name ON documents(name)');
        await db.execute('CREATE INDEX idx_documents_folder ON documents(folder_id)');
        await db.execute('CREATE INDEX idx_documents_updated ON documents(updated_at DESC)');

        final now = DateTime.now().millisecondsSinceEpoch;
        await db.insert('folders', {
          'id': defaultFolderId,
          'name': defaultFolderName,
          'created_at': now,
          'updated_at': now,
        });
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        // Drop old FTS tables/triggers if upgrading from v1
        if (oldVersion < 2) {
          try {
            await db.execute('DROP TRIGGER IF EXISTS documents_ai');
            await db.execute('DROP TRIGGER IF EXISTS documents_ad');
            await db.execute('DROP TRIGGER IF EXISTS documents_au');
            await db.execute('DROP TABLE IF EXISTS documents_fts');
          } catch (_) {
            // Ignore errors if tables don't exist
          }
          // Create indexes
          await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name)');
          await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id)');
          await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at DESC)');
        }
      },
    );
  }
}

