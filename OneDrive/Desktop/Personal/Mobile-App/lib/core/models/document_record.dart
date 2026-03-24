import 'scan_filter.dart';

class DocumentRecord {
  const DocumentRecord({
    required this.id,
    required this.folderId,
    required this.name,
    required this.relativePath,
    required this.pageCount,
    required this.fileSize,
    required this.ocrStatus,
    required this.ocrText,
    required this.filterUsed,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String folderId;
  final String name;
  final String relativePath;
  final int pageCount;
  final int fileSize;
  final String ocrStatus;
  final String ocrText;
  final ScanFilter filterUsed;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory DocumentRecord.fromMap(Map<String, Object?> map) {
    return DocumentRecord(
      id: map['id']! as String,
      folderId: map['folder_id']! as String,
      name: map['name']! as String,
      relativePath: map['relative_path']! as String,
      pageCount: map['page_count']! as int,
      fileSize: map['file_size']! as int,
      ocrStatus: map['ocr_status']! as String,
      ocrText: (map['ocr_text'] as String?) ?? '',
      filterUsed: ScanFilterX.fromDb(map['filter_used']! as String),
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at']! as int),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updated_at']! as int),
    );
  }

  Map<String, Object?> toMap() {
    return {
      'id': id,
      'folder_id': folderId,
      'name': name,
      'relative_path': relativePath,
      'page_count': pageCount,
      'file_size': fileSize,
      'ocr_status': ocrStatus,
      'ocr_text': ocrText,
      'filter_used': filterUsed.dbValue,
      'created_at': createdAt.millisecondsSinceEpoch,
      'updated_at': updatedAt.millisecondsSinceEpoch,
    };
  }

  DocumentRecord copyWith({
    String? name,
    String? ocrStatus,
    String? ocrText,
    DateTime? updatedAt,
  }) {
    return DocumentRecord(
      id: id,
      folderId: folderId,
      name: name ?? this.name,
      relativePath: relativePath,
      pageCount: pageCount,
      fileSize: fileSize,
      ocrStatus: ocrStatus ?? this.ocrStatus,
      ocrText: ocrText ?? this.ocrText,
      filterUsed: filterUsed,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

