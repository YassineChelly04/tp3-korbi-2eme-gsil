import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

class FileService {
  Future<Directory> _appDocumentsDir() async {
    return getApplicationDocumentsDirectory();
  }

  Future<String> absoluteFromRelative(String relativePath) async {
    final root = await _appDocumentsDir();
    return p.join(root.path, relativePath);
  }

  Future<Directory> _ensureDir(String relativePath) async {
    final root = await _appDocumentsDir();
    final dir = Directory(p.join(root.path, relativePath));
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir;
  }

  Future<File> createTempJpeg(String fileName) async {
    final tempDir = await getTemporaryDirectory();
    final file = File(p.join(tempDir.path, fileName));
    if (await file.exists()) {
      await file.delete();
    }
    return file;
  }

  Future<String> ensureDocumentPdfPath({
    required String folderId,
    required String documentId,
  }) async {
    final relativeFolder = folderId == 'inbox' ? 'inbox' : 'folders/$folderId';
    final dir = await _ensureDir(relativeFolder);
    return p.join(dir.path, '$documentId.pdf');
  }

  Future<String> ensurePageImagePath({
    required String folderId,
    required String documentId,
    required int pageIndex,
  }) async {
    final relativeFolder = folderId == 'inbox' ? 'inbox' : 'folders/$folderId';
    final dir = await _ensureDir(relativeFolder);
    return p.join(dir.path, '${documentId}_p$pageIndex.jpg');
  }

  Future<String> toRelativePath(String absolutePath) async {
    final root = await _appDocumentsDir();
    return p.relative(absolutePath, from: root.path);
  }

  Future<int> fileSize(String absolutePath) async {
    final file = File(absolutePath);
    if (!await file.exists()) {
      return 0;
    }
    return file.length();
  }

  Future<void> deleteIfExists(String absolutePath) async {
    final file = File(absolutePath);
    if (await file.exists()) {
      await file.delete();
    }
  }

  Future<void> deleteMany(Iterable<String> absolutePaths) async {
    for (final absolutePath in absolutePaths) {
      await deleteIfExists(absolutePath);
    }
  }
}

