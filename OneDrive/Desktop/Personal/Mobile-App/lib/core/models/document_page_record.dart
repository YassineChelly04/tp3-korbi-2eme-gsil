class DocumentPageRecord {
  const DocumentPageRecord({
    required this.id,
    required this.documentId,
    required this.pageIndex,
    required this.relativePath,
  });

  final String id;
  final String documentId;
  final int pageIndex;
  final String relativePath;

  factory DocumentPageRecord.fromMap(Map<String, Object?> map) {
    return DocumentPageRecord(
      id: map['id']! as String,
      documentId: map['document_id']! as String,
      pageIndex: map['page_index']! as int,
      relativePath: map['relative_path']! as String,
    );
  }

  Map<String, Object?> toMap() {
    return {
      'id': id,
      'document_id': documentId,
      'page_index': pageIndex,
      'relative_path': relativePath,
    };
  }
}

